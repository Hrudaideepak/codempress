from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- User & Auth Schemas ---
class UserDTO(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str] = ""
    xp: int = 0
    streak_count: int = 1

class AuthResponse(BaseModel):
    token: str
    user: UserDTO

# --- Question & Topic Schemas ---
class QuestionDTO(BaseModel):
    id: int
    question_text: str
    code_snippet: Optional[str] = None
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None

class TopicDetailDTO(BaseModel):
    id: int
    subject_name: str
    title: str
    level: str
    theory_json: Optional[str] = None
    mastery_percent: int = 0
    questions: List[QuestionDTO] = []

# --- Quiz Submission Schemas ---
class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: int

class QuizSubmission(BaseModel):
    topic_id: int
    answers: List[AnswerSubmission]

class QuizResultDTO(BaseModel):
    score_percent: int
    correct_count: int
    total_questions: int
    xp_earned: int
    topic_mastery_percent: int
    passed: bool

# --- Sandbox Execution & Evaluation Schemas ---
class SandboxExecuteRequest(BaseModel):
    language: str = Field(default="python", description="'python' or 'javascript' / 'js'")
    code: str = Field(..., description="Source code snippet to execute")
    stdin: Optional[str] = Field(default="", description="Optional standard input")
    timeout: Optional[float] = Field(default=1.5, description="Timeout limit in seconds (default 1.5s)")
    stream: Optional[bool] = Field(default=False, description="If True, returns Server-Sent Events stream")

class SandboxExecuteResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float
    timed_out: bool
    status: str  # "success", "error", "timeout"
    error_type: Optional[str] = None
    sanitized_traceback: Optional[str] = None

class TestCase(BaseModel):
    id: Optional[Any] = 1
    input: Optional[str] = ""
    expected_output: Optional[str] = ""
    expected: Optional[str] = ""
    assertion_code: Optional[str] = None
    is_hidden: Optional[bool] = False
    hidden: Optional[bool] = False

class SandboxEvaluateRequest(BaseModel):
    topic_id: Optional[int] = 1
    challenge_id: Optional[str] = None
    language: str = Field(default="python", description="'python' or 'javascript' / 'js'")
    code: str = Field(..., description="Student solution code to evaluate")
    test_cases: List[TestCase] = Field(default=[], description="List of test cases to evaluate against")

class TestCaseResult(BaseModel):
    id: Optional[Any] = 1
    test_case_id: Optional[Any] = 1
    passed: bool
    input: Optional[str] = ""
    expected: str
    actual: str
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    stderr: Optional[str] = ""
    execution_time_ms: float = 0.0
    hidden: bool = False

class ErrorContext(BaseModel):
    sanitized_traceback: str
    error_type: str
    line_number: Optional[int] = None
    message: Optional[str] = None

class SandboxEvaluateResponse(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    score_percent: int
    xp_earned: int
    total_xp: int
    test_results: List[TestCaseResult]
    results: List[TestCaseResult]
    error_context: Optional[ErrorContext] = None
    error_traceback: Optional[str] = None
