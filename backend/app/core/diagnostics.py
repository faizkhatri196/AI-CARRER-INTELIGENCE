import os
import sys
import platform
import time
from typing import Dict, Any

def get_system_diagnostics(db_instance: Any = None) -> Dict[str, Any]:
    """
    Returns runtime diagnostics for observability, cloud health checks,
    and platform environment auditing.
    """
    db_mode = "unknown"
    if db_instance is not None:
        db_mode = "local_resilient" if getattr(db_instance, "use_local", True) else "mongodb_live"

    return {
        "status": "healthy",
        "timestamp": time.time(),
        "runtime": {
            "python_version": platform.python_version(),
            "os": platform.system(),
            "architecture": platform.machine(),
            "process_id": os.getpid()
        },
        "database": {
            "mode": db_mode,
            "configured": bool(os.environ.get("MONGO_URI"))
        },
        "features": {
            "groq_configured": bool(os.environ.get("GROQ_API_KEY")),
            "fair_screening_enabled": True,
            "ml_scoring_dimensions": 8,
            "max_batch_upload": 250
        }
    }

