"""
Supabase Client Infrastructure module for Codempress.

Provides async access to Supabase PostgreSQL database using either the official
`supabase-py` client SDK or PostgREST direct REST API fallback.
"""

import logging
import os
from typing import Any, Dict, List, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger("codempress.supabase")

_supabase_client = None

def get_supabase_client():
    """Initializes and returns the singleton Supabase client if configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL:
        logger.debug("SUPABASE_URL is not configured.")
        return None

    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    if not api_key:
        logger.warning("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is configured.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(settings.SUPABASE_URL, api_key)
        logger.info("Successfully initialized native Supabase Python client SDK.")
        return _supabase_client
    except ImportError:
        logger.info("supabase-py SDK not installed. Falling back to HTTP REST interface.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


class SupabaseRESTClient:
    """Fallback PostgREST client for async queries when SDK is not present or direct REST is preferred."""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.key = key
        self.rest_url = f"{self.url}/rest/v1"
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def select(self, table: str, query_params: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.rest_url}/{table}", headers=self.headers, params=query_params or {})
            resp.raise_for_status()
            return resp.json()

    async def insert(self, table: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(f"{self.rest_url}/{table}", headers=self.headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def update(self, table: str, match_params: Dict[str, str], payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.patch(f"{self.rest_url}/{table}", headers=self.headers, params=match_params, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def delete(self, table: str, match_params: Dict[str, str]) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(f"{self.rest_url}/{table}", headers=self.headers, params=match_params)
            resp.raise_for_status()
            return resp.json()


def get_supabase_rest_client() -> Optional[SupabaseRESTClient]:
    """Returns an instance of SupabaseRESTClient if URL & key exist."""
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    if url and key:
        return SupabaseRESTClient(url, key)
    return None
