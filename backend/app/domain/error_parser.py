"""
Error Parser & Traceback Sanitizer Module
------------------------------------------
Parses and sanitizes raw Python tracebacks and Node.js JavaScript errors.
Strips internal host file paths while keeping line numbers, error categories, and messages.
"""

import re
from typing import Dict, Any, Optional

def parse_and_sanitize_error(stderr: str, language: str = "python") -> Dict[str, Any]:
    """
    Parses and sanitizes raw stderr string.
    Returns structured error dict with sanitized_traceback, error_type, line_number, and message.
    """
    if not stderr or not stderr.strip():
        return {
            "sanitized_traceback": "",
            "error_type": None,
            "line_number": None,
            "message": ""
        }
        
    lang = (language or "python").lower()
    if lang in ("python", "py"):
        return _sanitize_python_traceback(stderr)
    elif lang in ("javascript", "js", "node"):
        return _sanitize_javascript_traceback(stderr)
    else:
        return _sanitize_python_traceback(stderr)

def _sanitize_python_traceback(stderr: str) -> Dict[str, Any]:
    lines = stderr.strip().splitlines()
    sanitized_lines = []
    error_type = None
    line_number = None
    message = ""

    # Pattern matching Python file frame: File "path/to/file.py", line 12, in <module>
    file_line_pattern = re.compile(r'File\s+"[^"]+"(?:,\s*line\s*(\d+))?')
    
    for line in lines:
        match = file_line_pattern.search(line)
        if match:
            if match.group(1):
                try:
                    line_number = int(match.group(1))
                except ValueError:
                    pass
            # Replace host file path with <student_code>
            if match.group(1):
                clean_line = file_line_pattern.sub(r'File "<student_code>", line \1', line)
            else:
                clean_line = file_line_pattern.sub(r'File "<student_code>"', line)
            sanitized_lines.append(clean_line)
        else:
            sanitized_lines.append(line)
        
        # Check for Python error category e.g. ZeroDivisionError: division by zero
        err_match = re.match(r'^([A-Z][a-zA-Z0-9_]*Error|[A-Z][a-zA-Z0-9_]*Exception):\s*(.*)$', line.strip())
        if err_match:
            error_type = err_match.group(1)
            message = err_match.group(2)

    # Fallback error_type extraction from last line if not found
    if not error_type and sanitized_lines:
        last_line = sanitized_lines[-1].strip()
        if ":" in last_line:
            parts = last_line.split(":", 1)
            if "Error" in parts[0] or "Exception" in parts[0]:
                error_type = parts[0].strip()
                message = parts[1].strip()
        elif "Error" in last_line or "Exception" in last_line:
            error_type = "RuntimeError"
            message = last_line

    return {
        "sanitized_traceback": "\n".join(sanitized_lines),
        "error_type": error_type or "RuntimeError",
        "line_number": line_number,
        "message": message or (stderr.strip().splitlines()[-1] if stderr.strip() else "")
    }

def _sanitize_javascript_traceback(stderr: str) -> Dict[str, Any]:
    lines = stderr.strip().splitlines()
    sanitized_lines = []
    error_type = None
    line_number = None
    message = ""

    for line in lines:
        # Strip node.js internal stack frames
        if "node:internal" in line or "internal/modules" in line or "internal/process" in line:
            continue
            
        # Match error header e.g. ReferenceError: x is not defined or SyntaxError: ...
        err_match = re.match(r'^([A-Z][a-zA-Z0-9_]*Error):\s*(.*)$', line.strip())
        if err_match:
            error_type = err_match.group(1)
            message = err_match.group(2)
            
        # Extract line number e.g. :3:5 or line 3
        line_match = re.search(r'(?::|line\s+)(\d+)(?::\d+)?', line)
        if line_match and not line_number:
            try:
                line_number = int(line_match.group(1))
            except ValueError:
                pass

        # Strip host file paths e.g. (C:\...\file.js:3:5) or (/tmp/file.js:3:5)
        clean_line = re.sub(r'\([A-Za-z]:\\[^)]+\)', '(<student_code>)', line)
        clean_line = re.sub(r'\(/[^)]+\)', '(<student_code>)', clean_line)
        clean_line = re.sub(r'[A-Za-z]:\\[^\s:]+', '<student_code>', clean_line)
        clean_line = re.sub(r'/[^\s:]+\.js', '<student_code>', clean_line)
        sanitized_lines.append(clean_line)

    if not error_type and lines:
        for l in lines:
            if "Error" in l:
                parts = l.split(":", 1)
                if len(parts) == 2:
                    error_type = parts[0].strip()
                    message = parts[1].strip()
                    break
        if not error_type:
            error_type = "Error"
            message = lines[0]

    return {
        "sanitized_traceback": "\n".join(sanitized_lines),
        "error_type": error_type or "Error",
        "line_number": line_number,
        "message": message
    }
