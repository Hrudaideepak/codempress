import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from backend.database import execute_query, execute_write
from backend.auth import get_current_user
from backend.ai_engine import ai_engine

logger = logging.getLogger("codempress.generation_router")
router = APIRouter(prefix="/api/topics", tags=["Generation"])

THEORY_PROMPT_TEMPLATE = """
You are an expert Computer Science educator writing clear, bite-sized theory for university students.
Topic Title: "{title}"
Subject: "{subject}"

Provide comprehensive theory in JSON format with the following exact keys:
{
  "markdown": "Markdown text explaining the concept clearly. Use bolding for key terms.",
  "code_example": {
     "title": "Clear Code Example Title",
     "code": "A code snippet in the appropriate programming language for the subject (e.g. use HTML for Web/HTML, CSS for Styling/CSS, SQL for Database/SQL, JS/TS for JavaScript/TypeScript, C++ for C++ topics). DO NOT use Python for HTML or Web topics!",
     "explanation": "Brief explanation of how the code works line by line",
     "expected_output": "Expected console stdout, browser view, or database query results representation"
  }
}
Return ONLY valid JSON.
"""

MCQ_PROMPT_TEMPLATE = """
Generate 8 multiple choice questions (MCQs) to assess mastery on the topic: "{title}" (Subject: {subject}).

Return a JSON array of 8 questions with this exact structure:
[
  {
    "question_text": "Question statement...",
    "code_snippet": "Optional code snippet or null",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,  // 0-indexed integer (0-3)
    "explanation": "Why this answer is correct"
  }
]
Return ONLY valid JSON.
"""

def parse_ai_json(raw_content: str) -> str:
    """Cleans and extracts JSON raw payload from Markdown block syntax wrappers."""
    cleaned = raw_content.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1)
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    return cleaned.strip()

def get_fallback_code_example(title: str, subject: str) -> dict:
    """Returns a highly specific fallback code example in the correct language for the topic/subject."""
    sub_lower = subject.lower()
    title_lower = title.lower()
    
    # 1. HTML / Web Development
    if "html" in sub_lower or "html" in title_lower or "web" in sub_lower:
        return {
            "title": "Basic HTML Structure for {title}".format(title=title),
            "code": (
                "<!DOCTYPE html>\n"
                "<html>\n"
                "<head>\n"
                "  <meta charset=\"utf-8\">\n"
                "  <title>Demystifying {title}</title>\n"
                "</head>\n"
                "<body>\n"
                "  <h1>Welcome to {title}</h1>\n"
                "  <p>Exploring the core concepts of {title} in Web Development.</p>\n"
                "</body>\n"
                "</html>"
            ).format(title=title),
            "explanation": "Standard HTML5 skeletal markup containing header meta, page title, and structured content elements.",
            "expected_output": "Rendered web page displaying h1 heading: 'Welcome to {title}'".format(title=title)
        }
        
    # 2. CSS
    elif "css" in sub_lower or "css" in title_lower or "style" in sub_lower:
        return {
            "title": "CSS Layout for {title}".format(title=title),
            "code": (
                "/* CSS layout rule for {title} */\n"
                ".concept-box {{\n"
                "  display: flex;\n"
                "  justify-content: center;\n"
                "  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);\n"
                "  border: 2px solid #ffffff;\n"
                "  border-radius: 12px;\n"
                "  padding: 24px;\n"
                "  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);\n"
                "}}"
            ).format(title=title),
            "explanation": "CSS class declarations implementing flex layouts, visual gradients, and responsive margins.",
            "expected_output": "Rendered visual grid with a rounded purple-to-violet gradient container card."
        }
        
    # 3. JavaScript / TypeScript
    elif "javascript" in sub_lower or "js" in sub_lower or "typescript" in sub_lower or "ts" in sub_lower:
        func_name = title.replace(' ', '')
        return {
            "title": "JavaScript execution of {title}".format(title=title),
            "code": (
                "// JavaScript function validating {title}\n"
                "function run{func_name}() {{\n"
                "  const concept = '{title}';\n"
                "  console.log(`Successfully running: ${{concept}}`);\n"
                "}}\n\n"
                "run{func_name}();"
            ).format(title=title, func_name=func_name),
            "explanation": "Declares an ES6 function execution logging the current topic status directly to the developer console.",
            "expected_output": "Successfully running: {title}".format(title=title)
        }
        
    # 4. SQL / Database
    elif "sql" in sub_lower or "database" in sub_lower or "query" in title_lower or "table" in title_lower:
        return {
            "title": "SQL SELECT Statement for {title}".format(title=title),
            "code": (
                "-- Querying records for {title}\n"
                "SELECT _id, title, level_name FROM curriculum_topics\n"
                "WHERE subject_name = '{subject}' AND title = '{title}'\n"
                "LIMIT 1;"
            ).format(title=title, subject=subject),
            "explanation": "Standard ANSI-SQL relational query filtering columns based on the subject and topic filters.",
            "expected_output": "Table row matching topic: '{title}'".format(title=title)
        }
        
    # 5. C++ / C
    elif "c++" in sub_lower or "cpp" in sub_lower or "c#" in sub_lower:
        return {
            "title": "C++ Console Execution for {title}".format(title=title),
            "code": (
                "#include <iostream>\n"
                "#include <string>\n\n"
                "int main() {{\n"
                "    std::string topic = \"{title}\";\n"
                "    std::cout << \"Learning topic: \" << topic << std::endl;\n"
                "    return 0;\n"
                "}}"
            ).format(title=title),
            "explanation": "Includes standard iostream libraries and executes standard namespace console prints.",
            "expected_output": "Learning topic: {title}".format(title=title)
        }
        
    # 6. Default Fallback (Python)
    else:
        return {
            "title": "Python implementation of {title}".format(title=title),
            "code": (
                "# Python script for {title}\n"
                "def show_concept():\n"
                "    concept = '{title}'\n"
                "    print(f'Mastering concept: {{concept}}')\n\n"
                "show_concept()"
            ).format(title=title),
            "explanation": "Declares a standard Python block printing the formatted subject concept string output.",
            "expected_output": "Mastering concept: {title}".format(title=title)
        }

@router.post("/{topic_id}/generate")
async def generate_topic_content(topic_id: int, current_user: dict = Depends(get_current_user)):
    """Generates theory & MCQs on-demand if not already cached in SQLite."""
    # 1. Fetch topic
    rows = await execute_query("SELECT * FROM topics WHERE _id = ?", (topic_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic = rows[0]
    
    # 2. Return cached content if already generated
    existing_questions = await execute_query("SELECT * FROM questions WHERE topic_id = ?", (topic_id,))
    if topic.get("theory_json") and len(existing_questions) > 0:
        return {
            "status": "cached",
            "topic_id": topic_id,
            "title": topic["title"],
            "theory": json.loads(topic["theory_json"]),
            "questions_count": len(existing_questions)
        }

    # 3. Generate Theory via AI Engine
    title = topic["title"]
    subject = topic["subject_name"]
    
    logger.info(f"Generating theory & MCQs for topic {topic_id} ('{title}')")
    
    try:
        theory_resp = await ai_engine.generate_completion([
            {"role": "user", "content": THEORY_PROMPT_TEMPLATE.format(title=title, subject=subject)}
        ])
        theory_raw = theory_resp["choices"][0]["message"]["content"]
        theory_cleaned = parse_ai_json(theory_raw)
        theory_data = json.loads(theory_cleaned)
    except Exception as e:
        logger.error(f"Failed to generate theory: {e}")
        # Fallback theory using language-specific code examples
        theory_data = {
            "markdown": f"### {title}\n\nComprehensive conceptual overview of **{title}** in **{subject}**.",
            "code_example": get_fallback_code_example(title, subject)
        }

    # 4. Generate MCQs via AI Engine
    try:
        mcq_resp = await ai_engine.generate_completion([
            {"role": "user", "content": MCQ_PROMPT_TEMPLATE.format(title=title, subject=subject)}
        ])
        mcq_raw = mcq_resp["choices"][0]["message"]["content"]
        mcq_cleaned = parse_ai_json(mcq_raw)
        raw_list = json.loads(mcq_cleaned)
        
        # Robust validation of AI structure response
        if not isinstance(raw_list, list):
            if isinstance(raw_list, dict) and "questions" in raw_list and isinstance(raw_list["questions"], list):
                raw_list = raw_list["questions"]
            else:
                raise ValueError("Parsed MCQ response is not a list")

        validated_list = []
        for q in raw_list:
            if not isinstance(q, dict):
                continue
            text = q.get("question_text")
            options = q.get("options")
            correct = q.get("correct_answer")
            explanation = q.get("explanation", "")
            
            if not text or not isinstance(options, list) or len(options) != 4 or correct is None:
                continue
                
            validated_list.append({
                "question_text": str(text),
                "code_snippet": q.get("code_snippet"),
                "options": options,
                "correct_answer": int(correct),
                "explanation": str(explanation)
            })

        if not validated_list:
            raise ValueError("No valid questions parsed from AI response")
        questions_list = validated_list

    except Exception as e:
        logger.error(f"Failed to generate MCQs: {e}")
        # Fallback MCQs
        questions_list = [
            {
                "question_text": f"What is the primary purpose of {title} in {subject}?",
                "code_snippet": None,
                "options": [
                    f"To efficiently organize and process concepts related to {title}",
                    "To cause runtime error",
                    "To bypass memory allocation",
                    "None of the above"
                ],
                "correct_answer": 0,
                "explanation": f"{title} provides structured algorithmic and data handling capability."
            }
        ]

    # Save theory AND questions atomically using single database transaction
    from backend.database import execute_batch_write
    queries_and_params = []
    
    # 1. Update theory_json
    theory_json_str = json.dumps(theory_data)
    queries_and_params.append((
        "UPDATE topics SET theory_json = ? WHERE _id = ?",
        (theory_json_str, topic_id)
    ))
    
    # 2. Insert questions
    for q in questions_list:
        options_json_str = json.dumps(q["options"])
        queries_and_params.append((
            "INSERT INTO questions (topic_id, question_text, code_snippet, options_json, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)",
            (topic_id, q["question_text"], q.get("code_snippet"), options_json_str, q["correct_answer"], q["explanation"])
        ))
        
    await execute_batch_write(queries_and_params)

    return {
        "status": "generated",
        "topic_id": topic_id,
        "title": title,
        "theory": theory_data,
        "questions_count": len(questions_list)
    }
