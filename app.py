import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import gradio as gr
from fastapi import FastAPI
import os

# ----------------------------------------
# ALL SUPPORTED COUNTRIES (13 total)
# ----------------------------------------
COUNTRIES = [
    "Australia", "Canada", "France", "Germany", "Ireland",
    "Netherlands", "New Zealand", "Singapore", "Sweden",
    "Switzerland", "UAE", "UK", "USA",
]

COUNTRY_FLAGS = {
    "Australia":   "🇦🇺",
    "Canada":      "🇨🇦",
    "France":      "🇫🇷",
    "Germany":     "🇩🇪",
    "Ireland":     "🇮🇪",
    "Netherlands": "🇳🇱",
    "New Zealand": "🇳🇿",
    "Singapore":   "🇸🇬",
    "Sweden":      "🇸🇪",
    "Switzerland": "🇨🇭",
    "UAE":         "🇦🇪",
    "UK":          "🇬🇧",
    "USA":         "🇺🇸",
}

# ISO codes for flagcdn.com — renders real flag images on any OS
COUNTRY_ISO = {
    "Australia": "au", "Canada": "ca", "France": "fr", "Germany": "de",
    "Ireland": "ie", "Netherlands": "nl", "New Zealand": "nz", "Singapore": "sg",
    "Sweden": "se", "Switzerland": "ch", "UAE": "ae", "UK": "gb", "USA": "us",
}

def flag_img(country, h=14):
    iso = COUNTRY_ISO.get(country, "un")
    return (f"<img src='https://flagcdn.com/20x15/{iso}.png' "
            f"style='height:{h}px;border-radius:2px;"
            f"vertical-align:middle;margin-right:4px;object-fit:cover'>")

# Dropdown keeps emoji text; plain name extracted in predict fn
COUNTRIES_DISPLAY = [f"{COUNTRY_FLAGS[c]} {c}" for c in COUNTRIES]

EXAM_TYPES = ["IELTS", "TOEFL", "PTE", "DET", "GRE"]
DEGREE_LEVELS = ["Undergraduate", "Masters", "PhD"]

EXAM_LIMITS = {
    "IELTS":  (0, 9),
    "TOEFL":  (0, 120),
    "PTE":    (10, 90),
    "DET":    (10, 160),
    "GRE":    (260, 340),
}

# ----------------------------------------
# LOAD & PREPARE DATASET
# ----------------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "Admission_Predict_Final_With_Degree.csv")
data = pd.read_csv(csv_path)
data.columns = data.columns.str.strip()

# ----------------------------------------
# LOAD MODEL  (pkl → fast; fallback → train)
# ----------------------------------------
pkl_path = os.path.join(base_dir, "model.pkl")

if os.path.exists(pkl_path):
    import pickle
    with open(pkl_path, "rb") as f:
        _p = pickle.load(f)
    model, country_map, exam_map, degree_map = (
        _p["model"], _p["country_map"], _p["exam_map"], _p["degree_map"]
    )
    print("✅ Loaded model.pkl")

else:
    print("⚠️  model.pkl not found — training now (run train_model.py to pre-build)...")
    exam_columns = ["IELTS", "TOEFL", "PTE", "DET", "GRE"]
    data[exam_columns] = data[exam_columns].fillna(0)

    np.random.seed(99); n = 80
    uae_rows = pd.DataFrame({
        "Degree_Level":          np.random.choice(["Undergraduate","Masters","PhD"], n, p=[.3,.55,.15]),
        "Country_Aiming":        "UAE",
        "Exam_Type":             np.random.choice(["IELTS","TOEFL","PTE"], n, p=[.55,.35,.10]),
        "IELTS":                 np.where(np.random.choice(["IELTS","TOEFL","PTE"], n, p=[.55,.35,.10])=="IELTS",
                                          np.round(np.random.uniform(6.0, 9.0, n), 1), 0.0),
        "TOEFL":                 np.where(np.random.choice(["IELTS","TOEFL","PTE"], n, p=[.55,.35,.10])=="TOEFL",
                                          np.random.randint(80, 118, n).astype(float), 0.0),
        "PTE":                   np.where(np.random.choice(["IELTS","TOEFL","PTE"], n, p=[.55,.35,.10])=="PTE",
                                          np.random.randint(50, 88, n).astype(float), 0.0),
        "DET": 0.0, "GRE": 0.0,
        "CGPA":                  np.round(np.random.uniform(6.0, 9.8, n), 2),
        "SOP":                   np.round(np.random.uniform(1.0, 5.0, n) * 2) / 2,
        "LOR":                   np.round(np.random.uniform(1.0, 5.0, n) * 2) / 2,
        "Research":              np.random.randint(0, 2, n),
        "Work_Experience_Years": np.random.randint(0, 10, n),
        "Chance_of_Admit":       np.round(np.random.uniform(0.38, 0.88, n), 2),
    })
    data = pd.concat([data, uae_rows], ignore_index=True)

    data["Country_Aiming"]  = data["Country_Aiming"].astype("category")
    data["Country_Encoded"] = data["Country_Aiming"].cat.codes
    country_map = dict(zip(data["Country_Aiming"].cat.categories, data["Country_Aiming"].cat.codes.unique()))

    data["Exam_Type"]    = data["Exam_Type"].astype("category")
    data["Exam_Encoded"] = data["Exam_Type"].cat.codes
    exam_map = dict(zip(data["Exam_Type"].cat.categories, data["Exam_Type"].cat.codes.unique()))

    data["Degree_Level"]   = data["Degree_Level"].astype("category")
    data["Degree_Encoded"] = data["Degree_Level"].cat.codes
    degree_map = dict(zip(data["Degree_Level"].cat.categories, data["Degree_Level"].cat.codes.unique()))

    X_cols = ["Degree_Encoded","Work_Experience_Years","CGPA","SOP","LOR","Research",
              "IELTS","TOEFL","PTE","DET","GRE","Exam_Encoded","Country_Encoded"]
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(data[X_cols], data["Chance_of_Admit"])
    print("✅ Model trained successfully.")


# ----------------------------------------
# PREDICTION FUNCTION
# ----------------------------------------
def predict_admission(degree, exam_type, exam_score, work_exp,
                      cgpa, sop, lor, research, country_display,
                      internship):
    # Strip flag prefix — e.g. "🇦🇺 Australia" → "Australia"
    country = country_display.split(" ", 1)[1] if " " in country_display else country_display
    country_icon = COUNTRY_FLAGS.get(country, "")

    min_score, max_score = EXAM_LIMITS[exam_type]
    if exam_score < min_score or exam_score > max_score:
        return (
            f"<div style='padding:18px;border-radius:14px;"
            f"background:rgba(220,38,38,.15);border:1px solid rgba(220,38,38,.4);"
            f"color:#fca5a5;font-size:1rem;text-align:center'>"
            f"❌ <strong>Invalid score for {exam_type}.</strong><br>"
            f"Allowed range: {min_score} – {max_score}</div>"
        )

    ielts = toefl = pte = det = gre = 0
    if exam_type == "IELTS":   ielts = exam_score
    elif exam_type == "TOEFL": toefl = exam_score
    elif exam_type == "PTE":   pte   = exam_score
    elif exam_type == "DET":   det   = exam_score
    elif exam_type == "GRE":   gre   = exam_score

    features = [[
        degree_map[degree],
        work_exp, cgpa, sop, lor, research,
        ielts, toefl, pte, det, gre,
        exam_map[exam_type],
        country_map[country],
    ]]

    pred = model.predict(features)[0]
    pred = round(float(np.clip(pred, 0, 1)) * 100, 2)

    # ── Verdict ──────────────────────────────────────────
    if pred >= 70:
        emoji, bar_color, verdict = "🎉", "#22c55e", "Strong Admit"
    elif pred >= 45:
        emoji, bar_color, verdict = "🎯", "#f59e0b", "Moderate Chance"
    else:
        emoji, bar_color, verdict = "📉", "#ef4444", "Low Chance"

    research_label = "Yes ✅" if research == 1 else "No ❌"

    # ── Profile strength scorecard ────────────────────────
    def score_bar(label, icon, val, strong_thresh, avg_thresh, unit=""):
        if val >= strong_thresh:
            c, tag = "#22c55e", "Strong"
        elif val >= avg_thresh:
            c, tag = "#f59e0b", "Average"
        else:
            c, tag = "#ef4444", "Weak"
        pct = min(int((val / strong_thresh) * 100), 100)
        return (
            f"<div style='margin:7px 0'>"
            f"<div style='display:flex;justify-content:space-between;"
            f"font-size:0.82rem;color:#d6d3d1;margin-bottom:3px'>"
            f"<span>{icon} {label}</span>"
            f"<span style='color:{c};font-weight:700'>{val}{unit} — {tag}</span></div>"
            f"<div style='background:rgba(255,255,255,.08);border-radius:999px;height:6px'>"
            f"<div style='width:{pct}%;height:100%;background:{c};"
            f"border-radius:999px'></div></div></div>"
        )

    scorecard = (
        score_bar("CGPA",            "📊", cgpa,     8.0,  7.0) +
        score_bar("SOP Strength",    "📄", sop,      4.5,  3.0, "/5") +
        score_bar("LOR Strength",    "📋", lor,      4.5,  3.0, "/5") +
        score_bar("Work Experience", "💼", work_exp, 4,    2,   " yrs")
    )
    research_score = (
        "<div style='margin:7px 0;display:flex;justify-content:space-between;"
        "font-size:0.82rem;color:#d6d3d1'>"
        f"<span>🔬 Research Experience</span>"
        f"<span style='color:{'#22c55e' if research else '#ef4444'};font-weight:700'>"
        f"{'Yes — Strong' if research else 'No — Weak'}</span></div>"
    )
    scorecard += research_score

    # ── Actionable tips ───────────────────────────────────
    tips = []
    if cgpa < 7.0:
        tips.append("📊 <b>CGPA below 7.0</b> — Address this gap directly in your SOP; "
                    "highlight upward trends or strong final-year grades.")
    if sop < 3.0:
        tips.append("📄 <b>Weak SOP</b> — A compelling SOP can compensate for other gaps. "
                    "Focus on your 'why this program' and specific research/career goals.")
    if lor < 3.0:
        tips.append("📋 <b>Weak LOR</b> — Request LORs from professors or managers who "
                    "know your work well, not just senior titles.")
    if not research:
        tips.append("🔬 <b>No research experience</b> — Even a short research assistantship "
                    "or published paper significantly boosts Masters admits at top schools.")
    if work_exp == 0 and not internship:
        tips.append("💼 <b>No work/internship experience</b> — Even short internships, "
                    "projects, or co-ops significantly strengthen professional Masters applications.")
    if work_exp == 0 and internship:
        tips.append("💼 <b>Good — internship/project counted</b>. Full-time experience further "
                    "strengthens your application for competitive programs.")
    if work_exp > 0 and cgpa >= 8.0 and research:
        tips.append("✨ <b>Strong overall profile</b> — Consider applying to reach schools "
                    "in your target country; your profile can handle competitive programs.")

    # ── Country–exam compatibility ────────────────────────
    eu_countries   = {"France", "Germany", "Netherlands", "Sweden", "Switzerland"}
    uk_countries   = {"UK", "Ireland"}
    gre_countries  = {"USA", "Canada", "Singapore", "Australia"}

    fit_warning = ""
    if exam_type == "GRE" and country in eu_countries:
        fit_warning = (
            "⚠️ <b>Heads up:</b> Most <b>EU universities</b> (France, Germany, Netherlands, "
            "Sweden, Switzerland) do <b>not require GRE</b>. "
            "Consider adding an IELTS or TOEFL score for language proficiency."
        )
    elif exam_type in ("IELTS", "TOEFL", "PTE", "DET") and country in gre_countries:
        fit_warning = (
            f"💡 <b>Tip:</b> Many top programs in <b>{country}</b> for Masters "
            f"expect a <b>GRE score</b> alongside a language test. "
            f"Check if your target programs require GRE."
        )

    # ── Build HTML ────────────────────────────────────────
    hr = "<hr style='border:none;border-top:1px solid rgba(139,92,246,.2);margin:14px 0'>"
    sec = ("<div style='color:#fcd34d;font-weight:700;font-size:0.8rem;"
           "letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px'>")

    details_html = (
        "<div style='display:grid;grid-template-columns:1fr 1fr;"
        "gap:6px 24px;margin:10px 0 0;font-size:0.85rem;color:#d6d3d1'>"
        f"<span>🎓 <b style='color:#fcd34d'>Degree</b></span><span>{degree}</span>"
        f"<span>🌍 <b style='color:#fcd34d'>Country</b></span>"
        f"<span>{flag_img(country)}{country}</span>"
        f"<span>📝 <b style='color:#fcd34d'>Exam</b></span><span>{exam_type} — {exam_score}</span>"
        f"<span>📊 <b style='color:#fcd34d'>CGPA</b></span><span>{cgpa}</span>"
        f"<span>📄 <b style='color:#fcd34d'>SOP</b></span><span>{sop}/5</span>"
        f"<span>📋 <b style='color:#fcd34d'>LOR</b></span><span>{lor}/5</span>"
        f"<span>🔬 <b style='color:#fcd34d'>Research</b></span><span>{research_label}</span>"
        f"<span>💼 <b style='color:#fcd34d'>Work Exp</b></span><span>{work_exp} yr(s)</span>"
        "</div>"
    )

    tips_html = ""
    if tips:
        tips_html = (
            hr + sec + "💡 Improvement Tips</div>"
            "<ul style='margin:6px 0 0 4px;padding-left:16px;"
            "color:#d6d3d1;font-size:0.85rem;line-height:1.7'>"
            + "".join(f"<li>{t}</li>" for t in tips) +
            "</ul>"
        )

    fit_html = ""
    if fit_warning:
        fit_html = (
            hr +
            f"<div style='background:rgba(251,191,36,.08);"
            f"border:1px solid rgba(251,191,36,.3);"
            f"border-radius:10px;padding:10px 14px;"
            f"font-size:0.85rem;color:#fde68a'>{fit_warning}</div>"
        )

    html = (
        "<div style='"
        "background:linear-gradient(135deg,rgba(109,40,217,.22),rgba(79,70,229,.18));"
        "border:1.5px solid rgba(139,92,246,.55);"
        "border-radius:18px;padding:24px 28px;"
        "box-shadow:0 0 32px rgba(109,40,217,.3);"
        "font-family:Inter,sans-serif'>"

        # Big result
        "<div style='text-align:center'>"
        f"<div style='font-size:3.2rem;font-weight:800;line-height:1;"
        f"display:flex;justify-content:center;align-items:center;gap:12px'>"
        f"<span style='-webkit-text-fill-color:initial;-webkit-background-clip:initial'>{emoji}</span>"
        f"<span style='background:linear-gradient(90deg,#a78bfa,#818cf8);"
        f"-webkit-background-clip:text;-webkit-text-fill-color:transparent'>{pred}%</span></div>"
        f"<div style='color:{bar_color};font-weight:700;"
        f"font-size:1.1rem;margin-top:6px'>{verdict}</div>"
        "</div>"

        # Progress bar
        f"<div style='margin:16px 0 4px;background:rgba(255,255,255,.08);"
        f"border-radius:999px;height:10px;overflow:hidden'>"
        f"<div style='width:{pred}%;height:100%;"
        f"background:linear-gradient(90deg,{bar_color},{bar_color}99);"
        f"border-radius:999px'></div></div>"
        f"<div style='display:flex;justify-content:space-between;"
        f"font-size:0.75rem;color:#a8a29e;margin-bottom:4px'>"
        f"<span>0%</span><span>50% Moderate</span><span>70% Strong</span></div>"

        # Profile summary
        + hr + sec + "📋 Your Profile</div>" + details_html

        # Scorecard
        + hr + sec + "📈 Profile Strength</div>" + scorecard

        # Tips
        + tips_html

        # Country fit
        + fit_html

        + "</div>"
    )
    return html


# ----------------------------------------
# DARK CUSTOM CSS
# ----------------------------------------
DARK_CSS = """
/* ── Noto Color Emoji — fixes flag emoji on Windows ─── */
@import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');

/* ── Global background ─────────────────────────────── */
body, .gradio-container {
    background: linear-gradient(135deg, #050505 0%, #0a0a0c 50%, #000000 100%) !important;
    min-height: 100vh;
    font-family: 'Inter', 'Noto Color Emoji', sans-serif !important;
}
/* Force emoji font on dropdown options so flags render */
select, option, li[data-value], .dropdown-item {
    font-family: 'Noto Color Emoji', 'Inter', sans-serif !important;
}

/* ── Main container card ───────────────────────────── */
.gradio-container > .main {
    background: transparent !important;
}

/* ── Column / block cards ──────────────────────────── */
.gr-block-layout, .gr-column, .gr-row > div {
    background: rgba(245, 158, 11, 0.02) !important;
    border: 1px solid rgba(245, 158, 11, 0.15) !important;
    border-radius: 16px !important;
    backdrop-filter: blur(12px);
}

/* ── Labels ────────────────────────────────────────── */
label span, .gr-form label, .label-wrap span {
    color: #fcd34d !important;
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
}

/* ── Input / select boxes ──────────────────────────── */
input, select, textarea,
.gr-input, .gr-dropdown, .gr-number,
.wrap.svelte-1aygcmn {
    background: rgba(10,10,12,0.7) !important;
    border: 1px solid rgba(245, 158, 11, 0.3) !important;
    color: #f8fafc !important;
    border-radius: 10px !important;
}
input:focus, select:focus {
    border-color: #f59e0b !important;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2) !important;
}

/* ── Slider track ──────────────────────────────────── */
.gr-slider input[type=range] {
    accent-color: #f59e0b;
}

/* ── Radio buttons ─────────────────────────────────── */
.gr-radio label {
    background: rgba(245, 158, 11, 0.1) !important;
    border: 1px solid rgba(245, 158, 11, 0.25) !important;
    border-radius: 8px !important;
    color: #fde68a !important;
    padding: 4px 14px !important;
}
.gr-radio label.selected, .gr-radio label:has(input:checked) {
    background: rgba(245, 158, 11, 0.35) !important;
    border-color: #f59e0b !important;
    color: #fef3c7 !important;
}

/* ── Predict button ────────────────────────────────── */
.gr-button-primary, button.primary {
    background: linear-gradient(90deg, #d97706, #b45309) !important;
    border: none !important;
    color: #fef3c7 !important;
    font-size: 1.05rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.04em !important;
    border-radius: 12px !important;
    padding: 14px 32px !important;
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3) !important;
    transition: all 0.25s ease !important;
}
.gr-button-primary:hover, button.primary:hover {
    background: linear-gradient(90deg, #f59e0b, #d97706) !important;
    box-shadow: 0 6px 28px rgba(245, 158, 11, 0.5) !important;
    transform: translateY(-2px) !important;
}

/* ── Result output box ─────────────────────────────── */
.gr-markdown {
    background: rgba(245, 158, 11, 0.05) !important;
    border: 1px solid rgba(245, 158, 11, 0.2) !important;
    border-radius: 14px !important;
    padding: 16px 20px !important;
    color: #f8fafc !important;
    font-size: 1.1rem !important;
}

/* ── Scrollbar ─────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #050505; }
::-webkit-scrollbar-thumb { background: #d97706; border-radius: 4px; }
"""

# ----------------------------------------
# GRADIO UI  — dark, no #fef3c7, premium look
# ----------------------------------------
DARK_THEME = gr.themes.Base(
    primary_hue="amber",
    secondary_hue="orange",
    neutral_hue="slate",
    font=gr.themes.GoogleFont("Inter"),
).set(
    # Core backgrounds — all dark
    body_background_fill="linear-gradient(135deg,#050505,#0a0a0c,#000000)",
    background_fill_primary="#09090b",
    background_fill_secondary="#000000",
    block_background_fill="rgba(245, 158, 11, 0.02)",
    block_border_color="rgba(245, 158, 11, 0.15)",
    # Text colours
    body_text_color="#f8fafc",
    block_title_text_color="#fcd34d",
    block_label_text_color="#fcd34d",
    # Input colours
    input_background_fill="rgba(10,10,12,0.7)",
    input_border_color="rgba(245, 158, 11, 0.3)",
    input_border_color_focus="#f59e0b",
    # Button colours
    button_primary_background_fill="linear-gradient(90deg,#d97706,#b45309)",
    button_primary_background_fill_hover="linear-gradient(90deg,#f59e0b,#d97706)",
    button_primary_text_color="#fef3c7fff",
    # Slider
    slider_color="#f59e0b",
)

with gr.Blocks() as demo:

    gr.Markdown(
        """
        <div style='text-align:center;padding:28px 0 14px;
                    background:linear-gradient(90deg,rgba(245, 158, 11,.10),rgba(217, 119, 6,.10));
                    border-radius:18px;margin-bottom:8px;
                    border:1px solid rgba(245, 158, 11,.2)'>
          <h1 style='font-size:2.4rem;margin:0;
                     background:linear-gradient(90deg,#fcd34d,#fbbf24);
                     -webkit-background-clip:text;-webkit-text-fill-color:transparent'>
            🎓 Global Admission Predictor
          </h1>
          <p style='color:#d6d3d1;margin:10px 0 0;font-size:1rem'>
            AI-powered admission probability across
            <strong style='color:#fcd34d'>12 countries</strong> ·
            Random Forest · 1,000+ real records
          </p>
        </div>
        """
    )

    with gr.Row(equal_height=True):

        # ── Left: Academic profile ──────────────────────
        with gr.Column(scale=1):
            gr.Markdown(
                "<h3 style='color:#fcd34d;margin:4px 0 12px'>🏫 Academic Profile</h3>"
            )
            degree   = gr.Dropdown(DEGREE_LEVELS, value="Masters",
                                   label="Degree Level")
            cgpa     = gr.Slider(6.0, 10.0, step=0.1, value=8.0,
                                  label="CGPA  (6.0 – 10.0)")
            sop      = gr.Slider(1.0, 5.0, step=0.5, value=3.0,
                                  label="SOP Strength  (1 = Weak · 5 = Exceptional)")
            lor      = gr.Slider(1.0, 5.0, step=0.5, value=3.0,
                                  label="LOR Strength  (1 = Weak · 5 = Exceptional)")
            research = gr.Radio(
                [0, 1], value=0,
                label="Research Experience",
                info="0 = No  ·  1 = Yes",
            )
            work_exp = gr.Slider(0, 10, step=1, value=2,
                                  label="Work Experience (Years)")
            internship = gr.Radio(
                [False, True], value=False,
                label="💼 Internship / Project Experience",
                info="Have you done any internship or academic project?",
            )

        # ── Right: Destination & exam ───────────────────
        with gr.Column(scale=1):
            gr.Markdown(
                "<h3 style='color:#fcd34d;margin:4px 0 12px'>🌍 Destination & Exam</h3>"
            )
            country = gr.Dropdown(
                COUNTRIES_DISPLAY,
                value=COUNTRIES_DISPLAY[0],
                label="Target Country  (13 supported)",
            )
            gr.HTML("<div style='height:14px'></div>")
            exam_type = gr.Dropdown(
                EXAM_TYPES, value="IELTS",
                label="Exam Type",
            )
            gr.HTML("<div style='height:14px'></div>")
            exam_score = gr.Number(
                value=7.0,
                label="Exam Score",
                info="IELTS 0-9 · TOEFL 0-120 · PTE 10-90 · DET 10-160 · GRE 260-340",
            )

    gr.HTML("<div style='height:20px'></div>")

    btn = gr.Button(
        "🔮  Predict My Admission Chances",
        variant="primary",
        size="lg",
    )

    gr.HTML("<div style='height:10px'></div>")

    output = gr.HTML(
        value=(
            "<div style='text-align:center;color:#475569;font-size:1rem;"
            "padding:20px;border:1px dashed rgba(245, 158, 11,.3);"
            "border-radius:14px'>"
            "Fill in your profile above and click "
            "<strong style='color:#fcd34d'>Predict ✨</strong></div>"
        ),
    )

    _chips = " ".join(
        f"<span style='display:inline-block;margin:3px 4px;"
        f"padding:4px 13px;border-radius:999px;"
        f"background:rgba(245, 158, 11,.10);"
        f"border:1px solid rgba(245, 158, 11,.3);"
        f"color:#fcd34d;font-size:0.8rem;font-weight:600'>"
        f"{flag_img(c)}{c}</span>"
        for c in COUNTRIES
    )
    gr.HTML(
        "<div style='text-align:center;margin-top:18px'>"
        "<div style='color:#6b7280;font-size:0.75rem;"
        "margin-bottom:8px;letter-spacing:.05em;text-transform:uppercase'>"
        "🌍 Supported Countries</div>"
        + _chips +
        "</div>"
    )

    btn.click(
        fn=predict_admission,
        inputs=[degree, exam_type, exam_score, work_exp,
                cgpa, sop, lor, research, country, internship],
        outputs=output,
    )

# ----------------------------------------
# VERCEL: mount Gradio inside FastAPI
# ----------------------------------------
fast_app = FastAPI()
app = gr.mount_gradio_app(fast_app, demo, path="/")

if __name__ == "__main__":
    demo.launch(share=True) 
