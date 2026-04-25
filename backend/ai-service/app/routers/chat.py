# app/routers/chat.py

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import get_llm_service, LLMServiceError
from app.store.conversation_store import conversation_store

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message and get an AI caregiver companion response.

    - Send without `conversation_id` to start a NEW conversation.
    - Send with `conversation_id` to CONTINUE an existing conversation.
    """
    # ── Get or create conversation ──
    if request.conversation_id:
        conv = conversation_store.get_conversation(
            request.conversation_id, request.user_id
        )
        if not conv:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or does not belong to this user.",
            )
        conv_id = request.conversation_id
    else:
        conv_id = conversation_store.create_conversation(request.user_id)

    # ── Add user message to history ──
    conversation_store.add_message(conv_id, "user", request.message)

    # ── Get conversation history and call LLM ──
    history = conversation_store.get_messages_for_llm(conv_id)

    try:
        llm_service = get_llm_service()
        reply = await llm_service.chat(
            history,
            user_health_context=request.user_health_context,
        )
    except LLMServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # ── Save assistant reply ──
    conversation_store.add_message(conv_id, "assistant", reply)

    return ChatResponse(
        conversation_id=conv_id,
        reply=reply,
        messages_in_history=conversation_store.get_message_count(conv_id),
        timestamp=datetime.now(timezone.utc),
    )


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, user_id: str):
    """Delete a conversation and its history."""
    deleted = conversation_store.delete_conversation(conversation_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"detail": "Conversation deleted successfully."}