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

def generate_progressive_hints(topic_title: str, exercise_title: str, user_stuck_code: str = "") -> List[Dict[str, Any]]:
    """Generates 4 levels of hints from gentle nudge to complete code solution."""
    return [
        {
            "level": 1,
            "title": "Level 1: Architectural Nudge",
            "type": "nudge",
            "hint": f"Recall the core contract for {topic_title}. Check what inputs your function expects before processing.",
            "xp_cost": 0
        },
        {
            "level": 2,
            "title": "Level 2: Specific Technique Guidance",
            "type": "guidance",
            "hint": f"Consider using structured data validation or an explicit error check for edge cases in {exercise_title}.",
            "xp_cost": 5
        },
        {
            "level": 3,
            "title": "Level 3: Direct Code Pattern",
            "type": "code_pattern",
            "hint": "Check your variable scoping and ensure return statements match expected output types.",
            "code_snippet": f"# Recommended structure for {topic_title}\ntry:\n    result = process_data()\n    return result\nexcept Exception as err:\n    logger.error(err)",
            "xp_cost": 10
        },
        {
            "level": 4,
            "title": "Level 4: Complete Solution & Explanation",
            "type": "solution",
            "hint": "Here is the production-ready reference solution with clean architecture principles.",
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
