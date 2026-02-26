# 🎓 Global Admission Predictor

A machine learning web app that predicts your chance of getting admitted to universities in **12 countries**, powered by a Random Forest model trained on 1,000+ real admission records.

**Supported Countries:** Australia, Canada, France, Germany, Ireland, Netherlands, New Zealand, Singapore, Sweden, Switzerland, UK, USA

**Supported Exams:** IELTS, TOEFL, PTE, DET, GRE

---

## 🗂️ Project Structure

```
predict/
├── app.py                                    # Vercel entrypoint (Gradio + FastAPI)
├── admission_abroad_predictor (1).py         # Original model script (Gradio standalone)
├── Admission_Predict_Final_With_Degree.csv   # Dataset (1001 rows, 12 countries)
├── requirements.txt          
                # Python dependencies
├── vercel.json                               # Vercel deployment config
└── .gitignore
```

---

## 🚀 Deploy to Vercel

### Prerequisites
- [Vercel account](https://vercel.com) (free)
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- Git (recommended)

### Steps

**Option A — Via Vercel CLI (recommended)**

```bash
# In the project folder
cd "C:\Users\Gaurav Kalyan\OneDrive\Desktop\predict"

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# For production deploy
vercel --prod
```

**Option B — Via GitHub + Vercel Dashboard**

1. Push this folder to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Vercel auto-detects `vercel.json` and deploys

---

## 💻 Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run with Gradio directly (original script)
python "admission_abroad_predictor (1).py"

# — OR — Run with uvicorn (Vercel-style app.py)
uvicorn app:app --reload --port 7860
# Then open http://localhost:7860
```

---

## 🧠 Model Details

| Feature | Description |
|---|---|
| Algorithm | Random Forest Regressor (200 trees) |
| Target | `Chance_of_Admit` (0–1 → displayed as %) |
| Training set | 1,001 records |
| Features | Degree, CGPA, SOP, LOR, Research, Work Exp, Exam score, Country |

---

## 📋 Input Fields

| Field | Range / Options |
|---|---|
| Degree Level | Undergraduate, Masters, PhD |
| Target Country | 12 countries (see above) |
| Exam Type | IELTS (0–9), TOEFL (0–120), PTE (10–90), DET (10–160), GRE (260–340) |
| CGPA | 6.0 – 10.0 |
| SOP Strength | 1.0 – 5.0 |
| LOR Strength | 1.0 – 5.0 |
| Research | 0 (No) or 1 (Yes) |
| Work Experience | 0 – 10 years |
