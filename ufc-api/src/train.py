"""
Model training pipeline for UFC fight prediction.

Trains three models:
  1. winner_model  — binary classifier (Red=1 wins / Blue=0 wins)
                     Best-of: LightGBM vs XGBoost vs Stacking Ensemble
                     Selected by TimeSeriesSplit CV accuracy
  2. method_model  — multiclass (Decision / KO-TKO / Sub / Other)
  3. round_model   — multiclass (round 1–5)

All models:
  • Evaluated with TimeSeriesSplit CV on original data (no leakage)
  • Final fit on augmented data (mirrored corners) to remove positional bias
  • Optuna hyperparameter tuning on LightGBM winner model
"""

import os
import pickle
import json
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit, StratifiedKFold, cross_val_score
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, log_loss
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import optuna
optuna.logging.set_verbosity(optuna.logging.WARNING)

from features import (
    load_raw_data, build_all_features, get_feature_matrix, FEATURE_COLUMNS,
    compute_incremental_elo, ELO_DEFAULT, mirror_feature_matrix,
)

warnings.filterwarnings("ignore")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RAW_DATA_PATH = os.path.join(DATA_DIR, "raw", "ufc-master.csv")


# ---------------------------------------------------------------------------
# Hyperparameter tuning via Optuna
# ---------------------------------------------------------------------------

def tune_lgbm(X: pd.DataFrame, y: pd.Series, n_trials: int = 80) -> dict:
    """Use Optuna to find the best LightGBM hyperparameters for the winner model."""
    tscv = TimeSeriesSplit(n_splits=5)

    def objective(trial):
        params = {
            "n_estimators":      trial.suggest_int("n_estimators",      200, 1000),
            "max_depth":         trial.suggest_int("max_depth",          3,   9),
            "learning_rate":     trial.suggest_float("learning_rate",    0.005, 0.15, log=True),
            "num_leaves":        trial.suggest_int("num_leaves",         20,  127),
            "min_child_samples": trial.suggest_int("min_child_samples",  10,  80),
            "subsample":         trial.suggest_float("subsample",        0.6, 1.0),
            "colsample_bytree":  trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha":         trial.suggest_float("reg_alpha",        0.0, 1.0),
            "reg_lambda":        trial.suggest_float("reg_lambda",       0.0, 2.0),
            "random_state": 42,
            "verbose": -1,
        }
        model = LGBMClassifier(**params)
        scores = cross_val_score(model, X, y, cv=tscv, scoring="accuracy", n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
    return study.best_params


def tune_xgboost(X: pd.DataFrame, y: pd.Series, n_trials: int = 50) -> dict:
    """Use Optuna to find the best XGBoost hyperparameters."""
    tscv = TimeSeriesSplit(n_splits=5)

    def objective(trial):
        params = {
            "n_estimators":    trial.suggest_int("n_estimators",    200, 800),
            "max_depth":       trial.suggest_int("max_depth",        3,   8),
            "learning_rate":   trial.suggest_float("learning_rate",  0.005, 0.2, log=True),
            "subsample":       trial.suggest_float("subsample",      0.6, 1.0),
            "colsample_bytree":trial.suggest_float("colsample_bytree",0.5, 1.0),
            "min_child_weight":trial.suggest_int("min_child_weight",  1,  10),
            "gamma":           trial.suggest_float("gamma",           0.0, 1.0),
            "reg_alpha":       trial.suggest_float("reg_alpha",       0.0, 1.0),
            "reg_lambda":      trial.suggest_float("reg_lambda",      0.0, 2.0),
            "eval_metric": "logloss",
            "random_state": 42,
        }
        model = XGBClassifier(**params)
        scores = cross_val_score(model, X, y, cv=tscv, scoring="accuracy", n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
    return study.best_params


# ---------------------------------------------------------------------------
# Model builders
# ---------------------------------------------------------------------------

def build_lgbm_winner(params: dict = None) -> LGBMClassifier:
    """LightGBM winner model — default or tuned parameters."""
    if params:
        return LGBMClassifier(**params, random_state=42, verbose=-1)
    return LGBMClassifier(
        n_estimators=600,
        max_depth=6,
        learning_rate=0.03,
        num_leaves=63,
        min_child_samples=30,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,
        reg_lambda=0.5,
        random_state=42,
        verbose=-1,
    )


def build_xgb_winner(params: dict = None) -> XGBClassifier:
    """XGBoost winner model — default or tuned parameters."""
    if params:
        p = {k: v for k, v in params.items() if k not in ("eval_metric", "random_state")}
        return XGBClassifier(**p, eval_metric="logloss", random_state=42)
    return XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=0.5,
        eval_metric="logloss",
        random_state=42,
    )


def build_stacking_model(lgbm_params: dict = None, xgb_params: dict = None) -> StackingClassifier:
    """
    Three-layer stacking ensemble: LightGBM + XGBoost + Random Forest
    meta-learned with Logistic Regression.

    Using calibrated LightGBM as final estimator gives well-calibrated
    probabilities while retaining the ensemble's discriminative power.
    """
    lgbm = build_lgbm_winner(lgbm_params)
    xgb  = build_xgb_winner(xgb_params)
    rf   = RandomForestClassifier(
        n_estimators=400, max_depth=10, min_samples_leaf=5,
        random_state=42, n_jobs=-1,
    )
    meta = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    return StackingClassifier(
        estimators=[("lgbm", lgbm), ("xgb", xgb), ("rf", rf)],
        final_estimator=meta,
        cv=5,
        n_jobs=-1,
        passthrough=False,
    )


def build_method_model() -> LGBMClassifier:
    """
    Method of victory model with calibrated class weights.

    Actual distribution: Decision 47.8%  KO/TKO 31.0%  Sub 17.6%  Other 3.6%
    Old model predicts:  Decision 71%     KO/TKO 21%    Sub 6%     Other 1%

    Using 'balanced' over-corrects for Other (3.6% → 27x weight = noise).
    Custom weights gently boost KO and Sub without making Other dominant:
      - Decision (1.0):    keep it as the plurality, just not 70%
      - KO/TKO  (1.5):     moderate boost
      - Submission (2.7):  strongest boost — most underrepresented finish
      - Other (0.8):       reduce slightly (model shouldn't guess DQ/NC often)

    Target predicted distribution: ~40% Dec  ~32% KO  ~22% Sub  ~6% Other
    """
    class_weights = {0: 1.0, 1: 1.5, 2: 2.7, 3: 0.8}
    return LGBMClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.03,
        num_leaves=63,
        min_child_samples=20,
        num_class=4,
        objective="multiclass",
        class_weight=class_weights,
        random_state=42,
        verbose=-1,
    )


def build_round_model() -> LGBMClassifier:
    return LGBMClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        objective="multiclass",
        random_state=42,
        verbose=-1,
    )


# ---------------------------------------------------------------------------
# Evaluation helpers
# ---------------------------------------------------------------------------

def evaluate_model(model, X: pd.DataFrame, y: pd.Series, task_name: str, n_splits: int = 5) -> dict:
    """
    Run TimeSeriesSplit cross-validation and print results.
    Reports both accuracy and log-loss (lower log-loss = better-calibrated probabilities).
    """
    tscv = TimeSeriesSplit(n_splits=n_splits)
    fold_accs, fold_lls = [], []

    for train_idx, test_idx in tscv.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        model.fit(X_train, y_train)
        preds      = model.predict(X_test)
        fold_accs.append(accuracy_score(y_test, preds))
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X_test)
            if proba.shape[1] == 2:
                fold_lls.append(log_loss(y_test, proba))

    mean_acc = np.mean(fold_accs)
    std_acc  = np.std(fold_accs)
    mean_ll  = np.mean(fold_lls) if fold_lls else None
    print(f"\n[{task_name}]  CV Accuracy: {mean_acc:.4f} ± {std_acc:.4f}"
          + (f"   Log-Loss: {mean_ll:.4f}" if mean_ll else ""))
    print(f"  Per-fold: {[round(s, 4) for s in fold_accs]}")

    # Final in-sample report
    model.fit(X, y)
    preds_all = model.predict(X)
    print(f"\n[{task_name}] Classification Report (in-sample):")
    print(classification_report(y, preds_all))

    return {"mean_accuracy": mean_acc, "std_accuracy": std_acc,
            "fold_scores": fold_accs, "mean_log_loss": mean_ll}


def naive_baseline_accuracy(y: pd.Series) -> float:
    """Always-predict-majority-class baseline."""
    majority = y.mode()[0]
    return (y == majority).mean()


# ---------------------------------------------------------------------------
# Main training pipeline
# ---------------------------------------------------------------------------

def train_all_models(
    data_path: str = RAW_DATA_PATH,
    tune: bool = True,
    n_tune_trials: int = 80,
    use_ensemble: bool = True,
    save: bool = True,
) -> dict:
    """
    Full training pipeline with comprehensive model comparison.

    Strategy:
      1. Tune LightGBM and XGBoost with Optuna
      2. Build stacking ensemble from best models
      3. Pick the winner model by CV accuracy
      4. Train all models on augmented (mirrored) data for final deployment
    """
    print("=" * 65)
    print("UFC FIGHT PREDICTION MODEL — TRAINING PIPELINE")
    print("=" * 65)

    # ------------------------------------------------------------------
    # Load and engineer features
    # ------------------------------------------------------------------
    print(f"\nLoading data from: {data_path}")
    df = load_raw_data(data_path)
    print(f"Raw data shape: {df.shape}")

    df = build_all_features(df)
    print(f"After feature engineering: {df.shape}")

    # ------------------------------------------------------------------
    # Save Elo ratings for inference
    # ------------------------------------------------------------------
    print("Computing final Elo ratings for inference...")
    _, final_elo_ratings = compute_incremental_elo(df)
    elo_path = os.path.join(MODELS_DIR, "elo_ratings.json")
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(elo_path, "w") as f:
        json.dump(final_elo_ratings, f)
    top_elo = sorted(final_elo_ratings.items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"  Saved {len(final_elo_ratings)} fighter ratings")
    print(f"  Top 10: {', '.join(f'{n}({r:.0f})' for n, r in top_elo)}")

    X, y_winner = get_feature_matrix(df)
    print(f"\nFeature matrix: {X.shape[1]} features × {len(X)} fights")

    baseline = naive_baseline_accuracy(y_winner)
    print(f"Naive baseline (always-red): {baseline:.4f}  ← your models must beat this\n")

    # ------------------------------------------------------------------
    # Mirror for debiased final training (see mirror_feature_matrix docs)
    # ------------------------------------------------------------------
    print("Mirroring training data to remove red-corner positional bias...")
    X_aug, y_aug = mirror_feature_matrix(X, y_winner)
    print(f"Augmented: {len(X_aug)} fights  (Red {y_aug.mean()*100:.1f}% / Blue {(1-y_aug.mean())*100:.1f}%)\n")

    results   = {}
    best_acc  = 0.0
    best_model_name = ""
    os.makedirs(MODELS_DIR, exist_ok=True)

    # ------------------------------------------------------------------
    # 1a. LightGBM — primary candidate (usually best on tabular data)
    # ------------------------------------------------------------------
    print("=" * 65)
    print("TASK 1 — WINNER PREDICTION")
    print("=" * 65)

    lgbm_params = None
    if tune:
        print(f"\nTuning LightGBM with Optuna ({n_tune_trials} trials)…")
        lgbm_params = tune_lgbm(X, y_winner, n_trials=n_tune_trials)
        print(f"  Best LightGBM params: {lgbm_params}")

    lgbm_model = build_lgbm_winner(lgbm_params)
    lgbm_metrics = evaluate_model(lgbm_model, X, y_winner, "Winner — LightGBM")
    lgbm_model.fit(X_aug, y_aug)     # final fit on debiased data
    results["winner_lgbm"] = lgbm_metrics
    if save:
        _save_model(lgbm_model, "winner_lgbm_model.pkl")

    if lgbm_metrics["mean_accuracy"] > best_acc:
        best_acc = lgbm_metrics["mean_accuracy"]
        best_model_name = "winner_lgbm_model.pkl"

    # ------------------------------------------------------------------
    # 1b. XGBoost — benchmark
    # ------------------------------------------------------------------
    xgb_params = None
    if tune:
        print(f"\nTuning XGBoost with Optuna ({n_tune_trials // 2} trials)…")
        xgb_params = tune_xgboost(X, y_winner, n_trials=n_tune_trials // 2)
        print(f"  Best XGBoost params: {xgb_params}")

    xgb_model = build_xgb_winner(xgb_params)
    xgb_metrics = evaluate_model(xgb_model, X, y_winner, "Winner — XGBoost")
    xgb_model.fit(X_aug, y_aug)
    results["winner_xgb"] = xgb_metrics
    if save:
        _save_model(xgb_model, "winner_xgb_model.pkl")

    if xgb_metrics["mean_accuracy"] > best_acc:
        best_acc = xgb_metrics["mean_accuracy"]
        best_model_name = "winner_xgb_model.pkl"

    # ------------------------------------------------------------------
    # 1c. Stacking Ensemble — LightGBM + XGBoost + Random Forest
    # ------------------------------------------------------------------
    if use_ensemble:
        print("\n--- Stacking Ensemble (LightGBM + XGBoost + RF) ---")
        stack_model = build_stacking_model(lgbm_params, xgb_params)
        stack_metrics = evaluate_model(stack_model, X, y_winner, "Winner — Stacking Ensemble")
        stack_model.fit(X_aug, y_aug)
        results["winner_ensemble"] = stack_metrics
        if save:
            _save_model(stack_model, "winner_ensemble_model.pkl")
        if stack_metrics["mean_accuracy"] > best_acc:
            best_acc = stack_metrics["mean_accuracy"]
            best_model_name = "winner_ensemble_model.pkl"

    # ------------------------------------------------------------------
    # Select and announce best winner model
    # ------------------------------------------------------------------
    print(f"\n{'=' * 65}")
    print(f"  WINNER MODEL SELECTED: {best_model_name}  (CV acc: {best_acc:.4f})")
    print(f"{'=' * 65}")

    # Feature importance of LightGBM (most interpretable)
    _print_feature_importance(lgbm_model, X.columns.tolist(), top_n=20)

    # ------------------------------------------------------------------
    # 2. Method of victory
    # ------------------------------------------------------------------
    print("\n--- TASK 2: METHOD OF VICTORY ---")
    if "target_method" in df.columns:
        y_method = df["target_method"].astype(int)
        valid = y_method >= 0
        X_m, y_m = X[valid], y_method[valid]
        X_m_aug, y_m_aug = mirror_feature_matrix(X_m, y_m, flip_target=False)

        method_model = build_method_model()
        method_metrics = evaluate_model(method_model, X_m, y_m, "Method of Victory")
        method_model.fit(X_m_aug, y_m_aug)
        results["method"] = method_metrics
        if save:
            _save_model(method_model, "method_model.pkl")
    else:
        print("  No method target column found. Skipping.")

    # ------------------------------------------------------------------
    # 3. Round prediction
    # ------------------------------------------------------------------
    print("\n--- TASK 3: ROUND PREDICTION ---")
    if "target_round" in df.columns:
        y_round = df["target_round"].astype(int)
        valid = y_round.between(1, 5)
        X_r, y_r = X[valid], y_round[valid]
        X_r_aug, y_r_aug = mirror_feature_matrix(X_r, y_r, flip_target=False)

        round_model = build_round_model()
        round_metrics = evaluate_model(round_model, X_r, y_r, "Round Prediction")
        round_model.fit(X_r_aug, y_r_aug)
        results["round"] = round_metrics
        if save:
            _save_model(round_model, "round_model.pkl")
    else:
        print("  No round target column found. Skipping.")

    # ------------------------------------------------------------------
    # Save feature column list for inference
    # ------------------------------------------------------------------
    if save:
        feature_meta = {
            "feature_columns": X.columns.tolist(),
            "best_winner_model": best_model_name,
            # Inference: spread win % away from 50/50 after symmetrization (see predict.py)
            "win_prob_temperature": 0.66,
            "win_prob_elo_blend_max": 0.24,
            "results": {k: {kk: float(vv) if isinstance(vv, (np.floating, float)) else vv
                            for kk, vv in v.items() if not isinstance(vv, list)} for k, v in results.items()},
        }
        meta_path = os.path.join(MODELS_DIR, "feature_meta.json")
        with open(meta_path, "w") as f:
            json.dump(feature_meta, f, indent=2)
        print(f"\nFeature metadata saved to {meta_path}")

    print("\n" + "=" * 65)
    print("TRAINING COMPLETE")
    print("=" * 65)
    for task, m in results.items():
        ll_str = f"  Log-loss: {m['mean_log_loss']:.4f}" if m.get("mean_log_loss") else ""
        print(f"  {task:<28} CV Accuracy: {m['mean_accuracy']:.4f} ± {m['std_accuracy']:.4f}{ll_str}")
    print(f"\n  Best winner model: {best_model_name}  ({best_acc:.4f})")

    return results


def _save_model(model, filename: str):
    path = os.path.join(MODELS_DIR, filename)
    with open(path, "wb") as f:
        pickle.dump(model, f)
    print(f"  Model saved: {path}")


def _print_feature_importance(model, feature_names: list, top_n: int = 15):
    if not hasattr(model, "feature_importances_"):
        return
    importances = model.feature_importances_
    pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    print(f"\n  Top {top_n} most important features:")
    for name, imp in pairs[:top_n]:
        bar = "█" * int(imp * 200)
        print(f"    {name:<30} {imp:.4f}  {bar}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train UFC prediction models")
    parser.add_argument("--data", default=RAW_DATA_PATH, help="Path to raw CSV data file")
    parser.add_argument("--tune", action="store_true", help="Run Optuna hyperparameter tuning")
    parser.add_argument("--trials", type=int, default=30, help="Number of Optuna tuning trials")
    parser.add_argument("--no-ensemble", action="store_true", help="Skip stacking ensemble")
    args = parser.parse_args()

    train_all_models(
        data_path=args.data,
        tune=args.tune,
        n_tune_trials=args.trials,
        use_ensemble=not args.no_ensemble,
    )
