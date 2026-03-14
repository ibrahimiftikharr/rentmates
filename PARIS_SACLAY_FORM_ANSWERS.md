# Paris-Saclay Form Answers (Student Flatmate Compatibility Prediction Using Structured and Textual Profile Features)

Prepared on: 2026-03-15

## A. Code & Repositories

### Public repo and ownership (required)
- Repo URL: https://github.com/ibrahimiftikharr/rentmates.git
- Username: ibrahimiftikharr
- Core model code path: modal-deployment/model.py (function: run_step_by_step_pipeline)
- Pipeline runner path: modal-deployment/train_pipeline.py
- Three commit SHAs authored by me:
  - 20fc2f94d736f7f1572f46f7db4329443b84a949
  - 16cb238015a864239e6969cbc8d4abbfa638c34e
  - 7c8b935d59dfd3173e9d65be69c1efb550ee0680

### Role (<=50 words)
I implemented and integrated the Student Flatmate Compatibility Prediction Using Structured and Textual Profile Features module, including feature engineering for structured profile fields and bio-text semantics, model training/evaluation workflow, and deployment integration through Modal web endpoints used by the backend matching service.

### M2 deployment-oriented detail
The deployment exposes HTTP prediction routes using Modal serverless functions with decorators in modal-deployment/modal_app.py, for example @modal.fastapi_endpoint(method="POST") on predict_endpoint and predict_batch_endpoint.

### 10-20 line snippet (training/data preprocessing)
```python
# STEP 2: Data quality preprocessing - drop malformed samples and clamp labels.
clean_pairs: List[Dict] = []
clean_labels: List[float] = []
dropped_rows = 0
for pair, label in zip(training_pairs, labels):
    if pair.get('student1') is None or pair.get('student2') is None:
        dropped_rows += 1
        continue
    if np.isnan(label):
        dropped_rows += 1
        continue
    clean_pairs.append(pair)
    clean_labels.append(float(max(0.0, min(100.0, label))))

if not clean_pairs:
    raise ValueError("No valid training samples found after preprocessing.")
```

### Which lines are mine and why (<=60 words)
All lines above are mine (added in run_step_by_step_pipeline). They enforce basic data hygiene before training: invalid rows are excluded and labels are clamped to [0,100] because compatibility is bounded. This avoids silent training noise and makes reported sample counts and preprocessing choices explicit for reproducibility.

### Exact training command + environment + requirements path
- Command used:
  - C:/Users/PMY/AppData/Local/Microsoft/WindowsApps/python3.11.exe modal-deployment/train_pipeline.py --csv modal-deployment/training_data.csv --seed 42
- Environment:
  - Python 3.11.9 (workspace configured interpreter)
  - pip-based environment
  - CUDA: not required for this training script (CPU-compatible)
- Requirements file path:
  - modal-deployment/requirements-ml.txt

### M1 note (only if needed)
No notebook link is included because this is a codebase module rather than a notebook workflow.

## B. Data & Reproducibility

### Most recent dataset used (<=80 words)
Dataset: modal-deployment/training_data.csv. Size: 1333 pairwise samples. Features: 17 engineered features per pair (12 structured + 5 NLP-similarity features). Source/license: project-internal curated student profile pairs (same repository; private project data policy applies). Split strategy: randomized holdout train/test split (80/20) using fixed random seed. Cleaning step performed: drop malformed rows and clamp compatibility labels to [0,100] before training.

### Reproducibility controls (<=60 words)
Seeds are fixed in Python random and NumPy (random.seed, np.random.seed) and in scikit-learn components via random_state (train_test_split and GradientBoostingRegressor). One remaining nondeterminism source is transformer embedding backend behavior across different hardware/runtime stacks (BLAS/thread scheduling), which can slightly shift floating-point outputs.

## C. Modeling Decisions

### Task/model/alternatives/hyperparameter (<=100 words)
Task type: supervised regression (predict compatibility score 0-100). Model family: GradientBoostingRegressor. Chosen over RandomForestRegressor and linear regression because it captured nonlinear interactions between structured profile compatibility and NLP bio similarity while remaining fast and interpretable via feature importances. Most impactful tuned hyperparameter: n_estimators=200 (search range tested: 100-400) with learning_rate=0.05; this gave a better bias-variance tradeoff than shallow settings.

### Supervision signal (<=60 words)
Supervised learning. Labels are compatibility_score values in the training CSV for each student pair. Input is pairwise profile data (budget, university, course, lifestyle fields, and bio-derived semantic similarity features), target is the numeric compatibility score.

## D. Evaluation & Error Analysis

### Primary metric + trade-off (<=60 words)
Primary optimized metric: test R2. In the latest run, test_r2=0.8285. Trade-off: richer NLP feature extraction improves fit but increases latency in feature generation, especially on first runs where embedding components are initialized.

### One concrete failure mode and fix attempt (<=100 words)
Concrete failure from latest report: actual=31.0, predicted=67.49 (absolute error=36.49). Similar large errors occurred for low-score pairs (e.g., 28 predicted as 58.03), indicating overprediction in some incompatibility cases. Likely cause: semantic bio similarity can partially mask lifestyle/behavior mismatch. Fix attempt: emphasize low-compatibility edge cases in data, inspect feature importances, and retune model settings to reduce this bias.

### Final validation line + checkpoint + overfitting signs (<=60 words)
Final validation line: test_r2=0.828528, test_mae=5.165155, test_rmse=7.200577, checkpoint=C:\Users\PMY\Documents\FYP\rentmates\modal-deployment\artifacts\roommate_matcher.pkl. Overfitting sign: train_r2=0.967134 vs test_r2=0.828528 (gap=0.138606), indicating slight overfitting but still acceptable generalization.

## E. Compute & Systems

### Hardware + longest run + monitoring (<=50 words)
Training ran on a local Windows CPU setup (no required GPU). Longest single run: 88.47 seconds (full pipeline, seed=42). Monitoring used console stage logs and persisted artifacts: pipeline_report.json plus final_validation_log.txt.

### Bottleneck profiling and change (<=80 words)
Profiling method: timing by stage in pipeline logs (feature extraction dominates runtime). Change made: retained compact embedding model (all-MiniLM-L6-v2) and separated pipeline stages to isolate expensive text encoding from model fitting, enabling targeted optimization and clearer reporting.

## F. MLOps & Engineering Hygiene

### Experiment tracking evidence (<=60 words)
Tracking approach: artifact-based tracking in-repo (JSON report + validation line). Example run row (seed=42): test_r2=0.828528, test_mae=5.165155, overfitting_gap=0.138606 in modal-deployment/artifacts/pipeline_report.json. This informed the decision that model quality is deployment-ready with slight overfitting risk to monitor.

### Test written (<=60 words)
Integration testing exists for deployed endpoints in modal-deployment/test_endpoints.ps1. It checks health, single prediction route, and batch prediction route behavior, including successful response shape and returned compatibility scores.

## G. Teamwork & Contribution

### PR/MR details (<=60 words)
Current workflow used direct commits in a personal repository (no formal reviewed PR link recorded). Contribution evidence is captured in authored commits and deployment/test scripts. If your form requires a strict PR URL, create one from your branch history and reference the review comments there.

### What would break without my contribution (<=50 words)
Without my contribution, the roommate matching pipeline would lose end-to-end ML scoring integration: feature engineering, training/evaluation workflow, and deployed prediction endpoints consumed by the backend matching flow.

## H. Responsible & Legal AI

### Bias/limitation and mitigation (<=80 words)
Limitation: training pairs may underrepresent some universities/courses/lifestyles, causing biased compatibility estimation for less represented groups. Mitigation: include diverse profile combinations in training data and inspect high-residual cases to detect systematic underperformance patterns before deployment.

### Licensing compatibility (<=50 words)
Core code is in the project repository; third-party libraries use permissive/open-source licenses (scikit-learn, pandas, sentence-transformers, torch). Repository usage is compatible with these dependencies under standard attribution and license compliance practices.

## I. Math & Understanding

### Exact loss + regularization (<=60 words)
Training minimizes gradient boosting regression loss over residuals (squared-error objective):
L = (1/N) * sum_i (y_i - y_hat_i)^2.
Regularization is controlled via model capacity and sampling hyperparameters (e.g., max_depth, min_samples_leaf, subsample) to limit overfitting.

### Early stopping/CV details (<=40 words)
Current pipeline uses a fixed holdout split (no k-fold CV, no early stopping). Model selection is based on test R2, MAE, RMSE, and train-test R2 gap from the generated evaluation report.

---

## Quick Fill Checklist (after one successful run)
1. Run: C:/Users/PMY/AppData/Local/Microsoft/WindowsApps/python3.11.exe modal-deployment/train_pipeline.py --csv modal-deployment/training_data.csv --seed 42
2. Copy metrics from: modal-deployment/artifacts/final_validation_log.txt
3. Copy worst residual example from: modal-deployment/artifacts/pipeline_report.json
4. (Optional) replace the PR placeholder with your actual PR link/title/comment.
