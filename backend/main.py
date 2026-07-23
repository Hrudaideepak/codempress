import sys
import logging
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("codempress.main")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Codempress FastAPI Backend facade on http://localhost:8008")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8008, reload=True, reload_dirs=["backend"])
