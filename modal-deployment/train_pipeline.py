"""
Step-by-step training pipeline entrypoint for Student Flatmate Compatibility Prediction Using Structured and Textual Profile Features.

Usage example:
python train_pipeline.py --csv training_data.csv --seed 42
"""

import argparse
import json
import os
from datetime import datetime

from model import run_step_by_step_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Run step-by-step student flatmate compatibility prediction pipeline")
    parser.add_argument("--csv", default="training_data.csv", help="Path to training CSV")
    parser.add_argument("--model-out", default="artifacts/roommate_matcher.pkl", help="Path to output model file")
    parser.add_argument("--report-out", default="artifacts/pipeline_report.json", help="Path to output report JSON")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    report = run_step_by_step_pipeline(
        csv_path=args.csv,
        model_output_path=args.model_out,
        report_output_path=args.report_out,
        test_size=args.test_size,
        random_seed=args.seed,
    )

    print("=" * 72)
    print("STUDENT FLATMATE COMPATIBILITY PREDICTION PIPELINE FINISHED")
    print("=" * 72)
    print(f"Time: {datetime.utcnow().isoformat()}Z")
    print(f"Used samples: {report['dataset']['used_samples']}")
    print(f"Features: {report['dataset']['feature_count']}")
    print(f"Train R2: {report['metrics']['train_r2']:.4f}")
    print(f"Test R2: {report['metrics']['test_r2']:.4f}")
    print(f"Test MAE: {report['metrics']['test_mae']:.4f}")
    print(f"Test RMSE: {report['metrics']['test_rmse']:.4f}")
    print(f"Overfitting gap: {report['metrics']['overfitting_gap']:.4f}")
    print(f"Report path: {os.path.abspath(args.report_out)}")
    print(f"Model path: {os.path.abspath(args.model_out)}")

    # Save a single-line validation log to simplify form copy/paste.
    final_log_path = os.path.join(os.path.dirname(args.report_out) or ".", "final_validation_log.txt")
    with open(final_log_path, "w", encoding="utf-8") as f:
        f.write(
            "test_r2={:.6f}, test_mae={:.6f}, test_rmse={:.6f}, checkpoint={}\n".format(
                report["metrics"]["test_r2"],
                report["metrics"]["test_mae"],
                report["metrics"]["test_rmse"],
                os.path.abspath(args.model_out),
            )
        )
    print(f"Validation log line: {os.path.abspath(final_log_path)}")


if __name__ == "__main__":
    main()
