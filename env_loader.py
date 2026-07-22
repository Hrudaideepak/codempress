import os
from pathlib import Path
from dotenv import load_dotenv

# Load local .env
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

def get_api_key(provider_env_var: str) -> str:
    """
    Retrieves the API key for a given provider.
    Priority:
    1. Active process environment variable
    2. Local .env file
    3. Windows User-level Environment Variable (for GITHUB_TOKEN)
    """
    val = os.environ.get(provider_env_var)
    if val:
        return val
    
    # Check Windows User Environment Variable fallback if applicable
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Environment', 0, winreg.KEY_READ)
        val, _ = winreg.QueryValueEx(key, provider_env_var)
        winreg.CloseKey(key)
        return val
    except Exception:
        pass

    return ""
