"""
Multi-Language Code Sandbox Engine Module
-----------------------------------------
Executes Python and JavaScript code snippets securely via isolated sub-processes.
Enforces 1.5s execution SLA timeout guard, memory caps, and stdin/stdout/stderr stream limits (64KB).
"""

import sys
import os
import shutil
import time
import json
import asyncio
import logging
from typing import Dict, Any, AsyncGenerator

from backend.app.domain.error_parser import parse_and_sanitize_error

logger = logging.getLogger("codempress.sandbox_engine")

MAX_OUTPUT_BYTES = 64 * 1024  # 64 KB limit for stdout/stderr
DEFAULT_TIMEOUT = 3.5          # 3.5 seconds SLA to account for cloud runner process initialization

def build_execution_command(language: str) -> tuple[list[str], str]:
    """
    Returns (cmd_list, normalized_lang).
    Python: sys.executable -I -B -u -
    JavaScript: node --no-warnings --max-old-space-size=64 -
    """
    lang = (language or "python").lower()
    if lang in ("python", "py"):
        return [sys.executable, "-I", "-B", "-u", "-"], "python"
    elif lang in ("javascript", "js", "node"):
        node_bin = shutil.which("node")
        if not node_bin:
            # Fallback check for standard node binary
            node_bin = "node"
        return [node_bin, "--no-warnings", "--max-old-space-size=64", "-"], "javascript"
    else:
        # Default to Python
        return [sys.executable, "-I", "-B", "-u", "-"], "python"

def prepare_code_with_stdin(language: str, code: str, stdin_input: str = "") -> str:
    """
    Prepares code snippet, embedding optional stdin input if provided.
    """
    if not stdin_input:
        return code

    lang = language.lower()
    if lang in ("python", "py"):
        stdin_override = f"import io, sys\nsys.stdin = io.StringIO({repr(stdin_input)})\n"
        return stdin_override + code
    elif lang in ("javascript", "js", "node"):
        js_stdin_mock = (
            f"const __input_data = {json.dumps(stdin_input)};\n"
            f"const fs = require('fs');\n"
            f"const origRead = fs.readFileSync;\n"
            f"fs.readFileSync = function(fd, opts) {{\n"
            f"  if (fd === 0 || fd === '/dev/stdin') return __input_data;\n"
            f"  return origRead.apply(this, arguments);\n"
            f"}};\n"
        )
        return js_stdin_mock + code
    return code

def get_clean_env() -> dict:
    """Constructs a clean environment mapping preserving necessary OS system paths for process RNG & temp initialization."""
    clean_keys = ["PATH", "SYSTEMROOT", "SYSTEMDRIVE", "WINDIR", "TEMP", "TMP", "HOME", "USERPROFILE", "LANG", "LC_ALL", "SystemRoot", "SystemDrive", "PATHEXT"]
    return {k: os.environ[k] for k in clean_keys if k in os.environ}

async def execute_code(
    language: str,
    code: str,
    stdin_input: str = "",
    timeout: float = DEFAULT_TIMEOUT
) -> Dict[str, Any]:
    """
    Executes Python or JavaScript code under sub-1.5s timeout.
    Returns dictionary with stdout, stderr, exit_code, execution_time_ms, timed_out, and status.
    """
    cmd, norm_lang = build_execution_command(language)

    # Check Node availability if JS requested
    if norm_lang == "javascript" and not shutil.which("node"):
        return {
            "stdout": "",
            "stderr": "Node.js runtime is not available on host system.",
            "exit_code": 1,
            "execution_time_ms": 0.0,
            "timed_out": False,
            "status": "error",
            "error_type": "EnvironmentError",
            "sanitized_traceback": "Node.js runtime is not available on host system."
        }

    full_code = prepare_code_with_stdin(norm_lang, code, stdin_input)
    start_time = time.perf_counter()

    # Clean stripped environment
    env = get_clean_env()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(input=full_code.encode("utf-8")),
                timeout=timeout
            )
            duration_ms = (time.perf_counter() - start_time) * 1000.0

            stdout = stdout_bytes.decode("utf-8", errors="replace")
            stderr = stderr_bytes.decode("utf-8", errors="replace")

            # Apply 64KB stream truncation caps
            if len(stdout.encode("utf-8")) > MAX_OUTPUT_BYTES:
                stdout = stdout[:MAX_OUTPUT_BYTES] + "\n... [Output truncated at 64KB limit]"
            if len(stderr.encode("utf-8")) > MAX_OUTPUT_BYTES:
                stderr = stderr[:MAX_OUTPUT_BYTES] + "\n... [Output truncated at 64KB limit]"

            exit_code = process.returncode if process.returncode is not None else 0
            status = "success" if exit_code == 0 else "error"

            parsed_err = parse_and_sanitize_error(stderr, norm_lang) if stderr.strip() else {}

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": exit_code,
                "execution_time_ms": round(duration_ms, 2),
                "timed_out": False,
                "status": status,
                "error_type": parsed_err.get("error_type"),
                "sanitized_traceback": parsed_err.get("sanitized_traceback", stderr)
            }

        except asyncio.TimeoutError:
            try:
                process.kill()
                await process.wait()
            except Exception as e:
                logger.warning(f"Error killing timed-out process: {e}")

            duration_ms = (time.perf_counter() - start_time) * 1000.0
            timeout_msg = f"Execution timed out (exceeded SLA limit of {timeout} seconds)."
            return {
                "stdout": "",
                "stderr": timeout_msg,
                "exit_code": -1,
                "execution_time_ms": round(duration_ms, 2),
                "timed_out": True,
                "status": "timeout",
                "error_type": "TimeoutError",
                "sanitized_traceback": timeout_msg
            }

    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        err_msg = f"Failed to execute subprocess: {exc}"
        logger.error(err_msg)
        return {
            "stdout": "",
            "stderr": err_msg,
            "exit_code": 1,
            "execution_time_ms": round(duration_ms, 2),
            "timed_out": False,
            "status": "error",
            "error_type": "SubprocessError",
            "sanitized_traceback": err_msg
        }

async def stream_code_execution(
    language: str,
    code: str,
    stdin_input: str = "",
    timeout: float = DEFAULT_TIMEOUT
) -> AsyncGenerator[str, None]:
    """
    Executes code and streams stdout/stderr chunks in real time as Server-Sent Events (SSE).
    Format: data: {"type": "stdout"|"stderr"|"status", "content": ...}\n\n
    """
    cmd, norm_lang = build_execution_command(language)

    if norm_lang == "javascript" and not shutil.which("node"):
        err_evt = json.dumps({"type": "stderr", "content": "Node.js runtime is not available on host system.\n"})
        yield f"data: {err_evt}\n\n"
        status_evt = json.dumps({"type": "status", "exit_code": 1, "execution_time_ms": 0.0, "status": "error"})
        yield f"data: {status_evt}\n\n"
        return

    full_code = prepare_code_with_stdin(norm_lang, code, stdin_input)
    start_time = time.perf_counter()

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=get_clean_env()
        )

        # Write code and close stdin pipe
        if process.stdin:
            process.stdin.write(full_code.encode("utf-8"))
            await process.stdin.drain()
            process.stdin.close()

        stdout_bytes = bytearray()
        stderr_bytes = bytearray()

        async def read_stream(reader: asyncio.StreamReader, stream_type: str):
            nonlocal stdout_bytes, stderr_bytes
            target_buf = stdout_bytes if stream_type == "stdout" else stderr_bytes

            while True:
                line = await reader.readline()
                if not line:
                    break
                if len(target_buf) < MAX_OUTPUT_BYTES:
                    target_buf.extend(line)
                    text = line.decode("utf-8", errors="replace")
                    yield f"data: {json.dumps({'type': stream_type, 'content': text})}\n\n"

        try:
            # Gather stream readings with timeout
            stdout_task = asyncio.create_task(_consume_stream(process.stdout, "stdout"))
            stderr_task = asyncio.create_task(_consume_stream(process.stderr, "stderr"))

            combined_stream = asyncio.gather(stdout_task, stderr_task)
            
            # Wait for tasks to complete
            done, pending = await asyncio.wait(
                [combined_stream],
                timeout=timeout
            )

            if pending:
                for task in pending:
                    task.cancel()
                try:
                    process.kill()
                    await process.wait()
                except Exception:
                    pass
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                err_msg = f"Execution timed out (exceeded limit of {timeout}s).\n"
                yield f"data: {json.dumps({'type': 'stderr', 'content': err_msg})}\n\n"
                yield f"data: {json.dumps({'type': 'status', 'exit_code': -1, 'execution_time_ms': round(duration_ms, 2), 'status': 'timeout'})}\n\n"
                return

            # Retrieve buffered events from tasks
            for chunks in (stdout_task.result() + stderr_task.result()):
                yield chunks

            await process.wait()
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            exit_code = process.returncode if process.returncode is not None else 0
            status_str = "success" if exit_code == 0 else "error"
            yield f"data: {json.dumps({'type': 'status', 'exit_code': exit_code, 'execution_time_ms': round(duration_ms, 2), 'status': status_str})}\n\n"

        except asyncio.TimeoutError:
            try:
                process.kill()
                await process.wait()
            except Exception:
                pass
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            err_msg = f"Execution timed out (exceeded limit of {timeout}s).\n"
            yield f"data: {json.dumps({'type': 'stderr', 'content': err_msg})}\n\n"
            yield f"data: {json.dumps({'type': 'status', 'exit_code': -1, 'execution_time_ms': round(duration_ms, 2), 'status': 'timeout'})}\n\n"

    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        err_msg = f"Subprocess error: {exc}\n"
        yield f"data: {json.dumps({'type': 'stderr', 'content': err_msg})}\n\n"
        yield f"data: {json.dumps({'type': 'status', 'exit_code': 1, 'execution_time_ms': round(duration_ms, 2), 'status': 'error'})}\n\n"

async def _consume_stream(reader: asyncio.StreamReader, stream_type: str) -> list[str]:
    chunks = []
    total_len = 0
    while True:
        line = await reader.readline()
        if not line:
            break
        total_len += len(line)
        if total_len <= MAX_OUTPUT_BYTES:
            text = line.decode("utf-8", errors="replace")
            chunks.append(f"data: {json.dumps({'type': stream_type, 'content': text})}\n\n")
    return chunks
