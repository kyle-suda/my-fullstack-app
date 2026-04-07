"""
UFC Fight Prediction — inference CLI.

Usage:
    python predict.py --red "Conor McGregor" --blue "Dustin Poirier" \
                      --weight-class "Lightweight" --title-fight

Or import the predictor:
    from predict import UFCPredictor
    predictor = UFCPredictor()
    result = predictor.predict_fight(red_stats, blue_stats)
"""

import os
import sys
import json
import pickle
import argparse
import warnings
import logging
import numpy as np
import pandas as pd

# Suppress noisy third-party library warnings
warnings.filterwarnings("ignore")
logging.getLogger("lightgbm").setLevel(logging.ERROR)
os.environ.setdefault("MPLCONFIGDIR", os.path.join(os.path.dirname(__file__), "..", ".mpl_cache"))
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "4")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

METHOD_LABELS = {0: "Decision", 1: "KO/TKO", 2: "Submission", 3: "Other/No Contest"}
WINNER_LABELS = {1: "Red Corner", 0: "Blue Corner"}


ELO_DEFAULT = 1500.0


class UFCPredictor:
    """Load trained models and make predictions for new fights."""

    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.winner_model = None
        self.method_model = None
        self.round_model = None
        self.feature_columns = None
        self.elo_ratings: dict = {}
        self._load_models()

    def _load_models(self):
        meta_path = os.path.join(self.models_dir, "feature_meta.json")
        if not os.path.exists(meta_path):
            raise FileNotFoundError(
                f"No trained models found in {self.models_dir}.\n"
                "Run train.py first to train the models."
            )

        with open(meta_path) as f:
            meta = json.load(f)
        self.feature_columns = meta["feature_columns"]

        # Load Elo ratings for inference
        elo_path = os.path.join(self.models_dir, "elo_ratings.json")
        if os.path.exists(elo_path):
            with open(elo_path) as f:
                self.elo_ratings = json.load(f)

        # Prefer ensemble model for winner if available
        for name in ("winner_ensemble_model.pkl", "winner_xgb_model.pkl"):
            path = os.path.join(self.models_dir, name)
            if os.path.exists(path):
                with open(path, "rb") as f:
                    self.winner_model = pickle.load(f)
                self._winner_model_name = name
                break

        for name, attr in [("method_model.pkl", "method_model"), ("round_model.pkl", "round_model")]:
            path = os.path.join(self.models_dir, name)
            if os.path.exists(path):
                with open(path, "rb") as f:
                    setattr(self, attr, pickle.load(f))

    def _build_feature_row(self, red: dict, blue: dict, context: dict) -> pd.DataFrame:
        """
        Build a single-row feature DataFrame from red/blue fighter dicts and context.

        red/blue dicts accept these keys (all optional, default 0):
            height_cm, reach_cm, age,
            sig_str_landed_pm, sub_avg, td_avg,
            wins, losses, win_streak, loss_streak, longest_win_streak, title_bouts,
            ko_wins, sub_wins, total_rounds_fought, sos,
            finish_rate, striker_style, grappler_style,
            stance (e.g. "Orthodox")

        context dict:
            weight_class (str), is_title_fight (bool), scheduled_rounds (int),
            red_odds (float), blue_odds (float)
        """
        row = {}

        # Apply the same Bayesian smoothing used in the training pipeline so
        # predictions from manually-entered stats match the training distribution.
        _SMOOTH_K = 5
        for corner in (red, blue):
            n = float(corner.get("wins", 0) or 0) + float(corner.get("losses", 0) or 0)
            # Hard cap then shrink toward population median
            sig = min(float(corner.get("sig_str_landed_pm", 0) or 0), 15.0)
            sub = min(float(corner.get("sub_avg", 0) or 0), 4.0)
            td  = min(float(corner.get("td_avg",  0) or 0), 7.0)
            corner["sig_str_landed_pm"] = (n * sig + _SMOOTH_K * 6.37) / (n + _SMOOTH_K)
            corner["sub_avg"]           = (n * sub + _SMOOTH_K * 0.50) / (n + _SMOOTH_K)
            corner["td_avg"]            = (n * td  + _SMOOTH_K * 1.21) / (n + _SMOOTH_K)

        # Map fighter stat keys → exact feature names the model was trained on
        stat_map = [
            ("height_cm",            "height_diff"),
            ("reach_cm",             "reach_diff"),
            ("age",                  "age_diff"),
            ("sig_str_landed_pm",    "sig_str_diff"),
            ("sub_avg",              "sub_att_diff"),
            ("td_avg",               "td_diff"),
            ("wins",                 "win_diff"),
            ("losses",               "loss_diff"),
            ("win_streak",           "win_streak_diff"),
            ("loss_streak",          "lose_streak_diff"),
            ("longest_win_streak",   "longest_win_streak_diff"),
            ("title_bouts",          "title_bout_diff"),
            ("ko_wins",              "ko_diff"),
            ("sub_wins",             "sub_diff"),
            ("total_rounds_fought",  "total_round_diff"),
            ("sos",                  "sos_diff"),
            ("finish_rate",          "finish_rate_diff"),
            ("striker_style",        "striker_style_diff"),
            ("grappler_style",       "grappler_style_diff"),
            ("ufc_fights",           "ufc_experience_diff"),
        ]

        for stat_key, diff_col in stat_map:
            r_val = float(red.get(stat_key, 0) or 0)
            b_val = float(blue.get(stat_key, 0) or 0)
            row[diff_col] = r_val - b_val

        # Win rate — Laplace smoothing: (wins+1)/(wins+losses+2)
        # Prevents 1-0 fighters from getting 100% win rate
        r_wins = float(red.get("wins", 0) or 0)
        r_losses = float(red.get("losses", 0) or 0)
        b_wins = float(blue.get("wins", 0) or 0)
        b_losses = float(blue.get("losses", 0) or 0)
        r_wr = (r_wins + 1) / (r_wins + r_losses + 2)
        b_wr = (b_wins + 1) / (b_wins + b_losses + 2)
        row["win_rate_diff"] = r_wr - b_wr

        # KO and sub rates
        r_ko_rate = float(red.get("ko_wins", 0) or 0) / max(r_wins, 1)
        b_ko_rate = float(blue.get("ko_wins", 0) or 0) / max(b_wins, 1)
        r_sub_rate = float(red.get("sub_wins", 0) or 0) / max(r_wins, 1)
        b_sub_rate = float(blue.get("sub_wins", 0) or 0) / max(b_wins, 1)
        row["ko_rate_diff"] = r_ko_rate - b_ko_rate
        row["sub_rate_diff"] = r_sub_rate - b_sub_rate

        # Stance
        r_stance = red.get("stance", "Unknown")
        b_stance = blue.get("stance", "Unknown")
        row["is_cross_stance"] = int(
            (r_stance == "Orthodox" and b_stance == "Southpaw") or
            (r_stance == "Southpaw" and b_stance == "Orthodox")
        )
        row["r_is_southpaw"] = int(r_stance == "Southpaw")

        # Context
        row["is_title_fight"] = int(context.get("is_title_fight", False))
        row["scheduled_rounds"] = int(context.get("scheduled_rounds", 3))
        row["empty_arena"] = int(context.get("empty_arena", 0))

        # Ranking
        r_rank = float(red.get("rank", 20) or 20)
        b_rank = float(blue.get("rank", 20) or 20)
        row["rank_diff"] = r_rank - b_rank
        row["r_is_ranked"] = int(red.get("rank", None) is not None and red.get("rank", 20) < 20)
        row["b_is_ranked"] = int(blue.get("rank", None) is not None and blue.get("rank", 20) < 20)
        row["rank_advantage"] = row["b_is_ranked"] - row["r_is_ranked"]
        row["better_rank_encoded"] = 0
        if row["r_is_ranked"] and not row["b_is_ranked"]:
            row["better_rank_encoded"] = 1
        elif row["b_is_ranked"] and not row["r_is_ranked"]:
            row["better_rank_encoded"] = -1

        # Elo features — injected from elo_ratings.json by predict_fight()
        if "elo_diff" in context:
            row["elo_diff"]     = float(context["elo_diff"])
            row["elo_win_prob"] = float(context.get("elo_win_prob",
                                        1.0 / (1.0 + 10.0 ** (-row["elo_diff"] / 400.0))))

        # Recent form — from fighter stats if available, otherwise 0
        r_form = float(red.get("recent_form", 0) or 0)
        b_form = float(blue.get("recent_form", 0) or 0)
        row["recent_form_diff"] = r_form - b_form

        # Odds
        if "red_odds" in context and "blue_odds" in context:
            r_o = float(context["red_odds"])
            b_o = float(context["blue_odds"])
            row["odds_diff"] = r_o - b_o
            row["implied_prob_diff"] = _implied_prob(r_o) - _implied_prob(b_o)

        # Method-specific odds
        for key in ("ko_odds_diff", "sub_odds_diff", "dec_odds_diff"):
            if key in context:
                row[key] = float(context[key])

        # Weight class dummies — fill in any expected by the model
        for col in self.feature_columns:
            if col.startswith("wc_"):
                wc_name = col.replace("wc_", "").replace("_", " ")
                row[col] = int(context.get("weight_class", "").lower() == wc_name.lower())

        df = pd.DataFrame([row])

        # Align to trained feature columns
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0.0
        df = df[self.feature_columns].astype(float)
        return df

    def predict_fight(
        self,
        red: dict,
        blue: dict,
        context: dict = None,
        red_name: str = "Red Fighter",
        blue_name: str = "Blue Fighter",
    ) -> dict:
        """
        Predict the outcome of a UFC fight.

        Returns a dict with:
            winner, winner_confidence,
            method, method_confidence,
            predicted_round, round_confidence,
            full breakdown of all probabilities
        """
        if self.winner_model is None:
            raise RuntimeError("No winner model loaded. Run train.py first.")

        context = context or {}

        # Inject Elo ratings for the named fighters (key for confident predictions)
        r_elo = ELO_DEFAULT
        b_elo = ELO_DEFAULT
        if self.elo_ratings and "elo_diff" not in context:
            r_elo = self.elo_ratings.get(red_name, ELO_DEFAULT)
            b_elo = self.elo_ratings.get(blue_name, ELO_DEFAULT)
            context = dict(context)
            context["elo_diff"]     = r_elo - b_elo
            context["elo_win_prob"] = 1.0 / (1.0 + 10.0 ** (-(r_elo - b_elo) / 400.0))
            context["r_elo"] = r_elo
            context["b_elo"] = b_elo

        X = self._build_feature_row(red, blue, context)

        result = {
            "red_fighter": red_name,
            "blue_fighter": blue_name,
            "r_elo": round(r_elo, 1),
            "b_elo": round(b_elo, 1),
        }

        # Winner
        winner_proba = self.winner_model.predict_proba(X)[0]
        winner_pred = int(self.winner_model.predict(X)[0])
        result["winner"] = red_name if winner_pred == 1 else blue_name
        result["winner_is_red"] = bool(winner_pred == 1)
        result["red_win_probability"] = round(float(winner_proba[1]), 4)
        result["blue_win_probability"] = round(float(winner_proba[0]), 4)
        result["winner_confidence"] = round(max(winner_proba), 4)

        # Method of victory
        if self.method_model is not None:
            method_proba = self.method_model.predict_proba(X)[0]
            method_pred = int(self.method_model.predict(X)[0])
            result["predicted_method"] = METHOD_LABELS.get(method_pred, "Unknown")
            result["method_probabilities"] = {
                METHOD_LABELS[i]: round(float(p), 4)
                for i, p in enumerate(method_proba)
                if i in METHOD_LABELS
            }
            result["method_confidence"] = round(float(max(method_proba)), 4)

        # Round prediction
        if self.round_model is not None:
            round_proba = self.round_model.predict_proba(X)[0]
            round_classes = self.round_model.classes_
            round_pred = int(self.round_model.predict(X)[0])
            result["predicted_round"] = round_pred
            result["round_probabilities"] = {
                f"Round {int(c)}": round(float(p), 4)
                for c, p in zip(round_classes, round_proba)
            }
            result["round_confidence"] = round(float(max(round_proba)), 4)

        # ---------------------------------------------------------------
        # VALUE ANALYSIS — only when odds are provided
        # Run a second prediction with odds features zeroed out to get
        # the "pure stats" view. The gap between this and Vegas tells us
        # where the market may be wrong.
        # ---------------------------------------------------------------
        r_odds_val = context.get("red_odds")
        b_odds_val = context.get("blue_odds")
        if r_odds_val is not None and b_odds_val is not None:
            # Pure-stats run: strip betting odds but KEEP Elo (it's historical data, not market price)
            context_no_odds = {
                k: v for k, v in context.items()
                if k not in ("red_odds", "blue_odds",
                             "ko_odds_diff", "sub_odds_diff", "dec_odds_diff")
            }
            X_pure = self._build_feature_row(red, blue, context_no_odds)
            pure_proba = self.winner_model.predict_proba(X_pure)[0]
            pure_red  = round(float(pure_proba[1]), 4)
            pure_blue = round(float(pure_proba[0]), 4)

            r_vegas, b_vegas = _vig_adjusted_probs(float(r_odds_val), float(b_odds_val))
            r_edge = round(pure_red  - r_vegas, 4)
            b_edge = round(pure_blue - b_vegas, 4)

            r_dec = _american_to_decimal(float(r_odds_val))
            b_dec = _american_to_decimal(float(b_odds_val))

            result["value"] = {
                "red_pure_prob":    pure_red,
                "blue_pure_prob":   pure_blue,
                "red_vegas_prob":   round(r_vegas, 4),
                "blue_vegas_prob":  round(b_vegas, 4),
                "red_edge":         r_edge,
                "blue_edge":        b_edge,
                "red_kelly":        _kelly_fraction(pure_red,  r_dec),
                "blue_kelly":       _kelly_fraction(pure_blue, b_dec),
                "red_odds":         float(r_odds_val),
                "blue_odds":        float(b_odds_val),
                "red_decimal_odds": round(r_dec, 3),
                "blue_decimal_odds": round(b_dec, 3),
            }

        return result

    def predict_from_dataset(self, fight_row: pd.Series) -> dict:
        """
        Predict directly from a row of the Kaggle dataset (already has engineered features).
        Useful for batch evaluation.
        """
        if self.winner_model is None:
            raise RuntimeError("No winner model loaded.")

        available = [c for c in self.feature_columns if c in fight_row.index]
        row = fight_row[available].fillna(0).astype(float)

        for col in self.feature_columns:
            if col not in row.index:
                row[col] = 0.0

        X = row[self.feature_columns].to_frame().T.astype(float)

        result = {}
        winner_proba = self.winner_model.predict_proba(X)[0]
        winner_pred = int(self.winner_model.predict(X)[0])
        result["winner_is_red"] = bool(winner_pred == 1)
        result["red_win_probability"] = round(float(winner_proba[1]), 4)
        result["winner_confidence"] = round(max(winner_proba), 4)

        if self.method_model is not None:
            result["predicted_method"] = int(self.method_model.predict(X)[0])
        if self.round_model is not None:
            result["predicted_round"] = int(self.round_model.predict(X)[0])

        return result


def _implied_prob(american_odds: float) -> float:
    if american_odds >= 0:
        return 100 / (american_odds + 100)
    else:
        return abs(american_odds) / (abs(american_odds) + 100)


def _american_to_decimal(american_odds: float) -> float:
    """American odds → decimal odds (e.g. +200 → 3.0, -150 → 1.667)."""
    if american_odds >= 0:
        return american_odds / 100 + 1
    else:
        return 100 / abs(american_odds) + 1


def _vig_adjusted_probs(red_odds: float, blue_odds: float) -> tuple:
    """
    Convert American moneyline odds to vig-adjusted fair probabilities.

    Sportsbooks build in ~4-6% overround (vig) so raw implied probs sum to >100%.
    This strips the vig out so we compare apples to apples against the model.

    Example: -200 / +165 → raw 66.7% + 37.7% = 104.4% vig
             After adjustment: 63.9% / 36.1% = 100%
    """
    r_raw = _implied_prob(red_odds)
    b_raw = _implied_prob(blue_odds)
    total = r_raw + b_raw
    return r_raw / total, b_raw / total


def _kelly_fraction(win_prob: float, decimal_odds: float, fraction: float = 0.25) -> float:
    """
    Kelly criterion bet size as a fraction of bankroll.

    f* = (b × p − q) / b
      b = net profit per unit (decimal_odds − 1)
      p = model's win probability
      q = 1 − p

    Uses quarter-Kelly by default — standard in sports betting to account for
    model uncertainty and avoid over-betting.

    Returns 0 if there is no edge (negative Kelly).
    """
    b = decimal_odds - 1
    if b <= 0:
        return 0.0
    k = (b * win_prob - (1 - win_prob)) / b
    return round(max(0.0, k * fraction), 4)


def _edge_color(edge: float) -> str:
    if edge >= 0.10:
        return "\033[92m"    # bright green — strong edge
    elif edge >= 0.05:
        return "\033[93m"    # yellow — moderate edge
    elif edge <= -0.05:
        return "\033[91m"    # red — model disagrees, fade this side
    return "\033[2m"         # dim — negligible edge


def print_prediction(result: dict):
    """Pretty-print a prediction result."""
    W = 59
    RESET = "\033[0m"
    BOLD  = "\033[1m"
    RED_C = "\033[91m"
    BLUE_C = "\033[94m"
    GREEN_C = "\033[92m"
    DIM   = "\033[2m"

    print("\n" + "=" * W)
    print("   UFC FIGHT PREDICTION")
    print("=" * W)
    r_elo = result.get("r_elo", ELO_DEFAULT)
    b_elo = result.get("b_elo", ELO_DEFAULT)
    print(f"  {'Red Corner:':<20} {result['red_fighter']}  {DIM}(Elo {r_elo:.0f}){RESET}")
    print(f"  {'Blue Corner:':<20} {result['blue_fighter']}  {DIM}(Elo {b_elo:.0f}){RESET}")
    print("-" * W)
    print(f"  PREDICTED WINNER:    {result['winner']}")
    print(f"  Win Probability:     Red {result['red_win_probability']*100:.1f}%"
          f"  |  Blue {result['blue_win_probability']*100:.1f}%")
    print(f"  Model Confidence:    {result['winner_confidence']*100:.1f}%")

    if "predicted_method" in result:
        print("-" * W)
        print(f"  Predicted Method:    {result['predicted_method']}")
        print(f"  Method Confidence:   {result['method_confidence']*100:.1f}%")
        if "method_probabilities" in result:
            for method, prob in result["method_probabilities"].items():
                bar = "█" * int(prob * 30)
                print(f"    {method:<15} {prob*100:5.1f}%  {bar}")

    if "predicted_round" in result:
        print("-" * W)
        print(f"  Predicted Round:     Round {result['predicted_round']}")
        print(f"  Round Confidence:    {result['round_confidence']*100:.1f}%")
        if "round_probabilities" in result:
            for rnd, prob in result["round_probabilities"].items():
                bar = "█" * int(prob * 40)
                print(f"    {rnd:<10} {prob*100:5.1f}%  {bar}")

    # Value analysis (only when odds were provided)
    v = result.get("value")
    if v:
        print("=" * W)
        print(f"  {'VALUE ANALYSIS':^{W-4}}")
        print(f"  {'(Pure fight stats vs Vegas market)':^{W-4}}")
        print("-" * W)

        r_name = result["red_fighter"].split()[0]
        b_name = result["blue_fighter"].split()[0]
        r_odds_str = (f"+{v['red_odds']:.0f}" if v["red_odds"] > 0
                      else f"{v['red_odds']:.0f}")
        b_odds_str = (f"+{v['blue_odds']:.0f}" if v["blue_odds"] > 0
                      else f"{v['blue_odds']:.0f}")

        print(f"  {'Fighter':<22} {'Odds':>6}  {'Vegas%':>7}  {'Stats%':>7}  {'Edge':>7}  Kelly")
        print(f"  {'-'*22}  {'------':>6}  {'-------':>7}  {'-------':>7}  {'-------':>7}  -----")

        for name, odds_s, vegas_p, pure_p, edge, kelly in [
            (r_name, r_odds_str,
             v["red_vegas_prob"],  v["red_pure_prob"],  v["red_edge"],  v["red_kelly"]),
            (b_name, b_odds_str,
             v["blue_vegas_prob"], v["blue_pure_prob"], v["blue_edge"], v["blue_kelly"]),
        ]:
            ec = _edge_color(edge)
            edge_str = f"{'+' if edge >= 0 else ''}{edge*100:.1f}%"
            kelly_str = f"{kelly*100:.1f}%" if kelly > 0 else "  —"
            print(f"  {name:<22} {odds_s:>6}  {vegas_p*100:>6.1f}%  "
                  f"{pure_p*100:>6.1f}%  {ec}{edge_str:>7}{RESET}  {kelly_str}")

        # Value bet callout
        VALUE_THRESHOLD = 0.08
        bets = []
        if v["red_edge"] >= VALUE_THRESHOLD and v["red_kelly"] > 0:
            bets.append((result["red_fighter"],  r_odds_str,
                         v["red_pure_prob"],  v["red_vegas_prob"],
                         v["red_edge"], v["red_kelly"]))
        if v["blue_edge"] >= VALUE_THRESHOLD and v["blue_kelly"] > 0:
            bets.append((result["blue_fighter"], b_odds_str,
                         v["blue_pure_prob"], v["blue_vegas_prob"],
                         v["blue_edge"], v["blue_kelly"]))

        if bets:
            print()
            print(f"  {GREEN_C}★  VALUE BET DETECTED{RESET}")
            for name, odds_s, pure_p, vegas_p, edge, kelly in bets:
                print(f"  {BOLD}{name}{RESET} {DIM}({odds_s}){RESET}")
                print(f"    Model (pure stats): {pure_p*100:.1f}%  "
                      f"Vegas (vig-adj): {vegas_p*100:.1f}%")
                print(f"    {GREEN_C}Edge: +{edge*100:.1f}%{RESET}  "
                      f"Suggested bet: {GREEN_C}{kelly*100:.1f}% of bankroll{RESET} (¼ Kelly)")
        else:
            print(f"\n  {DIM}No clear value bets detected — market looks efficient here.{RESET}")

    print("=" * W + "\n")


def main():
    parser = argparse.ArgumentParser(description="Predict a UFC fight outcome")
    parser.add_argument("--red", required=True, help="Red corner fighter name")
    parser.add_argument("--blue", required=True, help="Blue corner fighter name")
    parser.add_argument("--weight-class", default="Lightweight", help="Weight class (e.g. Lightweight)")
    parser.add_argument("--title-fight", action="store_true", help="Is this a title fight?")
    parser.add_argument("--rounds", type=int, default=3, help="Scheduled rounds (3 or 5)")
    parser.add_argument("--red-odds", type=float, default=None, help="Red corner American odds (e.g. -150)")
    parser.add_argument("--blue-odds", type=float, default=None, help="Blue corner American odds (e.g. +130)")

    # Fighter stat arguments (optional — will default to 0 diffs if not provided)
    for prefix, corner in [("r", "red"), ("b", "blue")]:
        for stat in ["wins", "losses", "win-streak", "reach", "height", "age", "sig-str-pct", "td-pct"]:
            parser.add_argument(
                f"--{prefix}-{stat}",
                type=float,
                default=None,
                help=f"{corner.title()} fighter {stat}",
            )

    args = parser.parse_args()

    def _parse_fighter_args(prefix: str) -> dict:
        p = prefix + "_"
        return {
            "wins": getattr(args, f"{prefix}_wins", None) or 0,
            "losses": getattr(args, f"{prefix}_losses", None) or 0,
            "win_streak": getattr(args, f"{prefix}_win_streak", None) or 0,
            "reach_cm": getattr(args, f"{prefix}_reach", None) or 0,
            "height_cm": getattr(args, f"{prefix}_height", None) or 0,
            "age": getattr(args, f"{prefix}_age", None) or 0,
            "sig_str_pct": getattr(args, f"{prefix}_sig_str_pct", None) or 0,
            "td_pct": getattr(args, f"{prefix}_td_pct", None) or 0,
        }

    red_stats = _parse_fighter_args("r")
    blue_stats = _parse_fighter_args("b")
    context = {
        "weight_class": args.weight_class,
        "is_title_fight": args.title_fight,
        "scheduled_rounds": args.rounds,
    }
    if args.red_odds is not None:
        context["red_odds"] = args.red_odds
    if args.blue_odds is not None:
        context["blue_odds"] = args.blue_odds

    try:
        predictor = UFCPredictor()
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        sys.exit(1)

    result = predictor.predict_fight(
        red=red_stats,
        blue=blue_stats,
        context=context,
        red_name=args.red,
        blue_name=args.blue,
    )
    print_prediction(result)


if __name__ == "__main__":
    main()
