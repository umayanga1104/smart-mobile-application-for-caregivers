"""
generate_plots.py — Generate evaluation figures from the saved stress model.

Outputs (saved next to this script):
  confusion_matrix.png        — Normalised + raw-count confusion matrix
  feature_importance_top15.png — Horizontal bar chart of the top 15 features

Run from the stress_prediction directory:
    python generate_plots.py
"""

import os
import json

import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")          # headless backend — no display required
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

# ── paths (all relative to this script's directory) ──────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR    = os.path.join(SCRIPT_DIR, "stress_model")
CSV_PATH     = os.path.join(SCRIPT_DIR, "wesad_features_v3.csv")
OUT_DIR      = SCRIPT_DIR                 # save images here

STYLE = {
    "figure.facecolor": "white",
    "axes.facecolor":   "white",
    "axes.spines.top":  False,
    "axes.spines.right": False,
    "font.family":      "DejaVu Sans",
}


# ═════════════════════════════════════════════════════════════════════
# 1.  Load artefacts
# ═════════════════════════════════════════════════════════════════════
def load_artefacts():
    model   = joblib.load(os.path.join(MODEL_DIR, "stress_model.joblib"))
    scaler  = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
    imputer = joblib.load(os.path.join(MODEL_DIR, "imputer.joblib"))

    with open(os.path.join(MODEL_DIR, "metadata.json")) as f:
        meta = json.load(f)

    fi_path = os.path.join(MODEL_DIR, "feature_importance.csv")
    fi_df   = pd.read_csv(fi_path)

    return model, scaler, imputer, meta, fi_df


# ═════════════════════════════════════════════════════════════════════
# 2.  Prepare data (same label mapping as train_model.py binary mode)
# ═════════════════════════════════════════════════════════════════════
def load_data(meta, imputer, scaler):
    df = pd.read_csv(CSV_PATH)

    # binary label map  {1→non_stress, 2→stress, 3→non_stress, 4→non_stress}
    lmap = {1: 0, 2: 1, 3: 0, 4: 0}
    df = df[df["label"].isin(lmap)].copy()
    df["y"] = df["label"].map(lmap)

    feature_cols = meta["feature_cols"]
    X = df[feature_cols].values.astype(np.float64)
    y = df["y"].values.astype(int)

    X = scaler.transform(imputer.transform(X))
    return X, y


# ═════════════════════════════════════════════════════════════════════
# 3.  Confusion Matrix
# ═════════════════════════════════════════════════════════════════════
def plot_confusion_matrix(model, X, y, label_names, out_path):
    y_pred = model.predict(X)
    cm     = confusion_matrix(y, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    class_labels = [label_names[str(i)] for i in sorted(label_names, key=int)]
    display_labels = [lbl.replace("_", " ").title() for lbl in class_labels]

    with plt.rc_context(STYLE):
        fig, axes = plt.subplots(1, 2, figsize=(12, 5))
        fig.suptitle("Stress Prediction — Confusion Matrix", fontsize=15, fontweight="bold", y=1.01)

        # Left: raw counts
        disp_raw = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=display_labels)
        disp_raw.plot(ax=axes[0], colorbar=False, cmap="Blues")
        axes[0].set_title("Raw Counts", fontsize=12)
        axes[0].set_xlabel("Predicted Label", fontsize=11)
        axes[0].set_ylabel("True Label", fontsize=11)

        # Right: normalised (row-wise recall)
        disp_norm = ConfusionMatrixDisplay(confusion_matrix=cm_norm, display_labels=display_labels)
        disp_norm.plot(ax=axes[1], colorbar=False, cmap="Blues", values_format=".2f")
        axes[1].set_title("Normalised (Recall)", fontsize=12)
        axes[1].set_xlabel("Predicted Label", fontsize=11)
        axes[1].set_ylabel("True Label", fontsize=11)

        # Overlay accuracy / class totals as subtitle
        total   = cm.sum()
        correct = np.trace(cm)
        acc     = correct / total
        fig.text(0.5, -0.02,
                 f"Overall Accuracy: {acc:.4f}  |  Total windows: {total:,}  "
                 f"  (Non-stress: {cm.sum(axis=1)[0]:,}, Stress: {cm.sum(axis=1)[1]:,})",
                 ha="center", fontsize=10, color="#555555")

        plt.tight_layout()
        fig.savefig(out_path, dpi=150, bbox_inches="tight")
        plt.close(fig)

    print(f"  Saved: {out_path}")
    print(f"  Accuracy: {acc:.4f}")
    print(f"  Confusion matrix (raw):\n{cm}")


# ═════════════════════════════════════════════════════════════════════
# 4.  Feature Importance — top 15 horizontal bar chart
# ═════════════════════════════════════════════════════════════════════
def plot_feature_importance(fi_df, out_path, top_n=15):
    top = fi_df.nlargest(top_n, "importance").iloc[::-1]   # lowest at top → highest at bottom

    # Friendly display names
    def fmt(name):
        return name.replace("_", " ").upper()

    labels      = [fmt(f) for f in top["feature"]]
    importances = top["importance"].values

    # colour gradient: darker = more important
    norm_vals = (importances - importances.min()) / max(importances.max() - importances.min(), 1e-9)
    colours = plt.cm.Blues(0.35 + norm_vals * 0.55)

    with plt.rc_context(STYLE):
        fig, ax = plt.subplots(figsize=(10, 7))

        bars = ax.barh(labels, importances, color=colours, edgecolor="none", height=0.65)

        # Value labels at end of each bar
        for bar, val in zip(bars, importances):
            ax.text(
                bar.get_width() + importances.max() * 0.008,
                bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}",
                va="center", ha="left", fontsize=9, color="#333333",
            )

        ax.set_title(
            f"Feature Importance — Top {top_n} Features\n"
            f"({type(None).__name__} ExtraTreesClassifier, trained on WESAD)",
            fontsize=13, fontweight="bold", pad=12,
        )
        ax.set_title(
            f"Feature Importance — Top {top_n} Features\n"
            "ExtraTreesClassifier · WESAD dataset",
            fontsize=13, fontweight="bold", pad=12,
        )
        ax.set_xlabel("Mean Decrease in Impurity (Importance)", fontsize=11)
        ax.xaxis.set_major_formatter(mticker.FormatStrFormatter("%.3f"))
        ax.tick_params(axis="y", labelsize=10)
        ax.tick_params(axis="x", labelsize=9)
        ax.set_xlim(0, importances.max() * 1.15)

        # Light vertical grid
        ax.xaxis.grid(True, linestyle="--", alpha=0.5, color="#cccccc")
        ax.set_axisbelow(True)

        plt.tight_layout()
        fig.savefig(out_path, dpi=150, bbox_inches="tight")
        plt.close(fig)

    print(f"  Saved: {out_path}")
    print(f"  Top {top_n} features:")
    for _, row in top.iloc[::-1].iterrows():
        print(f"    {row['feature']:<25s}  {row['importance']:.6f}")


# ═════════════════════════════════════════════════════════════════════
# 5.  Entry point
# ═════════════════════════════════════════════════════════════════════
def main():
    print("Loading model artefacts …")
    model, scaler, imputer, meta, fi_df = load_artefacts()
    print(f"  Model type  : {meta['model_type']}")
    print(f"  Mode        : {meta['mode']}")
    print(f"  Features    : {len(meta['feature_cols'])}")

    print("\nLoading dataset for confusion matrix …")
    X, y = load_data(meta, imputer, scaler)
    print(f"  Windows     : {len(y)}  (non_stress={int((y==0).sum())}, stress={int((y==1).sum())})")

    cm_out = os.path.join(OUT_DIR, "confusion_matrix.png")
    fi_out = os.path.join(OUT_DIR, "feature_importance_top15.png")

    print("\n[1/2] Generating confusion matrix …")
    plot_confusion_matrix(model, X, y, meta["label_names"], cm_out)

    print("\n[2/2] Generating feature importance chart …")
    plot_feature_importance(fi_df, fi_out, top_n=15)

    print("\nDone!  Images written to:")
    print(f"  {cm_out}")
    print(f"  {fi_out}")


if __name__ == "__main__":
    main()
