"""
train_model.py v3 — Stress Prediction Training  (WESAD)
═══════════════════════════════════════════════════════════
KEY FIX: Uses features.py for feature computation — identical
code path to inference.py.  No more domain mismatch.

Run:  python train_model.py
"""

import numpy as np
import pandas as pd
import pickle, os, json, time, warnings
from collections import Counter

from sklearn.base import clone
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
)
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import LeaveOneGroupOut
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, f1_score,
)
from sklearn.impute import SimpleImputer
import joblib

# ★ shared feature computation — same code as inference.py
from features import (
    bvp_to_hr_1hz,
    compute_hr_features,
    compute_temp_features,
    compute_acc_features,
    ALL_FEATURE_NAMES,
)

warnings.filterwarnings("ignore")


# ══════════════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════════════
class Config:
    WESAD_PATH   = "./WESAD"
    MODEL_OUTPUT = "./stress_model"

    SUBJECTS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17]

    FS_BVP   = 64     # Hz  (Empatica E4)
    FS_ACC   = 32     # Hz, raw units vary — auto-detected
    FS_TEMP  = 4      # Hz, °C
    FS_LABEL = 700    # Hz  (RespiBAN chest label rate)

    WINDOW_SEC = 60
    STEP_SEC   = 30

    MODE = "binary"   # "binary" → stress vs non-stress


# ══════════════════════════════════════════════════════════════════════
#  LOADER
# ══════════════════════════════════════════════════════════════════════
class WESADLoader:
    def __init__(self, cfg):
        self.cfg = cfg

    def load_all(self):
        data = {}
        for sid in self.cfg.SUBJECTS:
            pkl = os.path.join(self.cfg.WESAD_PATH, f"S{sid}", f"S{sid}.pkl")
            if not os.path.isfile(pkl):
                print(f"  S{sid}  ✗  not found")
                continue

            print(f"  S{sid}  ", end="")
            with open(pkl, "rb") as f:
                raw = pickle.load(f, encoding="latin1")

            w = raw["signal"]["wrist"]
            acc = w["ACC"].astype(np.float64)

            # ── auto-detect ACC units → convert to g ──
            sample_mag = np.median(np.linalg.norm(acc[:2000], axis=1))
            if sample_mag > 50:
                scale = round(sample_mag)
                acc /= scale
                print(f"(ACC÷{scale}→g) ", end="")
            elif sample_mag > 5:
                acc /= 9.81
                print(f"(ACC÷9.81→g) ", end="")
            # else already in g

            entry = dict(
                BVP   = w["BVP"].flatten().astype(np.float64),
                ACC   = acc,
                TEMP  = w["TEMP"].flatten().astype(np.float64),
                label = raw["label"].flatten(),
            )
            counts = Counter(entry["label"])
            print(f"✓  {dict(counts)}")
            data[sid] = entry
        return data


# ══════════════════════════════════════════════════════════════════════
#  FEATURE EXTRACTION
# ══════════════════════════════════════════════════════════════════════
class FeatureExtractor:
    def __init__(self, cfg):
        self.cfg = cfg

    @staticmethod
    def _majority_label(labels):
        c = Counter(labels)
        c.pop(0, None)
        return c.most_common(1)[0][0] if c else 0

    def extract_subject(self, subj):
        cfg = self.cfg
        bvp   = subj["BVP"]
        acc   = subj["ACC"]       # already in g
        temp  = subj["TEMP"]
        label = subj["label"]

        total_sec = min(
            len(bvp)   / cfg.FS_BVP,
            len(acc)   / cfg.FS_ACC,
            len(temp)  / cfg.FS_TEMP,
            len(label) / cfg.FS_LABEL,
        )
        n_win = int((total_sec - cfg.WINDOW_SEC) / cfg.STEP_SEC) + 1
        rows  = []

        for w in range(n_win):
            t0 = w * cfg.STEP_SEC
            t1 = t0 + cfg.WINDOW_SEC

            # ── slice each sensor ──
            bvp_win  = bvp [int(t0 * cfg.FS_BVP) : int(t1 * cfg.FS_BVP)]
            acc_win  = acc [int(t0 * cfg.FS_ACC) : int(t1 * cfg.FS_ACC)]
            temp_win = temp[int(t0 * cfg.FS_TEMP): int(t1 * cfg.FS_TEMP)]
            lbl_win  = label[int(t0 * cfg.FS_LABEL): int(t1 * cfg.FS_LABEL)]

            lbl = self._majority_label(lbl_win)
            if lbl == 0:
                continue

            # ═══════════════════════════════════════════════════════════
            #  ★  KEY: same functions as inference.py
            # ═══════════════════════════════════════════════════════════

            # BVP → 1 Hz HR (simulates watch output)
            hr_1hz = bvp_to_hr_1hz(bvp_win, fs=cfg.FS_BVP)

            row = {}
            row.update(compute_hr_features(hr_1hz))          # ← shared
            row.update(compute_temp_features(                 # ← shared
                temp_win, duration_sec=cfg.WINDOW_SEC
            ))
            row.update(compute_acc_features(acc_win))         # ← shared
            row["label"] = lbl
            rows.append(row)

        return pd.DataFrame(rows)

    def extract_all(self, all_data):
        parts = []
        for sid, subj in all_data.items():
            print(f"  S{sid}  ", end="")
            df = self.extract_subject(subj)
            df["subject_id"] = sid
            parts.append(df)
            print(f"✓  {len(df)} windows")
        return pd.concat(parts, ignore_index=True)


# ══════════════════════════════════════════════════════════════════════
#  TRAINER
# ══════════════════════════════════════════════════════════════════════
class StressTrainer:
    def __init__(self, cfg):
        self.cfg          = cfg
        self.feature_cols = None
        self.imputer      = None
        self.scaler       = None
        self.best_model   = None
        self.label_names  = None

    def prepare(self, df):
        if self.cfg.MODE == "binary":
            lmap = {1: 0, 2: 1, 3: 0, 4: 0}
            self.label_names = {0: "non_stress", 1: "stress"}
        else:
            lmap = {1: 0, 2: 1, 3: 2, 4: 3}
            self.label_names = {
                0: "baseline", 1: "stress",
                2: "amusement", 3: "meditation",
            }

        df = df[df["label"].isin(lmap)].copy()
        df["y"] = df["label"].map(lmap)

        meta = {"label", "y", "subject_id"}
        self.feature_cols = sorted([c for c in df.columns if c not in meta])

        X = df[self.feature_cols].values.astype(np.float64)
        y = df["y"].values.astype(int)
        g = df["subject_id"].values

        print(f"\n  Features      : {len(self.feature_cols)}")
        print(f"  Windows       : {len(X)}")
        print(f"  Classes       : {dict(Counter(y))}")

        # ── per-class feature statistics ──
        self._class_stats = {}
        for cls in sorted(set(y)):
            mask = y == cls
            cls_name = self.label_names[cls]
            self._class_stats[cls_name] = {}
            for i, col in enumerate(self.feature_cols):
                vals = X[mask, i]
                valid = vals[~np.isnan(vals)]
                if len(valid) > 0:
                    self._class_stats[cls_name][col] = {
                        "mean": float(np.mean(valid)),
                        "std":  float(np.std(valid)),
                    }

        print(f"\n  {'Feature':<22s} {'non_stress':>12s} {'stress':>12s} {'diff':>8s}")
        print(f"  {'─'*56}")
        for col in self.feature_cols:
            ns = self._class_stats.get("non_stress", {}).get(col, {})
            st = self._class_stats.get("stress", {}).get(col, {})
            nm = ns.get("mean", 0)
            sm = st.get("mean", 0)
            diff = sm - nm
            print(f"  {col:<22s} {nm:>12.3f} {sm:>12.3f} {diff:>+8.3f}")

        return X, y, g

    def train_evaluate(self, X, y, groups):
        self.imputer = SimpleImputer(strategy="median")
        self.scaler  = StandardScaler()
        Xc = self.scaler.fit_transform(self.imputer.fit_transform(X))

        models = {}
        models["RandomForest"] = RandomForestClassifier(
            n_estimators=500, max_depth=18, min_samples_leaf=3,
            class_weight="balanced", random_state=42, n_jobs=-1,
        )
        models["ExtraTrees"] = ExtraTreesClassifier(
            n_estimators=500, max_depth=18, min_samples_leaf=3,
            class_weight="balanced", random_state=42, n_jobs=-1,
        )
        models["GradientBoosting"] = GradientBoostingClassifier(
            n_estimators=400, max_depth=5, learning_rate=0.05,
            subsample=0.8, random_state=42,
        )

        try:
            import xgboost as xgb
            spw = np.sum(y == 0) / max(np.sum(y == 1), 1)
            models["XGBoost"] = xgb.XGBClassifier(
                n_estimators=500, max_depth=6, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8,
                scale_pos_weight=spw, eval_metric="logloss",
                random_state=42, n_jobs=-1,
            )
        except ImportError:
            pass

        try:
            import lightgbm as lgb
            models["LightGBM"] = lgb.LGBMClassifier(
                n_estimators=500, max_depth=7, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8,
                class_weight="balanced", random_state=42,
                n_jobs=-1, verbose=-1,
            )
        except ImportError:
            pass

        logo = LeaveOneGroupOut()
        best_f1, best_name = -1, None
        target_names = [self.label_names[i] for i in sorted(self.label_names)]

        print("\n" + "=" * 64)
        print("  LEAVE-ONE-SUBJECT-OUT  CROSS-VALIDATION")
        print("=" * 64)

        for name, mdl in models.items():
            t0 = time.time()
            y_pred = np.zeros_like(y)

            for tr, te in logo.split(Xc, y, groups):
                imp = SimpleImputer(strategy="median")
                sc  = StandardScaler()
                Xtr = sc.fit_transform(imp.fit_transform(X[tr]))
                Xte = sc.transform(imp.transform(X[te]))

                m = clone(mdl)
                m.fit(Xtr, y[tr])
                y_pred[te] = m.predict(Xte)

            acc = accuracy_score(y, y_pred)
            f1  = f1_score(y, y_pred, average="weighted")
            dt  = time.time() - t0

            print(f"\n  {name}  acc={acc:.4f}  F1w={f1:.4f}  ({dt:.1f}s)")
            print(classification_report(y, y_pred, target_names=target_names))
            print(f"  Confusion matrix:\n  {confusion_matrix(y, y_pred)}\n")

            if f1 > best_f1:
                best_f1, best_name = f1, name

        print(f"\n  ★  BEST: {best_name}  F1w={best_f1:.4f}")

        # retrain on all data
        self.best_model = clone(models[best_name])
        self.best_model.fit(Xc, y)

        return best_name, best_f1

    def save(self):
        out = self.cfg.MODEL_OUTPUT
        os.makedirs(out, exist_ok=True)

        joblib.dump(self.best_model, f"{out}/stress_model.joblib")
        joblib.dump(self.scaler,     f"{out}/scaler.joblib")
        joblib.dump(self.imputer,    f"{out}/imputer.joblib")

        meta = dict(
            feature_cols = self.feature_cols,
            label_names  = {str(k): v for k, v in self.label_names.items()},
            mode         = self.cfg.MODE,
            window_sec   = self.cfg.WINDOW_SEC,
            model_type   = type(self.best_model).__name__,
        )
        with open(f"{out}/metadata.json", "w") as f:
            json.dump(meta, f, indent=2)

        with open(f"{out}/class_stats.json", "w") as f:
            json.dump(self._class_stats, f, indent=2)

        if hasattr(self.best_model, "feature_importances_"):
            fi = pd.DataFrame({
                "feature": self.feature_cols,
                "importance": self.best_model.feature_importances_,
            }).sort_values("importance", ascending=False)
            fi.to_csv(f"{out}/feature_importance.csv", index=False)
            print(f"\n  Top 15 features:")
            print(fi.head(15).to_string(index=False))

        print(f"\n  Saved → {out}/")


# ══════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════
def main():
    print("""
    ╔════════════════════════════════════════════════════════╗
    ║   STRESS PREDICTION v3  ·  Shared Feature Pipeline    ║
    ╚════════════════════════════════════════════════════════╝
    """)
    cfg = Config()

    print("[1/4]  Loading WESAD …")
    loader = WESADLoader(cfg)
    data   = loader.load_all()
    if not data:
        print(f"  ✗  No data at {cfg.WESAD_PATH}")
        return

    print("\n[2/4]  Extracting features (BVP → 1Hz HR → shared pipeline) …")
    ext = FeatureExtractor(cfg)
    df  = ext.extract_all(data)
    df.to_csv("wesad_features_v3.csv", index=False)
    print(f"\n  Total: {len(df)} windows → wesad_features_v3.csv")

    print("\n[3/4]  Training …")
    trainer = StressTrainer(cfg)
    X, y, g = trainer.prepare(df)
    trainer.train_evaluate(X, y, g)

    print("\n[4/4]  Saving …")
    trainer.save()
    print("\n  ✓  Done!  Run:  python inference.py\n")


if __name__ == "__main__":
    main()