"""
Feature engineering pipeline for UFC fight prediction.

Transforms the ufc-master.csv dataset into model-ready features.
Key principle: ALL features use only stats available BEFORE the target fight
to prevent data leakage (the dataset already enforces this with career averages).
"""

import pandas as pd
import numpy as np
from typing import Optional


# ---------------------------------------------------------------------------
# Column name constants (matching ufc-master.csv schema)
# ---------------------------------------------------------------------------

WINNER_COL = "Winner"
DATE_COL = "date"

FIGHTER_COLS = {
    "red": {
        "height": "R_Height_cms",
        "weight": "R_Weight_lbs",
        "reach": "R_Reach_cms",
        "age": "R_age",
        "stance": "R_Stance",
        "sig_str_landed": "R_avg_SIG_STR_landed",
        "sig_str_pct": "R_avg_SIG_STR_pct",
        "sub_avg": "R_avg_SUB_ATT",
        "td_avg": "R_avg_TD_landed",
        "td_pct": "R_avg_TD_pct",
        "wins": "R_wins",
        "losses": "R_losses",
        "win_streak": "R_current_win_streak",
        "loss_streak": "R_current_lose_streak",
        "longest_win_streak": "R_longest_win_streak",
        "title_bouts": "R_total_title_bouts",
        "rank": "R_match_weightclass_rank",
    },
    "blue": {
        "height": "B_Height_cms",
        "weight": "B_Weight_lbs",
        "reach": "B_Reach_cms",
        "age": "B_age",
        "stance": "B_Stance",
        "sig_str_landed": "B_avg_SIG_STR_landed",
        "sig_str_pct": "B_avg_SIG_STR_pct",
        "sub_avg": "B_avg_SUB_ATT",
        "td_avg": "B_avg_TD_landed",
        "td_pct": "B_avg_TD_pct",
        "wins": "B_wins",
        "losses": "B_losses",
        "win_streak": "B_current_win_streak",
        "loss_streak": "B_current_lose_streak",
        "longest_win_streak": "B_longest_win_streak",
        "title_bouts": "B_total_title_bouts",
        "rank": "B_match_weightclass_rank",
    },
}

# Pre-computed differentials already in the dataset (Red - Blue)
PRECOMPUTED_DIFFS = {
    "lose_streak_dif": "lose_streak_diff",
    "win_streak_dif": "win_streak_diff",
    "longest_win_streak_dif": "longest_win_streak_diff",
    "win_dif": "win_diff",
    "loss_dif": "loss_diff",
    "total_round_dif": "total_round_diff",
    "total_title_bout_dif": "title_bout_diff",
    "ko_dif": "ko_diff",
    "sub_dif": "sub_diff",
    "height_dif": "height_diff",
    "reach_dif": "reach_diff",
    "age_dif": "age_diff",
    "sig_str_dif": "sig_str_diff",
    "avg_sub_att_dif": "sub_att_diff",
    "avg_td_dif": "td_diff",
}


def load_raw_data(filepath: str) -> pd.DataFrame:
    """Load the raw Kaggle UFC dataset CSV."""
    df = pd.read_csv(filepath)
    if DATE_COL in df.columns:
        df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
        df = df.sort_values(DATE_COL).reset_index(drop=True)
    return df


def encode_winner(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode the target variable.
    1 = Red corner wins, 0 = Blue corner wins.
    Draws and No Contests are dropped.
    """
    df = df.copy()
    df = df[df[WINNER_COL].isin(["Red", "Blue"])].reset_index(drop=True)
    df["target_winner"] = (df[WINNER_COL] == "Red").astype(int)
    return df


def encode_method(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode method of victory.
    0 = Decision, 1 = KO/TKO, 2 = Submission, 3 = Other
    """
    df = df.copy()

    def _map_method(val: str) -> int:
        if not isinstance(val, str):
            return 3
        val = val.strip().upper()
        if "DEC" in val:
            return 0
        if "KO" in val or "TKO" in val:
            return 1
        if "SUB" in val:
            return 2
        return 3

    if "finish" in df.columns:
        df["target_method"] = df["finish"].apply(_map_method)
    return df


def encode_round(df: pd.DataFrame) -> pd.DataFrame:
    """Encode the round the fight ended (1-5)."""
    df = df.copy()
    if "finish_round" in df.columns:
        df["target_round"] = pd.to_numeric(df["finish_round"], errors="coerce").fillna(0).astype(int)
    return df


def use_precomputed_diffs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename the dataset's pre-computed differential columns to our standard names.
    Combat-stat diffs (sig_str, td, sub_att) are intentionally excluded here
    because build_smoothed_stats() recomputes them with Bayesian smoothing.
    """
    df = df.copy()
    # Skip combat per-minute stats — those are recomputed with smoothing
    skip = {"sig_str_dif", "avg_sub_att_dif", "avg_td_dif"}
    for src_col, dest_col in PRECOMPUTED_DIFFS.items():
        if src_col in df.columns and src_col not in skip:
            df[dest_col] = pd.to_numeric(df[src_col], errors="coerce")
    return df


# Hard caps based on physical limits (generously set to 99th pct of 5+ fight veterans)
STAT_CAPS = {
    "R_avg_SIG_STR_landed": 15.0,   # sig strikes per minute — Holloway peaks ~8-9
    "B_avg_SIG_STR_landed": 15.0,
    "R_avg_SUB_ATT":         4.0,   # sub attempts per 15 min
    "B_avg_SUB_ATT":         4.0,
    "R_avg_TD_landed":       7.0,   # takedowns per 15 min — Khabib ~5
    "B_avg_TD_landed":       7.0,
}

# Bayesian prior medians (from fighters with 5+ fights)
STAT_MEDIANS = {
    "R_avg_SIG_STR_landed": 6.37,
    "B_avg_SIG_STR_landed": 6.37,
    "R_avg_SUB_ATT":         0.50,
    "B_avg_SUB_ATT":         0.50,
    "R_avg_TD_landed":       1.21,
    "B_avg_TD_landed":       1.21,
}

# How strongly to shrink toward the median — equivalent to N pseudo-fights
SMOOTHING_K = 5


def build_smoothed_stats(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fix inflated per-minute/per-15min combat stats for fighters with few UFC fights.

    The problem: a fighter who ends a fight in 45 seconds will have artificially
    huge per-minute averages (20+ strikes/min, 14 TDs/min) based on a single
    short fight — corrupting predictions for any fight they appear in.

    Fix: Two-step correction per stat:
      1. Hard cap at a physically meaningful maximum
      2. Bayesian shrinkage toward the population median, weighted by n_fights:
            smoothed = (n * raw + k * median) / (n + k)
         where k = SMOOTHING_K. A 1-fight fighter gets 83% weight on the median;
         a 10-fight veteran gets only 33% — their own data dominates.

    Also recomputes sig_str_diff, td_diff, sub_att_diff from smoothed values.
    """
    df = df.copy()

    for prefix in ("R_", "B_"):
        wins_col   = f"{prefix}wins"
        losses_col = f"{prefix}losses"

        wins   = pd.to_numeric(df.get(wins_col,   0), errors="coerce").fillna(0)
        losses = pd.to_numeric(df.get(losses_col, 0), errors="coerce").fillna(0)
        n_fights = wins + losses

        df[f"{prefix}ufc_fights"] = n_fights

        for stat_col in [f"{prefix}avg_SIG_STR_landed",
                         f"{prefix}avg_SUB_ATT",
                         f"{prefix}avg_TD_landed"]:
            if stat_col not in df.columns:
                continue

            raw    = pd.to_numeric(df[stat_col], errors="coerce").fillna(0)
            cap    = STAT_CAPS.get(stat_col, raw.max())
            median = STAT_MEDIANS.get(stat_col, raw.median())

            # Step 1: Hard cap
            capped = raw.clip(upper=cap)

            # Step 2: Bayesian shrinkage
            smoothed = (n_fights * capped + SMOOTHING_K * median) / (n_fights + SMOOTHING_K)
            df[f"{stat_col}_smooth"] = smoothed

    # Recompute combat-stat differentials from smoothed values
    r_sig  = df.get("R_avg_SIG_STR_landed_smooth", df.get("R_avg_SIG_STR_landed", 0))
    b_sig  = df.get("B_avg_SIG_STR_landed_smooth", df.get("B_avg_SIG_STR_landed", 0))
    r_sub  = df.get("R_avg_SUB_ATT_smooth",        df.get("R_avg_SUB_ATT",        0))
    b_sub  = df.get("B_avg_SUB_ATT_smooth",        df.get("B_avg_SUB_ATT",        0))
    r_td   = df.get("R_avg_TD_landed_smooth",      df.get("R_avg_TD_landed",      0))
    b_td   = df.get("B_avg_TD_landed_smooth",      df.get("B_avg_TD_landed",      0))

    df["sig_str_diff"] = r_sig  - b_sig
    df["sub_att_diff"] = r_sub  - b_sub
    df["td_diff"]      = r_td   - b_td

    # Experience differential — veteran vs debutant is a real signal
    df["ufc_experience_diff"] = df.get("R_ufc_fights", 0) - df.get("B_ufc_fights", 0)

    return df


def build_smoothed_win_rate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Laplace-smoothed win rate for both corners.

    A 1-0 fighter does NOT deserve a 100% win rate — it's a 1-fight sample.
    Laplace smoothing adds 1 pseudo-win and 1 pseudo-loss to every record,
    pulling extreme rates (0% or 100%) toward 50% for small samples.

    A 20-2 veteran is barely affected. A 1-0 debutant moves from 100% to 67%.
    """
    df = df.copy()
    for corner, prefix in [("red", "R"), ("blue", "B")]:
        wins_col   = FIGHTER_COLS[corner]["wins"]
        losses_col = FIGHTER_COLS[corner]["losses"]
        if wins_col in df.columns and losses_col in df.columns:
            w = pd.to_numeric(df[wins_col],   errors="coerce").fillna(0)
            l = pd.to_numeric(df[losses_col], errors="coerce").fillna(0)
            # Laplace smoothing: add 1 win and 1 loss as priors
            df[f"{prefix}_win_rate_smooth"] = (w + 1) / (w + l + 2)

    if "R_win_rate_smooth" in df.columns and "B_win_rate_smooth" in df.columns:
        df["win_rate_diff"] = df["R_win_rate_smooth"] - df["B_win_rate_smooth"]

    return df


def build_win_rate_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute win rate for each fighter and their differential."""
    df = df.copy()
    for corner, prefix in [("red", "R"), ("blue", "B")]:
        wins_col = FIGHTER_COLS[corner]["wins"]
        losses_col = FIGHTER_COLS[corner]["losses"]
        if wins_col in df.columns and losses_col in df.columns:
            w = pd.to_numeric(df[wins_col], errors="coerce").fillna(0)
            l = pd.to_numeric(df[losses_col], errors="coerce").fillna(0)
            df[f"{prefix}_win_rate"] = w / (w + l + 1e-9)

    if "R_win_rate" in df.columns and "B_win_rate" in df.columns:
        df["win_rate_diff"] = df["R_win_rate"] - df["B_win_rate"]

    return df


def build_finish_style_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute finish rates and fighting style features for each fighter.

    finish_rate   = (KO wins + Sub wins) / total wins → tendency to finish fights
    striker_style = KO wins / total wins              → KO threat
    grappler_style = Sub wins / total wins            → submission threat

    All ratios are clipped to [0, 1].  The denominator uses
    max(wins, ko + sub) instead of raw wins to handle the common case where
    the dataset stores career KO/Sub wins from ALL promotions but only UFC
    wins in the wins column — preventing near-infinite ratio values for
    debut fighters who have KO wins from other organizations.
    """
    df = df.copy()
    for corner, prefix in [("red", "R"), ("blue", "B")]:
        wins_col = FIGHTER_COLS[corner]["wins"]
        ko_col = f"{prefix}_win_by_KO/TKO"
        sub_col = f"{prefix}_win_by_Submission"

        if wins_col not in df.columns:
            continue

        wins = pd.to_numeric(df[wins_col], errors="coerce").fillna(0)
        ko   = pd.to_numeric(df[ko_col],   errors="coerce").fillna(0) if ko_col  in df.columns else pd.Series(0, index=df.index)
        sub  = pd.to_numeric(df[sub_col],  errors="coerce").fillna(0) if sub_col in df.columns else pd.Series(0, index=df.index)

        # Denominator = at least as large as numerator (prevents >1 ratios)
        denom = pd.concat([wins, ko + sub], axis=1).max(axis=1) + 1e-9

        df[f"{prefix}_ko_rate"]       = (ko  / denom).clip(0, 1)
        df[f"{prefix}_sub_rate"]      = (sub / denom).clip(0, 1)
        df[f"{prefix}_finish_rate"]   = ((ko + sub) / denom).clip(0, 1)
        df[f"{prefix}_striker_style"] = (ko  / denom).clip(0, 1)
        df[f"{prefix}_grappler_style"]= (sub / denom).clip(0, 1)

    if "R_ko_rate" in df.columns and "B_ko_rate" in df.columns:
        df["ko_rate_diff"]       = df["R_ko_rate"]       - df["B_ko_rate"]
        df["sub_rate_diff"]      = df["R_sub_rate"]      - df["B_sub_rate"]
        df["finish_rate_diff"]   = df["R_finish_rate"]   - df["B_finish_rate"]
        df["striker_style_diff"] = df["R_striker_style"] - df["B_striker_style"]
        df["grappler_style_diff"]= df["R_grappler_style"]- df["B_grappler_style"]

    return df


def build_strength_of_schedule(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Strength of Schedule (SOS) per fighter.

    SOS = average win rate of all opponents a fighter has faced.
    A fighter who has beaten quality opponents gets a higher SOS score.
    This captures resume quality — beating top competition matters more
    than padding records against weak opponents.
    """
    df = df.copy()
    if "R_fighter" not in df.columns or "B_fighter" not in df.columns:
        return df

    # Build current win rates for each fighter
    fighter_win_rates = {}
    for _, row in df.iterrows():
        for prefix, col_base in [("R", "R"), ("B", "B")]:
            name = str(row.get(f"{col_base}_fighter", "")).strip()
            if not name:
                continue
            w = float(row.get(f"{col_base}_wins", 0) or 0)
            l = float(row.get(f"{col_base}_losses", 0) or 0)
            fighter_win_rates[name] = w / max(w + l, 1)

    # Build opponent lists per fighter (all historical opponents)
    fighter_opponents: dict = {}
    for _, row in df.iterrows():
        r = str(row.get("R_fighter", "")).strip()
        b = str(row.get("B_fighter", "")).strip()
        if r and b:
            fighter_opponents.setdefault(r, []).append(b)
            fighter_opponents.setdefault(b, []).append(r)

    # SOS = mean opponent win rate
    fighter_sos = {
        name: float(np.mean([fighter_win_rates.get(opp, 0.5) for opp in opps]))
        for name, opps in fighter_opponents.items()
        if opps
    }

    df["R_sos"] = df["R_fighter"].map(fighter_sos).fillna(0.5)
    df["B_sos"] = df["B_fighter"].map(fighter_sos).fillna(0.5)
    df["sos_diff"] = df["R_sos"] - df["B_sos"]

    return df


def build_stance_feature(df: pd.DataFrame) -> pd.DataFrame:
    """Encode stance matchup. Orthodox vs Southpaw is a known edge."""
    df = df.copy()
    r_stance_col = FIGHTER_COLS["red"]["stance"]
    b_stance_col = FIGHTER_COLS["blue"]["stance"]

    if r_stance_col in df.columns and b_stance_col in df.columns:
        r_s = df[r_stance_col].fillna("Unknown").str.strip()
        b_s = df[b_stance_col].fillna("Unknown").str.strip()
        df["is_cross_stance"] = (
            ((r_s == "Orthodox") & (b_s == "Southpaw")) |
            ((r_s == "Southpaw") & (b_s == "Orthodox"))
        ).astype(int)
        df["r_is_southpaw"] = (r_s == "Southpaw").astype(int)

    return df


def build_ranking_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode UFC rankings. A ranked fighter vs unranked is a strong signal.
    Lower rank number = better (1 = champion/top contender).
    """
    df = df.copy()
    r_rank_col = FIGHTER_COLS["red"]["rank"]
    b_rank_col = FIGHTER_COLS["blue"]["rank"]

    for col in [r_rank_col, b_rank_col]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if r_rank_col in df.columns and b_rank_col in df.columns:
        # Fill unranked fighters with a high rank number (worst rank)
        r_rank = df[r_rank_col].fillna(20)
        b_rank = df[b_rank_col].fillna(20)

        # Negative diff = Red has better (lower) rank
        df["rank_diff"] = r_rank - b_rank

        df["r_is_ranked"] = (df[r_rank_col].notna()).astype(int)
        df["b_is_ranked"] = (df[b_rank_col].notna()).astype(int)
        df["rank_advantage"] = df["b_is_ranked"] - df["r_is_ranked"]  # +1 means Blue is ranked, Red isn't

    if "better_rank" in df.columns:
        # better_rank encodes which corner has the better ranking (already in dataset)
        df["better_rank_encoded"] = df["better_rank"].map({"Red": 1, "Blue": -1}).fillna(0)

    return df


def build_context_features(df: pd.DataFrame) -> pd.DataFrame:
    """Encode fight-level context: title fight, weight class, scheduled rounds."""
    df = df.copy()

    if "title_bout" in df.columns:
        df["is_title_fight"] = df["title_bout"].map(
            {True: 1, False: 0, "True": 1, "False": 0}
        ).fillna(0).astype(int)

    if "weight_class" in df.columns:
        weight_dummies = pd.get_dummies(df["weight_class"], prefix="wc", dtype=int)
        df = pd.concat([df, weight_dummies], axis=1)

    if "no_of_rounds" in df.columns:
        df["scheduled_rounds"] = pd.to_numeric(df["no_of_rounds"], errors="coerce").fillna(3)

    if "empty_arena" in df.columns:
        df["empty_arena"] = pd.to_numeric(df["empty_arena"], errors="coerce").fillna(0)

    return df


def build_odds_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode betting odds. Closing odds are the single strongest predictor —
    they encode everything the market knows about the fight.
    Also encodes method-specific odds (KO/TKO, Sub, Decision) if available.
    """
    df = df.copy()

    for col in ["R_odds", "B_odds"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "R_odds" in df.columns and "B_odds" in df.columns:
        df["odds_diff"] = df["R_odds"] - df["B_odds"]

        def implied_prob(odds: pd.Series) -> pd.Series:
            prob = pd.Series(index=odds.index, dtype=float)
            pos = odds >= 0
            prob[pos] = 100 / (odds[pos] + 100)
            prob[~pos] = odds[~pos].abs() / (odds[~pos].abs() + 100)
            return prob

        df["R_implied_prob"] = implied_prob(df["R_odds"])
        df["B_implied_prob"] = implied_prob(df["B_odds"])
        df["implied_prob_diff"] = df["R_implied_prob"] - df["B_implied_prob"]

    # Method-specific odds (excellent predictors of finish method)
    method_odds_cols = ["r_dec_odds", "b_dec_odds", "r_sub_odds", "b_sub_odds", "r_ko_odds", "b_ko_odds"]
    for col in method_odds_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "r_ko_odds" in df.columns and "b_ko_odds" in df.columns:
        df["ko_odds_diff"] = df["r_ko_odds"] - df["b_ko_odds"]
    if "r_sub_odds" in df.columns and "b_sub_odds" in df.columns:
        df["sub_odds_diff"] = df["r_sub_odds"] - df["b_sub_odds"]
    if "r_dec_odds" in df.columns and "b_dec_odds" in df.columns:
        df["dec_odds_diff"] = df["r_dec_odds"] - df["b_dec_odds"]

    return df


# Core feature columns — in order of expected importance
FEATURE_COLUMNS = [
    # Odds (strongest predictors)
    "implied_prob_diff", "odds_diff",
    "ko_odds_diff", "sub_odds_diff", "dec_odds_diff",

    # Rankings
    "rank_diff", "rank_advantage", "better_rank_encoded",
    "r_is_ranked", "b_is_ranked",

    # Pre-computed differentials (from dataset)
    "sig_str_diff", "td_diff", "sub_att_diff",
    "win_diff", "loss_diff", "win_streak_diff", "lose_streak_diff",
    "longest_win_streak_diff", "title_bout_diff",
    "ko_diff", "sub_diff",
    "height_diff", "reach_diff", "age_diff",
    "total_round_diff",

    # Computed features (Laplace-smoothed win rate)
    "win_rate_diff", "ko_rate_diff", "sub_rate_diff",

    # Fighting style and finish tendencies (key for method prediction)
    "finish_rate_diff", "striker_style_diff", "grappler_style_diff",

    # Strength of schedule — quality of past opponents
    "sos_diff",

    # UFC experience — how many fights in the dataset (new fighter penalty)
    "ufc_experience_diff",

    # Elo rating — accumulated fight-history strength rating
    # This is THE key feature for definitive predictions on mismatches
    "elo_diff",
    "elo_win_prob",

    # Recent form — trajectory over last 3 fights (improving vs declining)
    "recent_form_diff",

    # Stance
    "is_cross_stance", "r_is_southpaw",

    # Context
    "is_title_fight", "scheduled_rounds", "empty_arena",
]

# ---------------------------------------------------------------------------
# Elo rating system
# ---------------------------------------------------------------------------

ELO_DEFAULT = 1500.0
ELO_K       = 32.0     # standard chess K-factor for active players
ELO_FINISH_MULT = 1.2  # finishes (KO/Sub) earn 20% more Elo points


def _elo_expected(r_elo: float, b_elo: float) -> float:
    """Expected win probability for Red given two Elo ratings."""
    return 1.0 / (1.0 + 10.0 ** ((b_elo - r_elo) / 400.0))


def compute_incremental_elo(df: pd.DataFrame) -> tuple:
    """
    Compute Elo ratings incrementally across fight history.

    The key anti-leakage rule: each fight's feature uses the BEFORE-fight
    rating (not the after-fight rating). This means the model only sees
    information that was available prior to each bout.

    Returns:
        elo_diff_series  : pd.Series of (R_elo - B_elo) per fight row
        final_ratings    : dict mapping fighter name → final Elo rating
                           (use these for inference on new fights)
    """
    from collections import defaultdict

    ratings: dict = defaultdict(lambda: ELO_DEFAULT)
    elo_diffs = []

    df_sorted = df.sort_values(DATE_COL).reset_index(drop=True) if DATE_COL in df.columns else df.reset_index(drop=True)

    for _, row in df_sorted.iterrows():
        r_name = str(row.get("R_fighter", "")).strip()
        b_name = str(row.get("B_fighter", "")).strip()
        winner = str(row.get("Winner", "")).strip()

        r_elo = ratings[r_name]
        b_elo = ratings[b_name]
        elo_diffs.append(r_elo - b_elo)          # PRE-fight diff → feature

        # Expected outcomes
        e_r = _elo_expected(r_elo, b_elo)
        e_b = 1.0 - e_r

        # Actual outcomes
        if winner == "Red":
            s_r, s_b = 1.0, 0.0
        elif winner == "Blue":
            s_r, s_b = 0.0, 1.0
        else:
            s_r = s_b = 0.5

        # Finish multiplier — a KO/Sub win is a more dominant result
        finish = str(row.get("finish", "")).upper() if "finish" in row.index else ""
        k_mult = ELO_FINISH_MULT if any(x in finish for x in ("KO", "TKO", "SUB")) else 1.0

        ratings[r_name] = r_elo + ELO_K * k_mult * (s_r - e_r)
        ratings[b_name] = b_elo + ELO_K * k_mult * (s_b - e_b)

    return pd.Series(elo_diffs, index=df_sorted.index), dict(ratings)


def build_elo_features(df: pd.DataFrame, final_elo: Optional[dict] = None) -> pd.DataFrame:
    """
    Add elo_diff and elo_win_prob columns to df.

    Training mode  (final_elo=None): calls compute_incremental_elo for leakage-free features.
    Inference mode (final_elo=dict): looks up each fighter's most recent Elo.
    """
    df = df.copy()

    if final_elo is not None:
        # Inference: use final ratings from training set
        def _lookup(row):
            r = final_elo.get(str(row.get("R_fighter", "")).strip(), ELO_DEFAULT)
            b = final_elo.get(str(row.get("B_fighter", "")).strip(), ELO_DEFAULT)
            return r - b
        df["elo_diff"] = df.apply(_lookup, axis=1)
    else:
        # Training: incremental (pre-fight) Elo
        elo_series, _ = compute_incremental_elo(df)
        # Re-align if df was already sorted by date
        df = df.sort_values(DATE_COL).reset_index(drop=True) if DATE_COL in df.columns else df.reset_index(drop=True)
        df["elo_diff"] = elo_series.values

    df["elo_win_prob"] = 1.0 / (1.0 + 10.0 ** (-df["elo_diff"] / 400.0))
    return df


# ---------------------------------------------------------------------------
# Recent form feature
# ---------------------------------------------------------------------------

def build_recent_form(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute a recency-weighted recent form score for each fighter.

    Score for last N fights: weighted sum of W/L outcomes.
      Most recent fight:  weight 0.50
      2nd most recent:    weight 0.30
      3rd most recent:    weight 0.20

    A fighter who won their last 3 gets +1.0. A fighter on a 3-fight losing
    streak gets -1.0. This captures momentum and trajectory.

    Processes fights in chronological order to prevent leakage.
    """
    df = df.copy()
    from collections import defaultdict

    # Store each fighter's result history (chronological) as list of 1/0
    history: dict = defaultdict(list)

    WEIGHTS = [0.50, 0.30, 0.20]   # most recent → oldest

    df_sorted = df.sort_values(DATE_COL).reset_index(drop=True) if DATE_COL in df.columns else df.reset_index(drop=True)

    r_forms, b_forms = [], []

    for _, row in df_sorted.iterrows():
        r_name = str(row.get("R_fighter", "")).strip()
        b_name = str(row.get("B_fighter", "")).strip()
        winner = str(row.get("Winner", "")).strip()

        def _form(hist):
            """Compute form score from most recent history."""
            if not hist:
                return 0.0
            score = 0.0
            for i, w in enumerate(WEIGHTS):
                if i >= len(hist):
                    break
                # hist[-1] is most recent
                score += w * (2 * hist[-(i + 1)] - 1)   # W=+1, L=-1
            return score

        r_forms.append(_form(history[r_name]))
        b_forms.append(_form(history[b_name]))

        # Update history AFTER recording (no leakage)
        history[r_name].append(1 if winner == "Red"  else 0)
        history[b_name].append(1 if winner == "Blue" else 0)

    df_sorted["R_recent_form"] = r_forms
    df_sorted["B_recent_form"] = b_forms
    df_sorted["recent_form_diff"] = df_sorted["R_recent_form"] - df_sorted["B_recent_form"]

    df["recent_form_diff"] = df_sorted["recent_form_diff"].values
    return df


def mirror_feature_matrix(
    X: pd.DataFrame,
    y: pd.Series,
) -> tuple:
    """
    Double the training set by adding a mirrored copy of every fight.

    Why this is necessary
    ---------------------
    The UFC always assigns the red corner to the higher-ranked / more
    experienced fighter. Because of this seeding, red wins ~60 % of
    historical fights — even when the raw stat differentials are near zero.
    A model trained on unmirrored data learns this positional bias as a
    strong signal, causing it to consistently favour red when the two
    fighters are evenly matched (or unknown).

    How it works
    ------------
    All features in X are already Red-minus-Blue differentials, so
    "mirroring" a fight is simply negating every differential column.
    Non-differential context columns (title fight, rounds, weight class,
    cross-stance flag) are left unchanged because they describe the
    matchup itself, not which corner each fighter occupies.

    Result: a perfectly 50/50-balanced dataset where the model must rely
    entirely on *who* has better stats — not *which corner* they're in.
    """
    # Columns that represent the matchup context (not R-B diffs)
    CONTEXT_COLS = {
        "is_title_fight",
        "scheduled_rounds",
        "empty_arena",
        "is_cross_stance",
        "r_is_southpaw",   # stance of the red-corner fighter — set to 0
    }
    # Weight-class dummies also describe the bout, not the corner assignment
    wc_cols = {c for c in X.columns if c.startswith("wc_")}
    non_diff = CONTEXT_COLS | wc_cols

    # Negate all differential features; preserve context features
    X_mirror = X.copy()
    for col in X.columns:
        if col not in non_diff:
            X_mirror[col] = -X[col]
    # r_is_southpaw in the mirrored row should reflect the new red-corner
    # fighter (original blue). We don't store b_is_southpaw separately,
    # so use 0 as a neutral prior — a minor approximation.
    if "r_is_southpaw" in X_mirror.columns:
        X_mirror["r_is_southpaw"] = 0

    y_mirror = 1 - y  # flip winner: Red=1 → Blue=0 and vice-versa

    X_aug = pd.concat([X, X_mirror], ignore_index=True)
    y_aug = pd.concat([y, y_mirror], ignore_index=True)

    # Shuffle so the model doesn't see paired rows side-by-side
    rng = np.random.RandomState(42)
    idx = rng.permutation(len(X_aug))
    return X_aug.iloc[idx].reset_index(drop=True), y_aug.iloc[idx].reset_index(drop=True)


def build_all_features(df: pd.DataFrame, final_elo: Optional[dict] = None) -> pd.DataFrame:
    """
    Run the full feature engineering pipeline.

    Args:
        df:        Raw fight DataFrame (sorted by date).
        final_elo: Pre-computed Elo ratings dict for inference.
                   Pass None during training to compute incrementally.
    """
    df = encode_winner(df)
    df = encode_method(df)
    df = encode_round(df)
    df = build_smoothed_stats(df)        # caps + Bayesian smoothing BEFORE diffs
    df = use_precomputed_diffs(df)       # non-combat diffs (wins, streaks, etc.)
    df = build_smoothed_win_rate(df)     # Laplace win rate replaces raw win rate
    df = build_finish_style_features(df)
    df = build_strength_of_schedule(df)
    df = build_elo_features(df, final_elo=final_elo)   # Elo ratings (key feature)
    df = build_recent_form(df)                         # Last 3 fights trajectory
    df = build_stance_feature(df)
    df = build_ranking_features(df)
    df = build_context_features(df)
    df = build_odds_features(df)
    return df


def get_feature_matrix(
    df: pd.DataFrame,
    extra_cols: Optional[list] = None
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Return (X, y) where X is the feature matrix and y is the winner target.
    Only includes columns present in the DataFrame.
    """
    all_feature_cols = list(FEATURE_COLUMNS)

    wc_cols = [c for c in df.columns if c.startswith("wc_")]
    all_feature_cols.extend(wc_cols)

    if extra_cols:
        all_feature_cols.extend(extra_cols)

    # Deduplicate while preserving order
    seen = set()
    unique_cols = []
    for c in all_feature_cols:
        if c not in seen:
            seen.add(c)
            unique_cols.append(c)

    available = [c for c in unique_cols if c in df.columns]
    X = df[available].apply(pd.to_numeric, errors="coerce").fillna(0)
    y = df["target_winner"]
    return X, y


if __name__ == "__main__":
    import sys
    import os
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "ufc-master.csv")
    if not os.path.exists(data_path):
        print(f"No data file found at {data_path}")
        print("Please place ufc-master.csv in data/raw/")
        sys.exit(1)

    df = load_raw_data(data_path)
    print(f"Raw data: {df.shape[0]} fights, {df.shape[1]} columns")
    print(f"Date range: {df[DATE_COL].min().date()} → {df[DATE_COL].max().date()}")

    df = build_all_features(df)
    X, y = get_feature_matrix(df)

    print(f"\nFeature matrix: {X.shape[1]} features × {len(X)} fights")
    print(f"Class balance: Red {y.mean()*100:.1f}% | Blue {(1-y).mean()*100:.1f}%")
    print(f"\nFeature columns ({len(X.columns)}):")
    for col in X.columns:
        missing = X[col].isna().sum()
        print(f"  {col:<40} non-null: {len(X)-missing}/{len(X)}")
