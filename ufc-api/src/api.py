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


def _fuzzy_name_match(a: str, b: str) -> bool:
    """Return True if two fighter name strings likely refer to the same person."""
    a, b = a.lower().strip(), b.lower().strip()
    if a == b:
        return True
    last_a = a.split()[-1] if a else ""
    last_b = b.split()[-1] if b else ""
    if last_a and last_b and last_a == last_b and len(last_a) > 3:
        return True
    return (last_a in b) or (last_b in a)


def _fetch_hardrock_odds() -> list:
    """
    Fetch current UFC fight odds from The Odds API (Hard Rock Bet book).

    Requires ODDS_API_KEY environment variable (free at the-odds-api.com).
    Free tier = 500 requests/month.  Returns [] gracefully when key missing.

    Returns a list of dicts:
        { home, away, home_odds, away_odds, commence_time, last_update }
    """
    import requests as req

    api_key = os.environ.get("ODDS_API_KEY", "").strip()
    if not api_key:
        log.debug("ODDS_API_KEY not set — skipping Hardrock odds fetch")
        return []

    url = "https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds"
    params = {
        "apiKey":      api_key,
        "bookmakers":  "hardrockbet",
        "markets":     "h2h",
        "oddsFormat":  "american",
    }
    try:
        resp = req.get(url, params=params, timeout=12)
        resp.raise_for_status()
        events = resp.json()
        remaining = resp.headers.get("x-requests-remaining", "?")
        log.info(f"Hardrock odds fetched — {len(events)} events, {remaining} API calls remaining")
    except Exception as e:
        log.warning(f"Hardrock odds fetch failed: {e}")
        return []

    results = []
    for event in events:
        home = event.get("home_team", "")
        away = event.get("away_team", "")
        commence_time = event.get("commence_time", "")
        for bm in event.get("bookmakers", []):
            if bm.get("key") != "hardrockbet":
                continue
            for market in bm.get("markets", []):
                if market.get("key") != "h2h":
                    continue
                outcomes = {o["name"]: o["price"] for o in market.get("outcomes", [])}
                if home in outcomes and away in outcomes:
                    results.append({
                        "home":         home,
                        "away":         away,
                        "home_odds":    int(outcomes[home]),
                        "away_odds":    int(outcomes[away]),
                        "commence_time": commence_time,
                        "last_update":  bm.get("last_update", ""),
                    })
    return results


def _match_hardrock_to_fights(predictions: list, hardrock_odds: list) -> None:
    """Mutate each prediction dict to add hardrock_r_odds / hardrock_b_odds if matched."""
    for pred in predictions:
        if pred.get("error"):
            continue
        red, blue = pred.get("red_fighter", ""), pred.get("blue_fighter", "")
        for hro in hardrock_odds:
            h, a = hro["home"], hro["away"]
            if _fuzzy_name_match(h, red) and _fuzzy_name_match(a, blue):
                pred["hardrock_r_odds"]   = hro["home_odds"]
                pred["hardrock_b_odds"]   = hro["away_odds"]
                pred["hardrock_updated"]  = hro.get("last_update", "")
                break
            elif _fuzzy_name_match(h, blue) and _fuzzy_name_match(a, red):
                pred["hardrock_r_odds"]   = hro["away_odds"]
                pred["hardrock_b_odds"]   = hro["home_odds"]
                pred["hardrock_updated"]  = hro.get("last_update", "")
                break


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

    WC_MAP = {
        "strawweight": "Women's Strawweight",
        "women's strawweight": "Women's Strawweight",
        "flyweight": "Flyweight",
        "women's flyweight": "Women's Flyweight",
        "bantamweight": "Bantamweight",
        "women's bantamweight": "Women's Bantamweight",
        "featherweight": "Featherweight",
        "women's featherweight": "Women's Featherweight",
        "lightweight": "Lightweight",
        "welterweight": "Welterweight",
        "middleweight": "Middleweight",
        "light heavyweight": "Light Heavyweight",
        "heavyweight": "Heavyweight",
        "catch weight": "Lightweight",
        "open weight": "Heavyweight",
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
        wc_raw = cols[6].get_text(" ", strip=True).lower().strip() if len(cols) > 6 else ""
        wc = WC_MAP.get(wc_raw, "Lightweight")
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
                    "weight_class":     f["weight_class"],
                    "is_title_fight":   f["is_title"] or is_main,
                    "scheduled_rounds": 5 if (f["is_title"] or is_main) else 3,
                },
                red_name=f["red"], blue_name=f["blue"],
            )
            r_wp = result.get("red_win_probability", 0.5)
            b_wp = result.get("blue_win_probability", 0.5)
            v = result.get("value")
            method_probs = result.get("method_probabilities") or {}
            predictions.append({
                "red_fighter":          result["red_fighter"],
                "blue_fighter":         result["blue_fighter"],
                "weight_class":         f["weight_class"],
                "is_main_event":        is_main,
                "is_title_fight":       f["is_title"],
                "winner":               result["winner"],
                "winner_confidence":    round(result["winner_confidence"] * 100, 1),
                "red_win_probability":  round(r_wp * 100, 1),
                "blue_win_probability": round(b_wp * 100, 1),
                "predicted_method":     result.get("predicted_method"),
                "method_confidence":    round((result.get("method_confidence") or 0) * 100, 1),
                "predicted_round":      result.get("predicted_round"),
                "method_probs":         {k: round(mv * 100, 1) for k, mv in method_probs.items()},
                "r_elo":                result.get("r_elo"),
                "b_elo":                result.get("b_elo"),
                "value": {
                    "r_edge":  round(v.get("r_edge", 0) * 100, 1),
                    "b_edge":  round(v.get("b_edge", 0) * 100, 1),
                    "r_kelly": round((v.get("r_kelly") or 0) * 100, 2),
                    "b_kelly": round((v.get("b_kelly") or 0) * 100, 2),
                } if v else None,
            })
        except Exception as e:
            log.warning(f"Prediction error for {f['red']} vs {f['blue']}: {e}")
            predictions.append({
                "red_fighter":   f["red"],
                "blue_fighter":  f["blue"],
                "weight_class":  f["weight_class"],
                "is_main_event": is_main,
                "error":         str(e),
            })

    # Attempt to attach live Hardrock odds to each fight
    hardrock_odds = _fetch_hardrock_odds()
    if hardrock_odds:
        _match_hardrock_to_fights(predictions, hardrock_odds)
        log.info(f"Hardrock odds matched for {sum(1 for p in predictions if p.get('hardrock_r_odds'))} / {len(predictions)} fights")

    from datetime import datetime, timezone
    return jsonify({
        "event_name":       event["name"],
        "event_date":       event["date"],
        "location":         event.get("location", ""),
        "predictions":      predictions,
        "hardrock_live":    bool(hardrock_odds),
        "odds_timestamp":   datetime.now(timezone.utc).isoformat(),
    })


@app.get("/hardrock-odds")
def hardrock_odds_endpoint():
    """
    Lightweight polling endpoint — returns current Hardrock UFC odds.
    The frontend calls this every 5 minutes to refresh odds without
    re-running the full model prediction pipeline.

    Response:
    {
        "odds": [ { home, away, home_odds, away_odds, last_update }, ... ],
        "timestamp": "ISO 8601",
        "live": true/false
    }
    """
    from datetime import datetime, timezone
    odds = _fetch_hardrock_odds()
    return jsonify({
        "odds":      odds,
        "live":      bool(odds),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.get("/weight_classes")
def get_weight_classes():
    return jsonify({"weight_classes": WEIGHT_CLASSES})


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    log.info(f"Starting UFC Prediction API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
