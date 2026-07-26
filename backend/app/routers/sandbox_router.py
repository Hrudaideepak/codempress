"""
Sandbox API Router Module
--------------------------
Exposes endpoints for isolated code execution and automated assessment:
- POST /api/sandbox/execute: Runs Python or JavaScript code snippet (JSON & SSE stream options).
- POST /api/sandbox/evaluate: Runs code against test cases, updates mastery & awards XP atomically.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse

from backend.auth import get_current_user_optional
from backend.app.domain.models import (
    SandboxExecuteRequest,
    SandboxExecuteResponse,
    SandboxEvaluateRequest,
    SandboxEvaluateResponse
)
from backend.app.domain.sandbox_engine import execute_code, stream_code_execution
from backend.app.domain.assertion_harness import evaluate_solution

logger = logging.getLogger("codempress.sandbox_router")
router = APIRouter(prefix="/api/sandbox", tags=["Code Sandbox"])

@router.post("/execute", response_model=SandboxExecuteResponse)
async def execute_sandbox_code(
    request: Request,
    payload: SandboxExecuteRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Executes Python or JavaScript code securely under a 1.5s timeout.
    Supports standard JSON responses and real-time SSE streaming.
    """
    accept_header = request.headers.get("accept", "")
    is_stream = payload.stream or ("text/event-stream" in accept_header)

    if is_stream:
        return StreamingResponse(
            stream_code_execution(
                language=payload.language,
                code=payload.code,
                stdin_input=payload.stdin or "",
                timeout=payload.timeout or 1.5
            ),
            media_type="text/event-stream"
        )

    res = await execute_code(
        language=payload.language,
        code=payload.code,
        stdin_input=payload.stdin or "",
        timeout=payload.timeout or 1.5
    )

    return SandboxExecuteResponse(**res)

@router.post("/evaluate", response_model=SandboxEvaluateResponse)
async def evaluate_sandbox_code(
    payload: SandboxEvaluateRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Evaluates student code against test cases (IO matching or custom assertion expressions).
    Awards XP and updates user progress in SQLite using an atomic batch transaction.
    """
    user_id = 1
    if current_user:
        user_id = current_user.get("_id") or current_user.get("id") or 1

    # Convert Pydantic test cases to dict format
    test_cases_dict = [tc.dict() for tc in payload.test_cases]

    eval_res = await evaluate_solution(
        language=payload.language,
        code=payload.code,
        test_cases=test_cases_dict,
        user_id=user_id,
        topic_id=payload.topic_id or 1
    )

    return SandboxEvaluateResponse(**eval_res)
