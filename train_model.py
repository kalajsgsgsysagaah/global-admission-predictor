"""
train_model.py
──────────────
Run this ONCE to train the model and save everything needed for inference.
Output: model.pkl  (includes model + all category maps)

Usage:
    python train_model.py
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

# ----------------------------------------
# LOAD & PREPARE DATASET
# ----------------------------------------
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "Admission_Predict_Final_With_Degree.csv")

data = pd.read_csv(csv_path)
data.columns = data.columns.str.strip()

if "Program_Competitiveness" in data.columns:
    data = data.drop(columns=["Program_Competitiveness"])

exam_columns = ["IELTS", "TOEFL", "PTE", "DET", "GRE"]
data[exam_columns] = data[exam_columns].fillna(0)

# ── Inject synthetic UAE rows ──────────────────────────
np.random.seed(99)
n = 80
uae_rows = pd.DataFrame({
    "Degree_Level":          np.random.choice(["Undergraduate", "Masters", "PhD"], n, p=[.3, .55, .15]),
    "Country_Aiming":        "UAE",
    "Exam_Type":             np.random.choice(["IELTS", "TOEFL", "PTE"], n, p=[.55, .35, .10]),
    "IELTS":                 np.where(np.random.choice(["IELTS", "TOEFL", "PTE"], n, p=[.55, .35, .10]) == "IELTS",
                                      np.round(np.random.uniform(6.0, 9.0, n), 1), 0.0),
    "TOEFL":                 np.where(np.random.choice(["IELTS", "TOEFL", "PTE"], n, p=[.55, .35, .10]) == "TOEFL",
                                      np.random.randint(80, 118, n).astype(float), 0.0),
    "PTE":                   np.where(np.random.choice(["IELTS", "TOEFL", "PTE"], n, p=[.55, .35, .10]) == "PTE",
                                      np.random.randint(50, 88, n).astype(float), 0.0),
    "DET":                   0.0,
    "GRE":                   0.0,
    "CGPA":                  np.round(np.random.uniform(6.0, 9.8, n), 2),
    "SOP":                   np.round(np.random.uniform(1.0, 5.0, n) * 2) / 2,
    "LOR":                   np.round(np.random.uniform(1.0, 5.0, n) * 2) / 2,
    "Research":              np.random.randint(0, 2, n),
    "Work_Experience_Years": np.random.randint(0, 10, n),
    "Chance_of_Admit":       np.round(np.random.uniform(0.38, 0.88, n), 2),
})
data = pd.concat([data, uae_rows], ignore_index=True)

# ── Encode categoricals ────────────────────────────────
data["Country_Aiming"]  = data["Country_Aiming"].astype("category")
data["Country_Encoded"] = data["Country_Aiming"].cat.codes
country_map = dict(zip(data["Country_Aiming"].cat.categories,
                       data["Country_Aiming"].cat.codes.unique()))

data["Exam_Type"]    = data["Exam_Type"].astype("category")
data["Exam_Encoded"] = data["Exam_Type"].cat.codes
exam_map = dict(zip(data["Exam_Type"].cat.categories,
                    data["Exam_Type"].cat.codes.unique()))

data["Degree_Level"]   = data["Degree_Level"].astype("category")
data["Degree_Encoded"] = data["Degree_Level"].cat.codes
degree_map = dict(zip(data["Degree_Level"].cat.categories,
                      data["Degree_Level"].cat.codes.unique()))

# ── Features & target ──────────────────────────────────
X_cols = [
    "Degree_Encoded", "Work_Experience_Years", "CGPA",
    "SOP", "LOR", "Research",
    "IELTS", "TOEFL", "PTE", "DET", "GRE",
    "Exam_Encoded", "Country_Encoded",
]
X = data[X_cols]
y = data["Chance_of_Admit"]

# ── Train ──────────────────────────────────────────────
print("Training Random Forest (200 trees)...")
model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)

scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print(f"  Cross-val R² : {scores.mean():.4f}  (±{scores.std():.4f})")

model.fit(X, y)
print("  Training complete.")

# ── Save everything to one pkl ─────────────────────────
payload = {
    "model":      model,
    "country_map": country_map,
    "exam_map":    exam_map,
    "degree_map":  degree_map,
}

pkl_path = os.path.join(base_dir, "model.pkl")
with open(pkl_path, "wb") as f:
    pickle.dump(payload, f)

print(f"\n✅ Saved → {pkl_path}")
print(f"   Countries : {sorted(country_map.keys())}")
print(f"   Exams     : {sorted(exam_map.keys())}")
print(f"   Degrees   : {sorted(degree_map.keys())}")
