"""
UFC Prediction API — Flask server for the kylesuda.com UFC predictor tool.

Endpoints:
    GET  /health              — liveness check
    GET  /fighters            — list of all known fighters (for autocomplete)
    POST /predict             — predict a single matchup
    POST /card                — predict an entire event

Usage:
    python src/api.py               # dev mode (port 5001)
    FLASK_PORT=8080 python src/api.py

CORS is enabled for all origins so the React frontend can call it locally
or from kylesuda.com.
"""

import os
import sys
import json
import warnings
import logging

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ufc-api")

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── load predictor once at startup ──────────────────────────────────────────
predictor = None
fighter_names: list[str] = []

WEIGHT_CLASSES = [
    "Heavyweight",
    "Light Heavyweight",
    "Middleweight",
    "Welterweight",
    "Lightweight",
    "Featherweight",
    "Bantamweight",
    "Flyweight",
    "Women's Featherweight",
    "Women's Bantamweight",
    "Women's Flyweight",
    "Women's Strawweight",
]


def _load():
    global predictor, fighter_names
    if predictor is not None:
        return

    log.info("Loading UFC predictor models…")
    from predict import UFCPredictor
    predictor = UFCPredictor()
    log.info("Models loaded.")

    # build fighter name list from the training CSV
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "ufc-master.csv")
    try:
        import pandas as pd
        df = pd.read_csv(data_path, usecols=["R_fighter", "B_fighter"])
        names = set(df["R_fighter"].dropna().tolist()) | set(df["B_fighter"].dropna().tolist())
        fighter_names = sorted(names)
        log.info(f"Loaded {len(fighter_names)} fighter names.")
    except Exception as e:
        log.warning(f"Could not load fighter names: {e}")
        fighter_names = []


@app.before_request
def ensure_loaded():
    _load()


# ── helpers ─────────────────────────────────────────────────────────────────

def _parse_odds(val):
    """Parse American odds string/number, return float or None."""
    try:
        v = float(str(val).replace("+", "").strip())
        return v if v != 0 else None
    except (ValueError, TypeError):
        return None


def _safe_float(val, default=None):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


# ── routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "fighters_loaded": len(fighter_names)})


@app.get("/fighters")
def get_fighters():
    """Return the list of all known fighter names for autocomplete."""
    q = request.args.get("q", "").strip().lower()
    if q:
        matches = [n for n in fighter_names if q in n.lower()][:40]
    else:
        matches = fighter_names[:200]
    return jsonify({"fighters": matches})


@app.post("/predict")
def predict():
    """
    Predict a single fight.

    JSON body:
    {
        "red_name":   "Jon Jones",
        "blue_name":  "Stipe Miocic",
        "weight_class": "Heavyweight",
        "is_title_fight": true,
        "scheduled_rounds": 5,
        "red_odds":   -400,    // optional
        "blue_odds":  320,     // optional
        "red_dec_odds":  null, // optional
        "blue_dec_odds": null,
        "red_ko_odds":   null,
        "blue_ko_odds":  null,
        "red_sub_odds":  null,
        "blue_sub_odds": null
    }
    """
    body = request.get_json(force=True, silent=True) or {}

    red_name  = str(body.get("red_name",  "")).strip()
    blue_name = str(body.get("blue_name", "")).strip()

    if not red_name or not blue_name:
        return jsonify({"error": "red_name and blue_name are required"}), 400

    weight_class    = str(body.get("weight_class", "Lightweight")).strip()
    is_title_fight  = bool(body.get("is_title_fight", False))
    sched_rounds    = int(body.get("scheduled_rounds", 3))

    context = {
        "weight_class":     weight_class,
        "is_title_fight":   is_title_fight,
        "scheduled_rounds": sched_rounds,
    }

    # Optional odds
    r_odds = _parse_odds(body.get("red_odds"))
    b_odds = _parse_odds(body.get("blue_odds"))
    if r_odds is not None:
        context["r_odds"] = r_odds
    if b_odds is not None:
        context["b_odds"] = b_odds

    for key in ("red_dec_odds", "blue_dec_odds", "red_ko_odds", "blue_ko_odds",
                "red_sub_odds", "blue_sub_odds"):
        v = _parse_odds(body.get(key))
        if v is not None:
            ctx_key = key.replace("red_", "r_").replace("blue_", "b_")
            context[ctx_key] = v

    try:
        result = predictor.predict_fight(
            red={}, blue={}, context=context,
            red_name=red_name, blue_name=blue_name,
        )
    except Exception as e:
        log.exception("Prediction error")
        return jsonify({"error": str(e)}), 500

    # Flatten for JSON response
    r_win_prob = result.get("red_win_probability", 0.5)
    b_win_prob = result.get("blue_win_probability", 0.5)
    winner_is_red = result.get("winner_is_red", True)
    loser = blue_name if winner_is_red else red_name
    loser_conf = round((b_win_prob if winner_is_red else r_win_prob) * 100, 1)

    # method_probabilities keys from predict.py
    raw_method_probs = result.get("method_probabilities") or {}
    response = {
        "red_fighter":         result["red_fighter"],
        "blue_fighter":        result["blue_fighter"],
        "winner":              result["winner"],
        "winner_confidence":   round(result["winner_confidence"] * 100, 1),
        "red_win_probability": round(r_win_prob * 100, 1),
        "blue_win_probability": round(b_win_prob * 100, 1),
        "loser":               loser,
        "loser_confidence":    loser_conf,
        "predicted_method":    result.get("predicted_method"),
        "method_confidence":   round((result.get("method_confidence") or 0) * 100, 1),
        "method_probs":        {k: round(v * 100, 1) for k, v in raw_method_probs.items()},
        "predicted_round":     result.get("predicted_round"),
        "round_confidence":    round((result.get("round_confidence") or 0) * 100, 1),
        "r_elo":               result.get("r_elo"),
        "b_elo":               result.get("b_elo"),
        "value":               None,
    }

    # Value bet analysis
    v = result.get("value")
    if v:
        response["value"] = {
            "r_model_pct":     round(v.get("r_model_pct", 0) * 100, 1),
            "b_model_pct":     round(v.get("b_model_pct", 0) * 100, 1),
            "r_vegas_pct":     round(v.get("r_vegas_pct", 0) * 100, 1),
            "b_vegas_pct":     round(v.get("b_vegas_pct", 0) * 100, 1),
            "r_edge":          round(v.get("r_edge", 0) * 100, 1),
            "b_edge":          round(v.get("b_edge", 0) * 100, 1),
            "r_kelly":         round((v.get("r_kelly") or 0) * 100, 2),
            "b_kelly":         round((v.get("b_kelly") or 0) * 100, 2),
            "value_threshold": 8.0,
        }

    return jsonify(response)


@app.post("/card")
def predict_card():
    """
    Predict multiple fights at once.

    JSON body:
    {
        "event_name": "UFC 312",
        "fights": [
            { "red_name": "...", "blue_name": "...", "weight_class": "...", ... },
            ...
        ]
    }
    """
    body = request.get_json(force=True, silent=True) or {}
    fights = body.get("fights", [])
    if not fights:
        return jsonify({"error": "fights array is required"}), 400

    results = []
    for fight in fights:
        r = predict.__wrapped__(fight) if hasattr(predict, "__wrapped__") else None
        # Re-use the single predict logic
        red_name  = str(fight.get("red_name",  "")).strip()
        blue_name = str(fight.get("blue_name", "")).strip()
        if not red_name or not blue_name:
            continue

        context = {
            "weight_class":     str(fight.get("weight_class", "Lightweight")),
            "is_title_fight":   bool(fight.get("is_title_fight", False)),
            "scheduled_rounds": int(fight.get("scheduled_rounds", 3)),
        }
        for k in ("r_odds", "b_odds", "r_dec_odds", "b_dec_odds",
                  "r_ko_odds", "b_ko_odds", "r_sub_odds", "b_sub_odds"):
            v = _parse_odds(fight.get(k))
            if v is not None:
                context[k] = v

        try:
            result = predictor.predict_fight(
                red={}, blue={}, context=context,
                red_name=red_name, blue_name=blue_name,
            )
            v = result.get("value")
            r_wp = result.get("red_win_probability", 0.5)
            b_wp = result.get("blue_win_probability", 0.5)
            results.append({
                "red_fighter":        result["red_fighter"],
                "blue_fighter":       result["blue_fighter"],
                "winner":             result["winner"],
                "winner_confidence":  round(result["winner_confidence"] * 100, 1),
                "red_win_probability": round(r_wp * 100, 1),
                "blue_win_probability": round(b_wp * 100, 1),
                "predicted_method":   result.get("predicted_method"),
                "method_confidence":  round((result.get("method_confidence") or 0) * 100, 1),
                "predicted_round":    result.get("predicted_round"),
                "r_elo":              result.get("r_elo"),
                "b_elo":              result.get("b_elo"),
                "value": {
                    "r_model_pct": round(v.get("r_model_pct", 0) * 100, 1),
                    "b_model_pct": round(v.get("b_model_pct", 0) * 100, 1),
                    "r_vegas_pct": round(v.get("r_vegas_pct", 0) * 100, 1),
                    "b_vegas_pct": round(v.get("b_vegas_pct", 0) * 100, 1),
                    "r_edge":      round(v.get("r_edge", 0) * 100, 1),
                    "b_edge":      round(v.get("b_edge", 0) * 100, 1),
                    "r_kelly":     round((v.get("r_kelly") or 0) * 100, 2),
                    "b_kelly":     round((v.get("b_kelly") or 0) * 100, 2),
                } if v else None,
            })
        except Exception as e:
            log.warning(f"Error predicting {red_name} vs {blue_name}: {e}")
            results.append({"red_fighter": red_name, "blue_fighter": blue_name, "error": str(e)})

    return jsonify({"event": body.get("event_name", ""), "predictions": results})


@app.get("/weight_classes")
def get_weight_classes():
    return jsonify({"weight_classes": WEIGHT_CLASSES})


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    log.info(f"Starting UFC Prediction API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
