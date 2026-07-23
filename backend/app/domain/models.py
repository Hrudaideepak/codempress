from typing import List, Optional
from pydantic import BaseModel

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
