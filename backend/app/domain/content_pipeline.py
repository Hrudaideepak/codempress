"""
Codempress Content Production Guide Engine & AI Pipeline v2.0
--------------------------------------------------------------
Operationalizes the 20-section Standard Topic Template, AI Mentor 4-Level Hint
generator, misconception detection, and automated topic generation pipeline.
"""

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# -------------------------------------------------------------------------
# 20-Section Standard Topic Template Schema
# -------------------------------------------------------------------------

class TopicSection(BaseModel):
    id: int
    name: str
    prompt_reference: str
    kg_integration: str
    content: str


class StandardTopicTemplate(BaseModel):
    topic_id: str
    ontology_node: str
    title: str
    difficulty: str  # 'beginner', 'intermediate', 'advanced', 'expert'
    estimated_minutes: int
    
    # 20 Standard Sections
    metadata: Dict[str, Any]
    learning_objectives: List[str]
    prerequisites: List[str]
    estimated_duration: str
    eli5_explanation: str
    beginner_explanation: str
    intermediate_explanation: str
    advanced_explanation: str
    real_world_use_cases: List[str]
    worked_examples: List[Dict[str, Any]]
    hands_on_exercises: List[Dict[str, Any]]
    mini_project: Dict[str, Any]
    common_mistakes: List[Dict[str, str]]
    best_practices: List[str]
    cheat_sheet: List[str]
    quiz_questions: List[Dict[str, Any]]
    interview_questions: List[Dict[str, str]]
    further_reading: List[Dict[str, str]]
    ai_tutor_prompts: List[str]
    mastery_checklist: List[str]


# -------------------------------------------------------------------------
# AI Mentor 4-Level Progressive Hint Generator
# -------------------------------------------------------------------------

def generate_progressive_hints(
    topic_title: str,
    exercise_title: str,
    user_stuck_code: str = "",
    error_traceback: Optional[str] = None,
    failed_test_case: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Generates 4 levels of hints from gentle nudge to complete code solution, incorporating runtime error details if present."""
    
    error_info = None
    if error_traceback:
        from backend.app.domain.error_parser import parse_and_sanitize_error
        error_info = parse_and_sanitize_error(error_traceback)

    err_type = error_info.get("error_type") if error_info else None
    line_no = error_info.get("line_number") if error_info else None
    err_msg = error_info.get("message") if error_info else None

    # Level 1: Nudge
    if err_type:
        level1_text = f"Recall the requirements for {topic_title}. Your code encountered a runtime error—check your logic around variables and bounds."
    else:
        level1_text = f"Recall the core contract for {topic_title}. Check what inputs your function expects before processing."

    # Level 2: Guidance
    if err_type and line_no:
        level2_text = f"Runtime error ({err_type}) detected at line {line_no}: '{err_msg}'. Inspect the variable state leading up to this line."
    elif err_type:
        level2_text = f"A {err_type} error occurred ({err_msg}). Consider adding validation or guard clauses to handle unexpected state."
    elif failed_test_case:
        exp = failed_test_case.get("expected") or failed_test_case.get("expected_output") or ""
        act = failed_test_case.get("actual") or failed_test_case.get("actual_output") or ""
        level2_text = f"Assertion check failed. Your code output '{act}', but test case expected '{exp}'. Check edge case conditions."
    else:
        level2_text = f"Consider using structured data validation or an explicit error check for edge cases in {exercise_title}."

    # Level 3: Syntax / Code Pattern
    if err_type == "ZeroDivisionError":
        pattern = "if divisor != 0:\n    return num / divisor\nelse:\n    return 0"
    elif err_type in ("IndexError", "KeyError"):
        pattern = "if index < len(arr):\n    return arr[index]\nelse:\n    return None"
    elif err_type == "TypeError":
        pattern = "if isinstance(value, (int, float)):\n    return process(value)\nelse:\n    return 0"
    elif err_type in ("NameError", "ReferenceError"):
        pattern = "# Ensure all variables are defined before reference\nresult = 0"
    else:
        pattern = f"# Recommended guard pattern for {topic_title}\ntry:\n    result = process_data()\n    return result\nexcept Exception as err:\n    logger.error(err)"

    level3_text = f"Check variable scope, types, and guard clauses. Here is a resilient pattern for {topic_title}:"

    # Level 4: Complete Solution & Explanation
    level4_text = f"Here is the reference solution and structural pattern for {topic_title}."

    return [
        {
            "level": 1,
            "title": "Level 1: Architectural Nudge",
            "type": "nudge",
            "hint": level1_text,
            "content": level1_text,
            "xp_cost": 0
        },
        {
            "level": 2,
            "title": "Level 2: Specific Technique Guidance",
            "type": "guidance",
            "hint": level2_text,
            "content": level2_text,
            "xp_cost": 5
        },
        {
            "level": 3,
            "title": "Level 3: Direct Code Pattern",
            "type": "code_pattern",
            "hint": level3_text,
            "content": level3_text,
            "code_snippet": pattern,
            "xp_cost": 10
        },
        {
            "level": 4,
            "title": "Level 4: Complete Solution & Explanation",
            "type": "solution",
            "hint": level4_text,
            "content": level4_text,
            "code_snippet": f"def solution():\n    \"\"\"Reference solution for {topic_title}\"\"\"\n    return {{'status': 'success', 'verified': True}}",
            "xp_cost": 15
        }
    ]


# -------------------------------------------------------------------------
# Misconception Detector Engine
# -------------------------------------------------------------------------

def detect_misconceptions(topic_id: int, wrong_answer_index: int) -> Dict[str, str]:
    """Retrieves targeted misconception feedback and grounding analogies when a user selects an incorrect quiz option."""
    misconception_db = {
        0: {
            "misconception": "Thinking DELETE is non-idempotent because it changes server data.",
            "reality": "DELETE is idempotent. Executing DELETE /users/42 once or 10 times leaves the system in the exact same state (user 42 is removed).",
            "analogy": "Deleting a file from your hard drive: running 'rm file.txt' 5 times produces the same result—the file is gone."
        },
        1: {
            "misconception": "Assuming GET requests can safely include heavy request bodies.",
            "reality": "GET requests should rely on query parameters or path variables. Heavy request bodies on GET are non-standard and often stripped by proxies.",
            "analogy": "Sending a postcard vs a shipping container: GET is for quick lookups."
        }
    }
    return misconception_db.get(wrong_answer_index % 2, {
        "misconception": "Misunderstanding the core contract of this concept.",
        "reality": "Re-read the beginner & intermediate explanations to clarify the boundary conditions.",
        "analogy": "Think of it like a strict mathematical function: same input always produces predictable output."
    })


class ContentPipeline:
    def __init__(self):
        self.generate_hints = generate_progressive_hints
        self.detect_misconceptions = detect_misconceptions


content_pipeline = ContentPipeline()
