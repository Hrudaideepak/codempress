import sys
import types
import logging
from pathlib import Path

# Resolve directory paths
THIS_DIR = Path(__file__).resolve().parent
PARENT_DIR = THIS_DIR.parent

# 1. Ensure current directory (backend) and parent directory are on sys.path
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))
if str(PARENT_DIR) not in sys.path:
    sys.path.insert(0, str(PARENT_DIR))

# 2. Dynamic module alias: If 'backend' is imported but the directory structure is flat (e.g. inside Docker /app)
if "backend" not in sys.modules and not (PARENT_DIR / "backend").exists():
    backend_mod = types.ModuleType("backend")
    backend_mod.__path__ = [str(THIS_DIR)]
    sys.modules["backend"] = backend_mod

from backend.app.main import app

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("codempress.main")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Codempress FastAPI Backend facade on http://0.0.0.0:8008")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8008, reload=True, reload_dirs=["backend"])
