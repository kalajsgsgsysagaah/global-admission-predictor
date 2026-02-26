"""
Vercel Python serverless function — /api/predict
POST body (JSON):
  { degree, exam_type, exam_score, work_exp, cgpa, sop, lor, research, country }
Response (JSON):
  { prediction, verdict, bar_color, scorecard, tips, fit_warning }
"""

import json
import os
import pickle
import numpy as np
from http.server import BaseHTTPRequestHandler

# ── Load model once (module-level = cached between warm invocations) ──
_base = os.path.dirname(os.path.abspath(__file__))
_pkl  = os.path.join(_base, "..", "model.pkl")

with open(_pkl, "rb") as f:
    _p = pickle.load(f)

MODEL       = _p["model"]
COUNTRY_MAP = _p["country_map"]
EXAM_MAP    = _p["exam_map"]
DEGREE_MAP  = _p["degree_map"]

EXAM_LIMITS = {
    "IELTS": (0, 9), "TOEFL": (0, 120),
    "PTE": (10, 90), "DET": (10, 160), "GRE": (260, 340)
}

EU_COUNTRIES  = {"France", "Germany", "Netherlands", "Sweden", "Switzerland"}
GRE_COUNTRIES = {"USA", "Canada", "Singapore", "Australia"}


def _predict(body):
    degree     = body["degree"]
    exam_type  = body["exam_type"]
    exam_score = float(body["exam_score"])
    work_exp   = int(body["work_exp"])
    cgpa       = float(body["cgpa"])
    sop        = float(body["sop"])
    lor        = float(body["lor"])
    research   = int(body["research"])
    country    = body["country"]

    # Validate exam score
    lo, hi = EXAM_LIMITS[exam_type]
    if not (lo <= exam_score <= hi):
        return {"error": f"Invalid {exam_type} score. Allowed: {lo}–{hi}"}

    ielts = toefl = pte = det = gre = 0.0
    if exam_type == "IELTS":   ielts = exam_score
    elif exam_type == "TOEFL": toefl = exam_score
    elif exam_type == "PTE":   pte   = exam_score
    elif exam_type == "DET":   det   = exam_score
    elif exam_type == "GRE":   gre   = exam_score

    features = [[
        DEGREE_MAP[degree], work_exp, cgpa, sop, lor, research,
        ielts, toefl, pte, det, gre,
        EXAM_MAP[exam_type], COUNTRY_MAP[country],
    ]]

    pred = float(np.clip(MODEL.predict(features)[0], 0, 1)) * 100
    pred = round(pred, 2)

    if pred >= 70:
        verdict, bar_color = "Strong Admit", "#22c55e"
    elif pred >= 45:
        verdict, bar_color = "Moderate Chance", "#f59e0b"
    else:
        verdict, bar_color = "Low Chance", "#ef4444"

    # Scorecard
    def rate(val, strong, avg):
        if val >= strong: return "Strong"
        if val >= avg:    return "Average"
        return "Weak"

    internship = bool(body.get("internship", False))

    scorecard = {
        "CGPA":       {"value": cgpa,       "rating": rate(cgpa,     8.0, 7.0)},
        "SOP":        {"value": sop,        "rating": rate(sop,      4.5, 3.0)},
        "LOR":        {"value": lor,        "rating": rate(lor,      4.5, 3.0)},
        "Work Exp":   {"value": work_exp,   "rating": rate(work_exp, 4,   2)},
        "Research":   {"value": research,   "rating": "Strong" if research else "Weak"},
        "Internship": {"value": internship, "rating": "Strong" if internship else "Weak"},
    }

    # Tips
    tips = []
    if cgpa < 7.0:
        tips.append("CGPA below 7.0 — address the gap in your SOP; highlight strong final-year grades.")
    if sop < 3.0:
        tips.append("Weak SOP — focus on 'why this program', specific goals, and unique value you bring.")
    if lor < 3.0:
        tips.append("Weak LOR — choose recommenders who know your work well, not just senior titles.")
    if not research:
        tips.append("No research — a short assistantship or paper significantly boosts top-school admits.")
    if work_exp == 0 and not internship:
        tips.append("No work/internship experience — even short internships or projects strengthen Masters applications.")
    if work_exp == 0 and internship:
        tips.append("Good — internship/project counted. Full-time experience further strengthens competitive programs.")
    if work_exp > 0 and cgpa >= 8.0 and research:
        tips.append("Strong profile — consider applying to reach/top-ranked schools in your target country.")

    # Country–exam fit
    fit_warning = ""
    if exam_type == "GRE" and country in EU_COUNTRIES:
        fit_warning = f"Most EU universities don't require GRE. Consider adding IELTS/TOEFL for {country}."
    elif exam_type in ("IELTS","TOEFL","PTE","DET") and country in GRE_COUNTRIES:
        fit_warning = f"Many top programs in {country} expect GRE alongside a language test. Check requirements."

    return {
        "prediction": pred,
        "verdict":    verdict,
        "bar_color":  bar_color,
        "scorecard":  scorecard,
        "tips":       tips,
        "fit_warning": fit_warning,
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = json.loads(self.rfile.read(length))
        result = _predict(body)
        self._json(200, result)

    def do_OPTIONS(self):
        self._json(200, {})

    def _json(self, status, data):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type",  "application/json")
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *_):
        pass  # suppress default access logs
