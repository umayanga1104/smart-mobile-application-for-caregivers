# app/routers/tips.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.models.schemas import TipsRequest, TipsResponse, Tip
from app.services.llm_service import get_llm_service, LLMServiceError

router = APIRouter(prefix="/tips", tags=["Tips & Recommendations"])


@router.post("/generate", response_model=TipsResponse)
async def generate_tips(request: TipsRequest):
    """
    Generate personalized caregiving tips and recommendations.

    Categories available:
    - `self_care` — personal wellness for the caregiver
    - `stress_management` — coping with caregiver burnout
    - `patient_care` — day-to-day care techniques
    - `nutrition` — healthy eating for caregiver and patient
    - `sleep` — better sleep despite caregiving demands
    - `communication` — talking with patients, family, doctors
    - `daily_routine` — structuring the caregiving day
    - `emotional_wellbeing` — mental health and resilience
    - `exercise` — staying active with limited time

    Pass optional `context` to get personalized tips.
    """
    try:
        llm_service = get_llm_service()
        raw_tips = await llm_service.generate_tips(
            category=request.category.value,
            count=request.count,
            context=request.context,
        )
    except LLMServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Validate and structure tips
    tips = []
    for t in raw_tips:
        try:
            tips.append(Tip(
                title=t.get("title", "Tip"),
                description=t.get("description", ""),
                difficulty=t.get("difficulty", "easy"),
                time_needed=t.get("time_needed", "5 minutes"),
            ))
        except Exception:
            continue  # skip malformed tips

    if not tips:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate valid tips. Please try again.",
        )

    return TipsResponse(
        category=request.category.value,
        tips=tips,
        personalized=request.context is not None,
        generated_at=datetime.now(timezone.utc),
    )