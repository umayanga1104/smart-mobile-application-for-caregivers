# app/models/schemas.py

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


# ──────────────── Chat Schemas ────────────────

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = Field(
        None,
        description="Existing conversation ID to continue. "
                    "Leave empty to start a new conversation."
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The caregiver's message"
    )
    user_id: str = Field(
        ...,
        description="Unique user identifier from your main app"
    )
    user_health_context: Optional[str] = Field(
        None,
        description="User's health profile summary for personalization"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "user_id": "user_123",
                    "message": "I'm feeling really exhausted after taking "
                               "care of my mom all week. I don't know how "
                               "to keep going."
                }
            ]
        }
    }


class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str
    timestamp: datetime


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    messages_in_history: int
    timestamp: datetime


# ──────────────── Tips Schemas ────────────────

class TipCategory(str, Enum):
    SELF_CARE = "self_care"
    STRESS_MANAGEMENT = "stress_management"
    PATIENT_CARE = "patient_care"
    NUTRITION = "nutrition"
    SLEEP = "sleep"
    COMMUNICATION = "communication"
    DAILY_ROUTINE = "daily_routine"
    EMOTIONAL_WELLBEING = "emotional_wellbeing"
    EXERCISE = "exercise"


class TipsRequest(BaseModel):
    user_id: str
    category: TipCategory = Field(
        ..., description="Category of tips to generate"
    )
    context: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional context about the caregiving situation "
                    "for personalized tips"
    )
    count: int = Field(
        5, ge=1, le=10,
        description="Number of tips to generate"
    )


class Tip(BaseModel):
    title: str
    description: str
    difficulty: str          # "easy", "moderate", "committed"
    time_needed: str         # e.g. "5 minutes", "15 minutes"


class TipsResponse(BaseModel):
    category: str
    tips: list[Tip]
    personalized: bool
    generated_at: datetime


# ──────────────── Health Check ────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    llm_provider: str
    llm_model: str