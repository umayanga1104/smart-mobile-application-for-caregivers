# inference.py v5 — FINAL CORRECT VERSION

import numpy as np
import json, joblib, os
from features import (
    compute_hr_features, compute_temp_features,
    compute_acc_features, acc_ms2_to_g, synthesize_acc_features,
)


def generate_watch_hr(mean_bpm: float, variability: float,
                      n_seconds: int = 60, seed: int = None) -> list:
    """
    Generate realistic smartwatch HR readings.

    A Galaxy Watch HR sensor works like this:
    - Updates every ~1-2 seconds
    - Changes SLOWLY (autocorrelated) — not random jumps
    - Variability (std) over 60s window:
        Resting/relaxed   : 2-5  BPM
        Mild stress/anxiety: 5-10 BPM
        Heavy stress (TSST): 8-15 BPM
        Light exercise     : 3-8  BPM
        Running            : 3-6  BPM  (stable high)

    Parameters
    ----------
    mean_bpm    : target mean HR in BPM
    variability : desired std in BPM over the window
    n_seconds   : number of 1-sec samples (= window size)
    seed        : random seed for reproducibility

    Returns
    -------
    list of HR values in BPM, length = n_seconds
    """
    if seed is not None:
        np.random.seed(seed)

    # AR(1) process: HR[t] = mean + phi*(HR[t-1]-mean) + noise
    # phi controls autocorrelation (0=white noise, 0.95=very smooth)
    # noise_std controls point-to-point variation
    phi = 0.92                          # strong autocorrelation
    noise_std = variability * np.sqrt(1 - phi**2)

    hr = np.zeros(n_seconds)
    hr[0] = mean_bpm + np.random.normal(0, variability * 0.5)
    for t in range(1, n_seconds):
        hr[t] = (mean_bpm
                 + phi * (hr[t-1] - mean_bpm)
                 + np.random.normal(0, noise_std))

    # clip to physiological range
    hr = np.clip(hr, 30, 220)
    return hr.tolist()


# Add this method to StressPredictor class, and modify predict()

class StressPredictor:
    def __init__(self, model_dir: str = "./stress_model"):
        print("LOADING MODEL FROM:", model_dir)

        self.model   = joblib.load(f"{model_dir}/stress_model.joblib")
        self.scaler  = joblib.load(f"{model_dir}/scaler.joblib")
        self.imputer = joblib.load(f"{model_dir}/imputer.joblib")
        with open(f"{model_dir}/metadata.json") as f:
            self.meta = json.load(f)
        self.feat_cols   = self.meta["feature_cols"]
        self.label_names = self.meta["label_names"]

        stats_path = f"{model_dir}/class_stats.json"
        self.class_stats = {}
        if os.path.isfile(stats_path):
            with open(stats_path) as f:
                self.class_stats = json.load(f)

    # ────────────────────────────────────────────────────────────── #
    def _apply_context_rules(self, raw_result: dict,
                              feat: dict,
                              baseline_hr: float = None) -> dict:
        """
        Apply physiological context rules that WESAD can't learn
        because the dataset has no exercise / sleep / etc. data.

        These rules override the ML prediction ONLY when the input
        is clearly outside the training distribution.

        baseline_hr : the user's personal long-term average HR in BPM.
                      When provided, used to compensate for individuals
                      whose natural resting HR is higher than the WESAD
                      training population mean (~72 BPM).
        """
        result = raw_result.copy()
        hr_mean   = feat.get("hr_mean", 70)
        act_level = feat.get("activity_level", 0)
        hr_std    = feat.get("hr_std", 5)
        temp_mean = feat.get("temp_mean", 33)

        # ── Rule 1: High activity → NOT stress ──────────────────
        # WESAD max activity ≈ 0.01.  If activity >> 0.05, the
        # person is physically active — high HR is from exercise.
        # Stress causes high HR while SITTING STILL.
        if act_level > 0.05 and hr_mean > 100:
            result["prediction"]    = 0
            result["label"]         = "non_stress"
            result["context_rule"]  = "exercise_override"
            result["stress_score"]  = min(result.get("stress_score", 0), 15.0)
            result["confidence"]    = max(result.get("confidence", 0), 0.80)
            result["note"] = (
                "High activity + high HR detected → exercise, not stress. "
                "WESAD has no exercise data; this rule compensates."
            )

        # ── Rule 2: Very low HR + low variability → calm ────────
        # If HR < 60 and very stable, this is deep rest / sleep.
        if hr_mean < 58 and hr_std < 3:
            result["prediction"]    = 0
            result["label"]         = "non_stress"
            result["context_rule"]  = "deep_rest"
            result["stress_score"]  = min(result.get("stress_score", 0), 5.0)
            result["confidence"]    = max(result.get("confidence", 0), 0.90)

        # ── Rule 3: Personal baseline HR → compensate for high-resting-HR ──
        # WESAD training HR non-stress mean = 72.3 BPM, stress mean = 81.3 BPM.
        # If the user's natural resting HR is higher (e.g. 85 BPM), the model
        # will always over-predict stress. We override to non_stress when the
        # current HR is within 10 BPM of the user's personal average AND
        # activity is low (they're not exercising).
        if (baseline_hr is not None
                and hr_mean <= baseline_hr + 10
                and act_level < 0.03):
            result["prediction"]    = 0
            result["label"]         = "non_stress"
            result["context_rule"]  = "personal_baseline"
            result["stress_score"]  = min(result.get("stress_score", 0), 35.0)
            result["confidence"]    = max(result.get("confidence", 0), 0.75)
            result["note"] = (
                f"HR ({hr_mean:.0f} BPM) is within your personal baseline range "
                f"({baseline_hr:.0f} BPM ± 10). WESAD population resting mean is "
                f"72 BPM — your naturally higher HR is not a stress signal."
            )

        return result

    # ────────────────────────────────────────────────────────────── #
    def predict(self, heart_rate, temperature,
                activity_level=None, accelerometer=None,
                accel_units="ms2", debug=False,
                baseline_hr: float = None) -> dict:

        feat = {}
        hr   = np.asarray(heart_rate,  dtype=np.float64)
        temp = np.asarray(temperature, dtype=np.float64)

        feat.update(compute_hr_features(hr))
        feat.update(compute_temp_features(temp, duration_sec=60))

        if accelerometer is not None:
            acc = np.asarray(accelerometer, dtype=np.float64)
            if accel_units == "ms2":
                acc = acc_ms2_to_g(acc)
            feat.update(compute_acc_features(acc))
        elif activity_level is not None:
            feat.update(synthesize_acc_features(activity_level))
        else:
            feat.update(synthesize_acc_features(0.0))

        if debug and self.class_stats:
            ns = self.class_stats.get("non_stress", {})
            st = self.class_stats.get("stress",     {})
            keys = ["hr_mean","hr_std","hr_cv",
                    "hrv_rmssd","hrv_sdnn","hrv_cv_ibi",
                    "temp_mean","activity_level"]
            print(f"\n  {'Feature':<20s} {'YOUR VALUE':>12s} "
                  f"{'non_stress':>12s} {'stress':>12s} {'match?':>10s}")
            print(f"  {'─'*68}")
            for col in keys:
                v  = feat.get(col, float('nan'))
                nm = ns.get(col, {}).get("mean", 0)
                ns_= ns.get(col, {}).get("std",  1)
                sm = st.get(col, {}).get("mean", 0)
                st_= st.get(col, {}).get("std",  1)
                d_ns = abs(v - nm) / max(ns_, 1e-6)
                d_st = abs(v - sm) / max(st_, 1e-6)
                match = "→ STRESS " if d_st < d_ns else "→ non_str"
                print(f"  {col:<20s} {v:>12.3f} {nm:>12.3f} "
                      f"{sm:>12.3f} {match:>10s}")

        # ── ML prediction ──
        vec  = np.array([[feat.get(c, np.nan) for c in self.feat_cols]])
        vec  = self.scaler.transform(self.imputer.transform(vec))
        pred = int(self.model.predict(vec)[0])
        out  = dict(prediction=pred, label=self.label_names[str(pred)])

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(vec)[0]
            out["confidence"] = float(proba.max())
            out["probabilities"] = {
                self.label_names[str(i)]: round(float(p), 4)
                for i, p in enumerate(proba)
            }
            si = [k for k, v in self.label_names.items()
                  if v == "stress"]
            if si:
                out["stress_score"] = round(
                    float(proba[int(si[0])]) * 100, 1
                )

        # ── Apply context rules ──
        out = self._apply_context_rules(out, feat, baseline_hr=baseline_hr)

        return out

    # ── rest of class stays the same ──
    def predict_wesad_samples(self, csv_path="wesad_features_v3.csv",
                               n_each=5):
        import pandas as pd
        df   = pd.read_csv(csv_path)
        lmap = {1: 0, 2: 1, 3: 0, 4: 0}
        df   = df[df["label"].isin(lmap)].copy()
        df["y"] = df["label"].map(lmap)

        for cls_name, cls_val in [("STRESS", 1), ("NON-STRESS", 0)]:
            subset = df[df["y"] == cls_val].sample(
                min(n_each, sum(df["y"] == cls_val)), random_state=42
            )
            print(f"\n  {n_each} actual {cls_name} windows:")
            correct = 0
            for _, row in subset.iterrows():
                vec = np.array([[row.get(c, np.nan)
                                 for c in self.feat_cols]])
                vec  = self.scaler.transform(
                    self.imputer.transform(vec))
                pred = int(self.model.predict(vec)[0])
                proba= self.model.predict_proba(vec)[0]
                label= self.label_names[str(pred)]
                ok   = (pred == cls_val)
                correct += ok
                icon = "✓" if ok else "✗"
                print(f"    {icon}  S{int(row.get('subject_id',0)):>2d}"
                      f"  →  {label:<12s}  "
                      f"stress={proba[1]:.1%}  "
                      f"hr_mean={row.get('hr_mean',0):.1f}  "
                      f"hr_std={row.get('hr_std',0):.2f}")
            print(f"    Accuracy: {correct}/{len(subset)}")

    def validate_with_training_data(self,
                                     csv_path="wesad_features_v3.csv"):
        import pandas as pd
        from sklearn.metrics import classification_report
        df   = pd.read_csv(csv_path)
        lmap = {1: 0, 2: 1, 3: 0, 4: 0}
        df   = df[df["label"].isin(lmap)].copy()
        df["y"] = df["label"].map(lmap)
        feat_cols = [c for c in self.feat_cols if c in df.columns]
        X = df[feat_cols].values
        y = df["y"].values
        X = self.scaler.transform(self.imputer.transform(X))
        print(classification_report(
            y, self.model.predict(X),
            target_names=["non_stress", "stress"]
        ))


# ══════════════════════════════════════════════════════════════════
def generate_watch_hr(mean_bpm, variability, n_seconds=60, seed=None):
    if seed is not None:
        np.random.seed(seed)
    phi = 0.92
    noise_std = variability * np.sqrt(1 - phi**2)
    hr = np.zeros(n_seconds)
    hr[0] = mean_bpm + np.random.normal(0, variability * 0.5)
    for t in range(1, n_seconds):
        hr[t] = (mean_bpm
                 + phi * (hr[t-1] - mean_bpm)
                 + np.random.normal(0, noise_std))
    return np.clip(hr, 30, 220).tolist()


def _show(label, r):
    icon = "🔴" if r["label"] == "stress" else "🟢"
    print(f"\n  {icon}  {label}")
    print(f"     Prediction  : {r['label']}")
    print(f"     Confidence  : {r.get('confidence', 0):.1%}")
    print(f"     Stress score: {r.get('stress_score', 'N/A')}/100")
    if "context_rule" in r:
        print(f"     Context rule: {r['context_rule']}")
    if "note" in r:
        print(f"     Note        : {r['note']}")


if __name__ == "__main__":
    pred = StressPredictor("./stress_model")

    # ── training distribution ──
    if pred.class_stats:
        ns = pred.class_stats.get("non_stress", {})
        st = pred.class_stats.get("stress",     {})
        print("=" * 70)
        print("  TRAINING DISTRIBUTION")
        print("=" * 70)
        print(f"\n  {'Feature':<20s} {'non_stress':>12s} "
              f"{'stress':>12s} {'diff':>10s}")
        print(f"  {'─'*54}")
        for col in ["hr_mean","hr_std","hr_cv","hrv_rmssd",
                     "hrv_sdnn","hrv_cv_ibi",
                     "temp_mean","temp_slope","activity_level"]:
            nm = ns.get(col, {}).get("mean", 0)
            sm = st.get(col, {}).get("mean", 0)
            print(f"  {col:<20s} {nm:>12.3f} {sm:>12.3f}"
                  f" {sm-nm:>+10.3f}")

    # ── WESAD proof ──
    csv_path = "wesad_features_v3.csv"
    if os.path.isfile(csv_path):
        print("\n" + "=" * 70)
        print("  PROOF: real WESAD windows")
        print("=" * 70)
        pred.predict_wesad_samples(csv_path, n_each=5)
        print("\n" + "=" * 70)
        print("  FULL VALIDATION")
        print("=" * 70)
        pred.validate_with_training_data(csv_path)

    # ── demo scenarios ──
    print("\n" + "=" * 70)
    print("  DEMO: Galaxy Watch scenarios")
    print("=" * 70)

    # S1: Stressed (TSST-like)
    r = pred.predict(
        heart_rate  = generate_watch_hr(82, variability=9, seed=1),
        temperature = [32.8,32.7,32.6,32.5,32.4,32.3,
                       32.3,32.2,32.2,32.1,32.1,32.0],
        activity_level = 1.5, debug=True,
    )
    _show("Stressed — TSST (speaking + arithmetic)", r)

    # S2: Relaxed
    r = pred.predict(
        heart_rate  = generate_watch_hr(68, variability=3, seed=2),
        temperature = [34.5,34.5,34.6,34.6,34.6,34.7,
                       34.7,34.7,34.7,34.8,34.8,34.8],
        activity_level = 0.3, debug=True,
    )
    _show("Relaxed — calm baseline", r)

    # S3: Running → exercise override kicks in
    r = pred.predict(
        heart_rate  = generate_watch_hr(140, variability=4, seed=3),
        temperature = [35.5,35.6,35.7,35.8,35.9,36.0,
                       36.0,36.1,36.1,36.2,36.2,36.3],
        activity_level = 8.5, debug=True,
    )
    _show("Exercising — running", r)

    # S4: Mild anxiety
    r = pred.predict(
        heart_rate  = generate_watch_hr(78, variability=7, seed=4),
        temperature = [33.5,33.4,33.3,33.3,33.2,33.1,
                       33.1,33.0,33.0,32.9,32.9,32.8],
        activity_level = 1.0, debug=True,
    )
    _show("Mild anxiety — pre-exam", r)

    # S5: Meditation
    r = pred.predict(
        heart_rate  = generate_watch_hr(62, variability=2, seed=5),
        temperature = [35.0,35.0,35.1,35.1,35.1,35.2,
                       35.2,35.2,35.2,35.3,35.3,35.3],
        activity_level = 0.1, debug=True,
    )
    _show("Meditation / deep rest", r)

    print()

# ══════════════════════════════════════════════════════════════════════
def _show(label, r):
    icon = "🔴" if r["label"] == "stress" else "🟢"
    print(f"\n  {icon}  {label}")
    print(f"     Prediction  : {r['label']}")
    print(f"     Confidence  : {r.get('confidence', 0):.1%}")
    print(f"     Stress score: {r.get('stress_score', 'N/A')}/100")


if __name__ == "__main__":
    pred = StressPredictor("./stress_model")

    # ── print training distribution ──────────────────────────────
    if pred.class_stats:
        ns = pred.class_stats.get("non_stress", {})
        st = pred.class_stats.get("stress",     {})
        print("=" * 70)
        print("  TRAINING DISTRIBUTION  (after smoothing)")
        print("=" * 70)
        print(f"\n  {'Feature':<20s} {'non_stress':>12s} "
              f"{'stress':>12s} {'diff':>10s}")
        print(f"  {'─'*54}")
        for col in ["hr_mean","hr_std","hr_cv",
                     "hrv_rmssd","hrv_sdnn","hrv_cv_ibi",
                     "temp_mean","temp_slope","activity_level"]:
            nm = ns.get(col, {}).get("mean", 0)
            sm = st.get(col, {}).get("mean", 0)
            print(f"  {col:<20s} {nm:>12.3f} {sm:>12.3f} {sm-nm:>+10.3f}")

    # ── WESAD window predictions ──────────────────────────────────
    csv_path = "wesad_features_v3.csv"
    if os.path.isfile(csv_path):
        print("\n" + "=" * 70)
        print("  PROOF: predictions on real WESAD windows")
        print("=" * 70)
        pred.predict_wesad_samples(csv_path, n_each=5)

        print("\n" + "=" * 70)
        print("  FULL VALIDATION")
        print("=" * 70)
        pred.validate_with_training_data(csv_path)

    # ══════════════════════════════════════════════════════════════
    #  DEMO SCENARIOS with realistic correlated HR
    # ══════════════════════════════════════════════════════════════
    print("\n" + "=" * 70)
    print("  DEMO: Galaxy Watch simulated inputs")
    print("        (using realistic autocorrelated HR)")
    print("=" * 70)

    # ── S1: TSST Stress ──────────────────────────────────────────
    # Elevated HR (~82), variability ~8-10 BPM (matches stress training)
    r = pred.predict(
        heart_rate  = generate_watch_hr(82, variability=9, seed=1),
        temperature = [32.8,32.7,32.6,32.5,32.4,32.3,
                       32.3,32.2,32.2,32.1,32.1,32.0],
        activity_level = 1.5,
        debug=True,
    )
    _show("Stressed — TSST (speaking + arithmetic)", r)

    # ── S2: Relaxed Baseline ─────────────────────────────────────
    # Low HR (~68), low variability ~3 BPM
    r = pred.predict(
        heart_rate  = generate_watch_hr(68, variability=3, seed=2),
        temperature = [34.5,34.5,34.6,34.6,34.6,34.7,
                       34.7,34.7,34.7,34.8,34.8,34.8],
        activity_level = 0.3,
        debug=True,
    )
    _show("Relaxed — calm baseline (reading)", r)

    # ── S3: Running ──────────────────────────────────────────────
    # Very high HR (~140), low variability (exercise = stable high HR)
    # high activity_level distinguishes from stress
    r = pred.predict(
        heart_rate  = generate_watch_hr(140, variability=4, seed=3),
        temperature = [35.5,35.6,35.7,35.8,35.9,36.0,
                       36.0,36.1,36.1,36.2,36.2,36.3],
        activity_level = 8.5,
        debug=True,
    )
    _show("Exercising — running", r)

    # ── S4: Mild Anxiety ─────────────────────────────────────────
    # Mildly elevated HR (~78), moderate variability ~7 BPM
    r = pred.predict(
        heart_rate  = generate_watch_hr(78, variability=7, seed=4),
        temperature = [33.5,33.4,33.3,33.3,33.2,33.1,
                       33.1,33.0,33.0,32.9,32.9,32.8],
        activity_level = 1.0,
        debug=True,
    )
    _show("Mild anxiety — pre-exam", r)

    # ── S5: Meditation ───────────────────────────────────────────
    # Low HR (~62), very low variability ~2 BPM, warm skin
    r = pred.predict(
        heart_rate  = generate_watch_hr(62, variability=2, seed=5),
        temperature = [35.0,35.0,35.1,35.1,35.1,35.2,
                       35.2,35.2,35.2,35.3,35.3,35.3],
        activity_level = 0.1,
        debug=True,
    )
    _show("Meditation / deep rest", r)

    # ── S6: Late-night fatigue ───────────────────────────────────
    r = pred.predict(
        heart_rate  = generate_watch_hr(74, variability=5, seed=6),
        temperature = [33.9,33.8,33.8,33.7,33.7,33.6,
                       33.6,33.6,33.5,33.5,33.5,33.4],
        activity_level = 0.8,
        debug=True,
    )
    _show("Fatigue / late-night work", r)

    print()