"""
UFC Prediction API — Flask server for the kylesuda.com UFC predictor tool.

Endpoints:
    GET  /health              — liveness check
    GET  /fighters            — list of all known fighters (for autocomplete)
    POST /predict             — predict a single matchup
    POST /card                — predict an entire event
    GET  /next-card           — scrape next UFCStats event + predict
    GET  /weight_classes      — static weight class list

Usage:
    python src/api.py               # dev mode (port 5001)
    FLASK_PORT=8080 python src/api.py
"""

import os
import sys
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
fighter_names: list = []

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


def _format_value(v):
    """
    Map predict.py value keys → API / client contract.

    predict.py emits: red_pure_prob, red_vegas_prob, red_edge, red_kelly, …
    client expects:   r_model_pct,   r_vegas_pct,   r_edge,   r_kelly, …
    """
    if not v:
        return None

    r_model = v.get("red_pure_prob", v.get("r_model_pct"))
    b_model = v.get("blue_pure_prob", v.get("b_model_pct"))
    r_vegas = v.get("red_vegas_prob", v.get("r_vegas_pct"))
    b_vegas = v.get("blue_vegas_prob", v.get("b_vegas_pct"))
    r_edge = v.get("red_edge", v.get("r_edge", 0))
    b_edge = v.get("blue_edge", v.get("b_edge", 0))
    r_kelly = v.get("red_kelly", v.get("r_kelly"))
    b_kelly = v.get("blue_kelly", v.get("b_kelly"))

    # Accept either fractions (0–1) or pre-scaled percentages
    def as_pct(x):
        if x is None:
            return 0.0
        x = float(x)
        return round(x * 100, 1) if x <= 1.0 else round(x, 1)

    def as_kelly_pct(x):
        if x is None:
            return 0.0
        x = float(x)
        return round(x * 100, 2) if abs(x) <= 1.0 else round(x, 2)

    return {
        "r_model_pct": as_pct(r_model),
        "b_model_pct": as_pct(b_model),
        "r_vegas_pct": as_pct(r_vegas),
        "b_vegas_pct": as_pct(b_vegas),
        "r_edge": as_pct(r_edge),
        "b_edge": as_pct(b_edge),
        "r_kelly": as_kelly_pct(r_kelly),
        "b_kelly": as_kelly_pct(b_kelly),
        "value_threshold": 8.0,
    }


def _build_context(body):
    """
    Build predict.py context from an API request body.

    predict.py expects red_odds / blue_odds (not r_odds / b_odds).
    """
    weight_class = str(body.get("weight_class", "Lightweight")).strip()
    is_title_fight = bool(body.get("is_title_fight", False))
    sched_rounds = int(body.get("scheduled_rounds", 3))

    context = {
        "weight_class": weight_class,
        "is_title_fight": is_title_fight,
        "scheduled_rounds": sched_rounds,
    }

    r_odds = _parse_odds(body.get("red_odds", body.get("r_odds")))
    b_odds = _parse_odds(body.get("blue_odds", body.get("b_odds")))
    if r_odds is not None:
        context["red_odds"] = r_odds
    if b_odds is not None:
        context["blue_odds"] = b_odds

    r_ko = _parse_odds(body.get("red_ko_odds", body.get("r_ko_odds")))
    b_ko = _parse_odds(body.get("blue_ko_odds", body.get("b_ko_odds")))
    r_sub = _parse_odds(body.get("red_sub_odds", body.get("r_sub_odds")))
    b_sub = _parse_odds(body.get("blue_sub_odds", body.get("b_sub_odds")))
    r_dec = _parse_odds(body.get("red_dec_odds", body.get("r_dec_odds")))
    b_dec = _parse_odds(body.get("blue_dec_odds", body.get("b_dec_odds")))

    if r_ko is not None and b_ko is not None:
        context["ko_odds_diff"] = r_ko - b_ko
    if r_sub is not None and b_sub is not None:
        context["sub_odds_diff"] = r_sub - b_sub
    if r_dec is not None and b_dec is not None:
        context["dec_odds_diff"] = r_dec - b_dec

    return context


def _format_prediction(result, extra=None):
    """Flatten a UFCPredictor result into the JSON shape the React client expects."""
    r_win_prob = result.get("red_win_probability", 0.5)
    b_win_prob = result.get("blue_win_probability", 0.5)
    winner_is_red = result.get("winner_is_red", True)
    red_name = result["red_fighter"]
    blue_name = result["blue_fighter"]
    loser = blue_name if winner_is_red else red_name
    loser_conf = round((b_win_prob if winner_is_red else r_win_prob) * 100, 1)

    raw_method_probs = result.get("method_probabilities") or {}
    payload = {
        "red_fighter": red_name,
        "blue_fighter": blue_name,
        "winner": result["winner"],
        "winner_confidence": round(result["winner_confidence"] * 100, 1),
        "red_win_probability": round(r_win_prob * 100, 1),
        "blue_win_probability": round(b_win_prob * 100, 1),
        "loser": loser,
        "loser_confidence": loser_conf,
        "predicted_method": result.get("predicted_method"),
        "method_confidence": round((result.get("method_confidence") or 0) * 100, 1),
        "method_probs": {k: round(v * 100, 1) for k, v in raw_method_probs.items()},
        "predicted_round": result.get("predicted_round"),
        "round_confidence": round((result.get("round_confidence") or 0) * 100, 1),
        "r_elo": result.get("r_elo"),
        "b_elo": result.get("b_elo"),
        "value": _format_value(result.get("value")),
    }
    if extra:
        payload.update(extra)
    return payload


def _map_weight_class(raw: str) -> str:
    """Map UFCStats weight-class text to our canonical labels."""
    text = (raw or "").lower().strip()
    mapping = {
        "women's strawweight": "Women's Strawweight",
        "women's flyweight": "Women's Flyweight",
        "women's bantamweight": "Women's Bantamweight",
        "women's featherweight": "Women's Featherweight",
        "strawweight": "Women's Strawweight",
        "flyweight": "Flyweight",
        "bantamweight": "Bantamweight",
        "featherweight": "Featherweight",
        "lightweight": "Lightweight",
        "welterweight": "Welterweight",
        "middleweight": "Middleweight",
        "light heavyweight": "Light Heavyweight",
        "heavyweight": "Heavyweight",
        "catch weight": "Lightweight",
        "open weight": "Heavyweight",
    }
    # Prefer longer keys so "women's flyweight" wins over "flyweight"
    for key, val in sorted(mapping.items(), key=lambda kv: -len(kv[0])):
        if key in text:
            return val
    return "Lightweight"


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
        "red_odds":   -400,
        "blue_odds":  320
    }
    """
    body = request.get_json(force=True, silent=True) or {}

    red_name = str(body.get("red_name", "")).strip()
    blue_name = str(body.get("blue_name", "")).strip()

    if not red_name or not blue_name:
        return jsonify({"error": "red_name and blue_name are required"}), 400

    context = _build_context(body)

    try:
        result = predictor.predict_fight(
            red={}, blue={}, context=context,
            red_name=red_name, blue_name=blue_name,
        )
    except Exception as e:
        log.exception("Prediction error")
        return jsonify({"error": str(e)}), 500

    return jsonify(_format_prediction(result))


@app.post("/card")
def predict_card():
    """Predict multiple fights at once."""
    body = request.get_json(force=True, silent=True) or {}
    fights = body.get("fights", [])
    if not fights:
        return jsonify({"error": "fights array is required"}), 400

    results = []
    for fight in fights:
        red_name = str(fight.get("red_name", "")).strip()
        blue_name = str(fight.get("blue_name", "")).strip()
        if not red_name or not blue_name:
            continue

        context = _build_context(fight)

        try:
            result = predictor.predict_fight(
                red={}, blue={}, context=context,
                red_name=red_name, blue_name=blue_name,
            )
            results.append(_format_prediction(result))
        except Exception as e:
            log.warning(f"Error predicting {red_name} vs {blue_name}: {e}")
            results.append({"red_fighter": red_name, "blue_fighter": blue_name, "error": str(e)})

    return jsonify({"event": body.get("event_name", ""), "predictions": results})


@app.get("/next-card")
def next_card():
    """
    Scrape the next upcoming UFC event from UFCStats and return predictions
    for every announced fight.
    """
    try:
        import requests as req
        from bs4 import BeautifulSoup
    except ImportError as e:
        return jsonify({"error": f"Missing dependency: {e}"}), 500

    BASE = "http://www.ufcstats.com"
    HDRS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    # 1. Get list of upcoming events
    try:
        resp = req.get(f"{BASE}/statistics/events/upcoming", headers=HDRS, timeout=14)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        return jsonify({"error": f"Cannot fetch events list: {e}"}), 503

    events = []
    for row in soup.select("tr.b-statistics__table-row"):
        a = row.find("a", class_="b-link")
        if not a or "event-details" not in a.get("href", ""):
            continue
        date_span = row.find("span", class_="b-statistics__date")
        tds = row.find_all("td")
        location = tds[1].get_text(strip=True) if len(tds) > 1 else ""
        events.append({
            "name": a.text.strip(),
            "url": a["href"],
            "date": date_span.text.strip() if date_span else "",
            "location": location,
        })

    if not events:
        return jsonify({"error": "No upcoming events found on UFCStats"}), 404

    event = events[0]

    # 2. Scrape fights from the event page
    try:
        resp = req.get(event["url"], headers=HDRS, timeout=14)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        return jsonify({"error": f"Cannot fetch event page: {e}"}), 503

    fights_raw = []
    for row in soup.select("tr.b-fight-details__table-row"):
        if not row.get("data-link"):
            continue
        anchors = row.select("td p.b-fight-details__table-text a")
        names = [a.text.strip() for a in anchors if a.text.strip()]
        if len(names) < 2:
            continue
        cols = row.find_all("td")
        wc_raw = cols[6].get_text(" ", strip=True) if len(cols) > 6 else ""
        wc = _map_weight_class(wc_raw)
        first_col_text = cols[0].get_text(" ").lower() if cols else ""
        is_title = "title" in first_col_text or "championship" in first_col_text
        fights_raw.append({
            "red": names[0], "blue": names[1],
            "weight_class": wc, "is_title": is_title,
        })

    if not fights_raw:
        return jsonify({"error": "No fights found on the event page — fights may not be announced yet"}), 404

    # 3. Run predictions for each fight
    predictions = []
    for i, f in enumerate(fights_raw):
        is_main = (i == 0)
        try:
            result = predictor.predict_fight(
                red={}, blue={},
                context={
                    "weight_class": f["weight_class"],
                    "is_title_fight": f["is_title"] or is_main,
                    "scheduled_rounds": 5 if (f["is_title"] or is_main) else 3,
                },
                red_name=f["red"], blue_name=f["blue"],
            )
            predictions.append(_format_prediction(result, extra={
                "weight_class": f["weight_class"],
                "is_main_event": is_main,
                "is_title_fight": f["is_title"],
            }))
        except Exception as e:
            log.warning(f"Prediction error for {f['red']} vs {f['blue']}: {e}")
            predictions.append({
                "red_fighter": f["red"],
                "blue_fighter": f["blue"],
                "weight_class": f["weight_class"],
                "is_main_event": is_main,
                "error": str(e),
            })

    return jsonify({
        "event_name": event["name"],
        "event_date": event["date"],
        "location": event.get("location", ""),
        "predictions": predictions,
    })


@app.get("/weight_classes")
def get_weight_classes():
    return jsonify({"weight_classes": WEIGHT_CLASSES})


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    log.info(f"Starting UFC Prediction API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
