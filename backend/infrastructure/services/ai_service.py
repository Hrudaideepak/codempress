import os
import time
import httpx
import logging
from typing import List, Dict, Any
from env_loader import get_api_key

logger = logging.getLogger("codempress.ai_engine")

class ModelSpec:
    def __init__(self, provider: str, model_id: str, endpoint: str, auth_fmt: str, env_var: str):
        self.provider = provider
        self.model_id = model_id
        self.endpoint = endpoint
        self.auth_fmt = auth_fmt
        self.env_var = env_var

# Complete Multi-Provider Registry of Working Free-Tier Models
MODEL_REGISTRY: List[ModelSpec] = [
    # 1. Groq (Ultra-fast LPU - Llama 3.3 70B & 8B)
    ModelSpec("groq", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1/chat/completions", "Bearer {}", "GROQ_API_KEY"),
    ModelSpec("groq", "llama-3.1-8b-instant", "https://api.groq.com/openai/v1/chat/completions", "Bearer {}", "GROQ_API_KEY"),
    
    # 2. SambaNova Systems (Llama 3.3 70B)
    ModelSpec("sambanova", "Meta-Llama-3.3-70B-Instruct", "https://api.sambanova.ai/v1/chat/completions", "Bearer {}", "SAMBANOVA_API_KEY"),
    
    # 3. Mistral AI (Mistral Small)
    ModelSpec("mistral", "mistral-small-latest", "https://api.mistral.ai/v1/chat/completions", "Bearer {}", "MISTRAL_API_KEY"),
    
    # 4. OpenCode AI (DeepSeek v4 Flash Free)
    ModelSpec("opencode", "deepseek-v4-flash-free", "https://api.opencode.ai/v1/chat/completions", "Bearer {}", "OPENCODE_API_KEY"),
    
    # 5. Google Gemini (Gemini 2.0 Flash)
    ModelSpec("gemini", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", "Bearer {}", "GEMINI_API_KEY"),
    
    # 6. GitHub Models (GPT-4o Mini & Phi-4)
    ModelSpec("github", "openai/gpt-4o-mini", "https://models.github.ai/inference/chat/completions", "Bearer {}", "GITHUB_TOKEN"),
    ModelSpec("github", "microsoft/phi-4", "https://models.github.ai/inference/chat/completions", "Bearer {}", "GITHUB_TOKEN"),
    ModelSpec("github", "openai/gpt-4o", "https://models.github.ai/inference/chat/completions", "Bearer {}", "GITHUB_TOKEN"),
    
    # 7. OpenRouter (Free Tier Models)
    ModelSpec("openrouter", "google/gemini-2.0-flash-exp:free", "https://openrouter.ai/api/v1/chat/completions", "Bearer {}", "OPENROUTER_API_KEY"),
    ModelSpec("openrouter", "meta-llama/llama-3.3-70b-instruct:free", "https://openrouter.ai/api/v1/chat/completions", "Bearer {}", "OPENROUTER_API_KEY"),
]

class MultiProviderAIEngine:
    def __init__(self):
        self.cooldowns: Dict[str, float] = {} # Key: "provider:model_id", Val: expiry_timestamp
        self.cooldown_seconds = 60
        self._client: httpx.AsyncClient = None

    def get_client(self) -> httpx.AsyncClient:
        """Returns the shared HTTP client, initializing it if closed or None."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=5.0)
        return self._client

    async def close(self):
        """Closes the shared HTTP client connection pool."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _is_cooling_down(self, key: str) -> bool:
        return time.time() < self.cooldowns.get(key, 0)

    def _mark_cooldown(self, key: str):
        self.cooldowns[key] = time.time() + self.cooldown_seconds
        logger.warning(f"[AI ROTATION] Provider/Model '{key}' hit limit or error. 60s cooldown initiated.")

    async def generate_completion(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> Dict[str, Any]:
        """Rotates through registered free providers dynamically until success."""
        last_error = None
        client = self.get_client()

        for spec in MODEL_REGISTRY:
            key = f"{spec.provider}:{spec.model_id}"
            if self._is_cooling_down(key):
                continue

            api_key = get_api_key(spec.env_var)
            if not api_key:
                continue

            headers = {
                "Authorization": spec.auth_fmt.format(api_key),
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": spec.model_id,
                "messages": messages,
                "temperature": temperature
            }

            try:
                resp = await client.post(spec.endpoint, headers=headers, json=payload)
                
                if resp.status_code == 200:
                    logger.info(f"[AI ENGINE SUCCESS] Used provider='{spec.provider}', model='{spec.model_id}'")
                    return resp.json()
                
                elif resp.status_code in [429, 503, 504]:
                    self._mark_cooldown(key)
                    continue
                else:
                    logger.warning(f"[AI ENGINE FAIL] Provider '{spec.provider}' returned HTTP {resp.status_code}")
                    self._mark_cooldown(key)
                    continue

            except Exception as e:
                self._mark_cooldown(key)
                last_error = e
                continue

        raise RuntimeError(f"All free AI providers failed or hit rate limits. Last error: {str(last_error)}")

# Shared Global Engine Instance
ai_engine = MultiProviderAIEngine()
