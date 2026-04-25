# app/store/conversation_store.py

import uuid
import time
from datetime import datetime, timezone
from typing import Optional
from app.config import get_settings


class ConversationStore:
    """
    In-memory conversation store with TTL expiration.

    ⚠️ FOR PRODUCTION: Replace with Redis or a database.
    This works fine for a single-instance microservice.
    """

    def __init__(self):
        # {conversation_id: {"user_id": str, "messages": [...], "last_active": float}}
        self._conversations: dict = {}

    def create_conversation(self, user_id: str) -> str:
        conv_id = f"conv_{uuid.uuid4().hex[:16]}"
        self._conversations[conv_id] = {
            "user_id": user_id,
            "messages": [],
            "last_active": time.time(),
        }
        return conv_id

    def get_conversation(self, conversation_id: str, user_id: str) -> Optional[dict]:
        self._cleanup_expired()
        conv = self._conversations.get(conversation_id)
        if conv and conv["user_id"] == user_id:
            conv["last_active"] = time.time()
            return conv
        return None

    def add_message(self, conversation_id: str, role: str, content: str):
        settings = get_settings()
        conv = self._conversations.get(conversation_id)
        if not conv:
            return

        conv["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        conv["last_active"] = time.time()

        # Trim history to keep within limits (keep system-relevant context)
        max_msgs = settings.MAX_HISTORY_MESSAGES
        if len(conv["messages"]) > max_msgs:
            conv["messages"] = conv["messages"][-max_msgs:]

    def get_messages_for_llm(self, conversation_id: str) -> list[dict]:
        """Return messages formatted for the LLM API."""
        conv = self._conversations.get(conversation_id)
        if not conv:
            return []
        return [
            {"role": m["role"], "content": m["content"]}
            for m in conv["messages"]
        ]

    def get_message_count(self, conversation_id: str) -> int:
        conv = self._conversations.get(conversation_id)
        return len(conv["messages"]) if conv else 0

    def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        conv = self._conversations.get(conversation_id)
        if conv and conv["user_id"] == user_id:
            del self._conversations[conversation_id]
            return True
        return False

    def _cleanup_expired(self):
        settings = get_settings()
        ttl_seconds = settings.CONVERSATION_TTL_MINUTES * 60
        now = time.time()
        expired = [
            cid for cid, conv in self._conversations.items()
            if now - conv["last_active"] > ttl_seconds
        ]
        for cid in expired:
            del self._conversations[cid]


# Singleton
conversation_store = ConversationStore()