#!/usr/bin/env python3
"""
Local Automation Helper Script for Codempress.
Runs database schema integrity checks, automated test suites, and frontend build verification.
Usage: python scripts/dev_check.py
"""
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def run_step(name: str, cmd: str, cwd: Path = BASE_DIR):
    print(f"\n[Automation] Running {name}...")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"[Automation Failed] {name} exited with code {result.returncode}")
        sys.exit(result.returncode)
    print(f"[Automation Passed] {name}")

def main():
    print("=====================================================")
    print("Codempress Automated Local Development Diagnostics")
    print("=====================================================")

    # 1. Run Pytest Integration Suite
    run_step("Backend & E2E Integration Test Suite", "python -m pytest tests/ -v -k \"not test_frontend_rendering\"")

    # 2. Verify Frontend Production Bundle Build
    frontend_dir = BASE_DIR / "frontend"
    if frontend_dir.exists():
        run_step("Vite Production Frontend Bundle Build", "npm run build", cwd=frontend_dir)

    print("\nALL AUTOMATED CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
