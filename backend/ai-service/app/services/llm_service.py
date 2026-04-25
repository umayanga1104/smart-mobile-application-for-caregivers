# app/services/llm_service.py

import json
import logging
from groq import Groq, AsyncGroq, RateLimitError, BadRequestError, AuthenticationError, APITimeoutError, APIConnectionError
from app.config import get_settings
from app.services.prompts import (
    CAREGIVER_CHAT_SYSTEM_PROMPT,
    build_tips_system_prompt,
    build_personalized_system_prompt,
)

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        settings = get_settings()
        if not settings.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY is not set. Please add it to your .env file or environment variables."
            )
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self._model = settings.LLM_MODEL
        self._temperature = settings.LLM_TEMPERATURE
        self._max_tokens = settings.LLM_MAX_TOKENS

    async def chat(self, conversation_history: list[dict], user_health_context: str | None = None) -> str:
        """
        Send conversation to LLM with the caregiver system prompt.

        Args:
            conversation_history: List of {"role": "user"/"assistant", "content": "..."}
            user_health_context: Optional health profile summary for personalization.

        Returns:
            The assistant's reply text.
        """
        system_prompt = build_personalized_system_prompt(user_health_context)

        messages = [
            {"role": "system", "content": system_prompt},
            *conversation_history,
        ]

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=self._temperature,
                max_tokens=self._max_tokens,
            )
            return response.choices[0].message.content

        except RateLimitError:
            logger.warning("Groq rate limit hit")
            raise LLMServiceError("rate_limit", "You're sending messages too fast. Please wait a moment and try again.", 429)
        except BadRequestError as e:
            logger.error(f"Groq bad request: {e}")
            if "context length" in str(e).lower() or "token" in str(e).lower():
                raise LLMServiceError("token_limit", "This conversation has become too long. Please start a new conversation.", 400)
            raise LLMServiceError("bad_request", "Sorry, I couldn't process that message. Please try rephrasing.", 400)
        except AuthenticationError:
            logger.error("Groq API key is invalid or expired")
            raise LLMServiceError("auth_error", "AI service configuration error. Please contact support.", 500)
        except (APITimeoutError, APIConnectionError) as e:
            logger.error(f"Groq connection issue: {e}")
            raise LLMServiceError("connection_error", "AI service is temporarily unavailable. Please try again in a moment.", 503)
        except Exception as e:
            logger.error(f"LLM chat error: {e}")
            raise LLMServiceError("unknown", "Something went wrong. Please try again.", 502)

    async def generate_tips(
        self,
        category: str,
        count: int,
        context: str | None = None,
    ) -> list[dict]:
        """
        Generate caregiving tips as structured JSON.

        Returns:
            List of tip dictionaries.
        """
        system_prompt = build_tips_system_prompt(category, count)

        user_message = f"Generate {count} tips for category: {category}."
        if context:
            user_message += (
                f"\n\nCaregiver's situation for personalization:\n{context}"
            )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.8,
                max_tokens=self._max_tokens,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            parsed = json.loads(raw)

            # Handle both {"tips": [...]} and direct [...] formats
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "tips" in parsed:
                return parsed["tips"]
            else:
                # Try to find the list in the response
                for value in parsed.values():
                    if isinstance(value, list):
                        return value
                return []

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse tips JSON: {e}")
            raise LLMServiceError("parse_error", "Failed to parse tips from AI response.", 502)
        except RateLimitError:
            logger.warning("Groq rate limit hit during tips generation")
            raise LLMServiceError("rate_limit", "Too many requests. Please wait a moment and try again.", 429)
        except BadRequestError as e:
            logger.error(f"Groq bad request during tips: {e}")
            raise LLMServiceError("bad_request", "Failed to generate tips. Please try again.", 400)
        except (APITimeoutError, APIConnectionError) as e:
            logger.error(f"Groq connection issue during tips: {e}")
            raise LLMServiceError("connection_error", "AI service is temporarily unavailable. Please try again.", 503)
        except Exception as e:
            logger.error(f"LLM tips error: {e}")
            raise LLMServiceError("unknown", "Failed to generate tips. Please try again.", 502)


class LLMServiceError(Exception):
    """Custom exception for LLM service failures."""
    def __init__(self, error_code: str, message: str, status_code: int = 502):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# Lazy singleton - initialized on first use
_llm_service_instance = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service singleton."""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance