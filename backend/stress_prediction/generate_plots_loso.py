"""
generate_plots_loso.py
======================
Generates publication-quality figures from the Leave-One-Subject-Out (LOSO)
cross-validation results recorded during training.  No retraining or model
inference is performed — all values are taken directly from the training log.

Outputs (saved next to this script):
  confusion_matrix_loso.png        — Confusion matrix (raw + normalised)
  feature_importance_top15_loso.png — Horizontal bar chart of top 15 features

Run from the stress_prediction directory:
    python generate_plots_loso.py
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.colors import LinearSegmentedColormap

# ── paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FI_CSV     = os.path.join(SCRIPT_DIR, "stress_model", "feature_importance.csv")
OUT_DIR    = SCRIPT_DIR

# ══════════════════════════════════════════════════════════════════════
# LOSO Cross-Validation results (ExtraTrees — best model from training)
# ══════════════════════════════════════════════════════════════════════
# Confusion matrix  rows = true label, cols = predicted label
#                   non_stress  stress
LOSO_CM = np.array([
    [1229,  52],   # true: non_stress
    [  87, 275],   # true: stress
])

CLASS_LABELS   = ["Non-Stress", "Stress"]
MODEL_NAME     = "ExtraTreesClassifier"
CV_STRATEGY    = "Leave-One-Subject-Out (15 subjects)"
DATASET        = "WESAD"

STYLE = {
    "figure.facecolor":  "white",
    "axes.facecolor":    "white",
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "font.family":       "DejaVu Sans",
}


# ══════════════════════════════════════════════════════════════════════
# 1.  Confusion Matrix
# ══════════════════════════════════════════════════════════════════════
def plot_confusion_matrix(cm, out_path):
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    total   = cm.sum()
    correct = np.trace(cm)
    acc     = correct / total
    f1_stress = 2 * cm[1, 1] / (2 * cm[1, 1] + cm[0, 1] + cm[1, 0])

    blue_cmap = LinearSegmentedColormap.from_list(
        "light_blues", ["#EEF4FB", "#1565C0"], N=256
    )

    with plt.rc_context(STYLE):
        fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))
        fig.suptitle(
            f"Confusion Matrix — {MODEL_NAME}\n"
            f"{CV_STRATEGY}  ·  {DATASET}",
            fontsize=14, fontweight="bold", y=1.02,
        )

        for ax, data, fmt, title in [
            (axes[0], cm,      "d",    "Raw Counts"),
            (axes[1], cm_norm, ".2f",  "Normalised (Row Recall)"),
        ]:
            im = ax.imshow(data, interpolation="nearest", cmap=blue_cmap,
                           vmin=0, vmax=data.max())

            # cell text
            thresh = data.max() / 2.0
            for i in range(cm.shape[0]):
                for j in range(cm.shape[1]):
                    val = data[i, j]
                    color = "white" if val > thresh else "#111111"
                    if fmt == "d":
                        txt = f"{int(val)}"
                    else:
                        txt = f"{val:{fmt}}"
                    # add raw count below normalised value
                    if fmt == ".2f":
                        txt += f"\n({int(cm[i,j])})"
                    ax.text(j, i, txt, ha="center", va="center",
                            fontsize=13, color=color, fontweight="bold")

            ax.set_xticks(range(len(CLASS_LABELS)))
            ax.set_yticks(range(len(CLASS_LABELS)))
            ax.set_xticklabels(CLASS_LABELS, fontsize=11)
            ax.set_yticklabels(CLASS_LABELS, fontsize=11)
            ax.set_xlabel("Predicted Label", fontsize=11, labelpad=8)
            ax.set_ylabel("True Label",      fontsize=11, labelpad=8)
            ax.set_title(title, fontsize=12, pad=10)
            plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

        # metrics footer
        tn, fp, fn, tp = cm.ravel()
        sensitivity = tp / (tp + fn)
        specificity = tn / (tn + fp)
        ppv         = tp / (tp + fp)
        npv         = tn / (tn + fn)

        footer = (
            f"Accuracy: {acc:.4f}  |  F1-stress: {f1_stress:.4f}  |  "
            f"Sensitivity: {sensitivity:.4f}  |  Specificity: {specificity:.4f}  |  "
            f"PPV: {ppv:.4f}  |  NPV: {npv:.4f}  |  "
            f"Total windows: {total:,}  (Non-stress: {cm.sum(axis=1)[0]:,}, Stress: {cm.sum(axis=1)[1]:,})"
        )
        fig.text(0.5, -0.03, footer, ha="center", fontsize=9, color="#444444")

        plt.tight_layout()
        fig.savefig(out_path, dpi=150, bbox_inches="tight")
        plt.close(fig)

    print(f"  Saved : {out_path}")
    print(f"  Accuracy    : {acc:.4f}")
    print(f"  F1-stress   : {f1_stress:.4f}")
    print(f"  Sensitivity : {sensitivity:.4f}  (stress recall)")
    print(f"  Specificity : {specificity:.4f}  (non-stress recall)")


# ══════════════════════════════════════════════════════════════════════
# 2.  Feature Importance — top 15 horizontal bar chart
# ══════════════════════════════════════════════════════════════════════
def plot_feature_importance(fi_csv, out_path, top_n=15):
    fi_df = pd.read_csv(fi_csv)
    top   = fi_df.nlargest(top_n, "importance").iloc[::-1]   # ascending → highest at bottom

    def fmt_label(name):
        mapping = {
            "hrv_pnn20":    "HRV PNN20",
            "hrv_pnn50":    "HRV PNN50",
            "hrv_rmssd":    "HRV RMSSD",
            "hrv_sdnn":     "HRV SDNN",
            "hrv_sdsd":     "HRV SDSD",
            "hrv_mean_ibi": "HRV Mean IBI",
            "hrv_cv_ibi":   "HRV CV IBI",
            "hr_mean":      "HR Mean",
            "hr_max":       "HR Max",
            "hr_min":       "HR Min",
            "hr_std":       "HR Std Dev",
            "hr_range":     "HR Range",
            "hr_median":    "HR Median",
            "hr_cv":        "HR CV",
            "temp_mean":    "Temp Mean",
            "temp_max":     "Temp Max",
            "temp_min":     "Temp Min",
            "temp_std":     "Temp Std Dev",
            "temp_range":   "Temp Range",
            "temp_median":  "Temp Median",
            "temp_slope":   "Temp Slope",
            "acc_mag_mean": "ACC Mag Mean",
            "acc_mag_std":  "ACC Mag Std",
            "acc_mag_min":  "ACC Mag Min",
            "acc_mag_max":  "ACC Mag Max",
            "acc_mag_range":"ACC Mag Range",
            "acc_mag_median":"ACC Mag Median",
            "acc_energy":   "ACC Energy",
            "acc_jerk_mean":"ACC Jerk Mean",
            "acc_jerk_std": "ACC Jerk Std",
            "acc_x_mean":   "ACC X Mean",
            "acc_y_mean":   "ACC Y Mean",
            "acc_z_mean":   "ACC Z Mean",
            "acc_x_std":    "ACC X Std",
            "acc_y_std":    "ACC Y Std",
            "acc_z_std":    "ACC Z Std",
            "acc_x_range":  "ACC X Range",
            "acc_y_range":  "ACC Y Range",
            "acc_z_range":  "ACC Z Range",
            "activity_level":"Activity Level",
        }
        return mapping.get(name, name.replace("_", " ").title())

    labels      = [fmt_label(f) for f in top["feature"]]
    importances = top["importance"].values

    # colour: gradient from light to dark blue
    norm_vals = (importances - importances.min()) / max(importances.max() - importances.min(), 1e-9)
    colours   = plt.cm.Blues(0.35 + norm_vals * 0.55)

    with plt.rc_context(STYLE):
        fig, ax = plt.subplots(figsize=(11, 7))

        bars = ax.barh(labels, importances, color=colours, edgecolor="none", height=0.65)

        # value labels
        for bar, val in zip(bars, importances):
            ax.text(
                bar.get_width() + importances.max() * 0.01,
                bar.get_y() + bar.get_height() / 2,
                f"{val:.4f}",
                va="center", ha="left", fontsize=9.5, color="#222222",
            )

        ax.set_title(
            f"Feature Importance — Top {top_n} Features\n"
            f"{MODEL_NAME}  ·  {DATASET}  ·  Mean Decrease in Impurity",
            fontsize=13, fontweight="bold", pad=14,
        )
        ax.set_xlabel("Feature Importance (Mean Decrease in Impurity)", fontsize=11)
        ax.xaxis.set_major_formatter(mticker.FormatStrFormatter("%.3f"))
        ax.tick_params(axis="y", labelsize=10.5)
        ax.tick_params(axis="x", labelsize=9)
        ax.set_xlim(0, importances.max() * 1.18)

        # light vertical grid
        ax.xaxis.grid(True, linestyle="--", alpha=0.45, color="#cccccc")
        ax.set_axisbelow(True)

        # rank numbers inside bars
        for i, (bar, val) in enumerate(zip(bars, importances)):
            rank = top_n - i
            ax.text(
                importances.max() * 0.003,
                bar.get_y() + bar.get_height() / 2,
                f"#{rank}",
                va="center", ha="left", fontsize=8, color="white",
                fontweight="bold",
            )

        plt.tight_layout()
        fig.savefig(out_path, dpi=150, bbox_inches="tight")
        plt.close(fig)

    print(f"  Saved : {out_path}")
    print(f"\n  Top {top_n} features (from feature_importance.csv):")
    for rank, (_, row) in enumerate(top.iloc[::-1].iterrows(), 1):
        print(f"    #{rank:<2d}  {row['feature']:<25s}  {row['importance']:.6f}")


# ══════════════════════════════════════════════════════════════════════
# 3.  Entry point
# ══════════════════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("  Generating plots from LOSO CV training results")
    print("  (No retraining — values taken from training log)")
    print("=" * 60)

    print(f"\n  Model   : {MODEL_NAME}")
    print(f"  CV      : {CV_STRATEGY}")
    print(f"  Dataset : {DATASET}")
    print(f"\n  LOSO confusion matrix:")
    print(f"              Pred Non-Stress  Pred Stress")
    print(f"  True Non-S  {LOSO_CM[0,0]:<16d}  {LOSO_CM[0,1]}")
    print(f"  True Stress {LOSO_CM[1,0]:<16d}  {LOSO_CM[1,1]}")

    cm_out = os.path.join(OUT_DIR, "confusion_matrix_loso.png")
    fi_out = os.path.join(OUT_DIR, "feature_importance_top15_loso.png")

    print("\n[1/2] Generating confusion matrix …")
    plot_confusion_matrix(LOSO_CM, cm_out)

    print("\n[2/2] Generating feature importance chart …")
    plot_feature_importance(FI_CSV, fi_out, top_n=15)

    print("\nDone!  Images written to:")
    print(f"  {cm_out}")
    print(f"  {fi_out}")


if __name__ == "__main__":
    main()
