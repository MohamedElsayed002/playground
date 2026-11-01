import unicodedata
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# conversation_id: UUID | None = None 
# model_config = ConfigDict(str_strip_whitespace=True)
class ShopAssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: UUID | None = Field(
        default=None,
        description=(
            "Omit this field to start a new conversation. For follow-up messages, "
            "send the conversation_id returned by the previous response."
        ),
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "message": "Hello, can you help me?",
                    "conversation_id": None,
                }
            ]
        },
    )

    @field_validator("message")
    @classmethod
    def reject_control_characters(cls, value: str) -> str:
        if any(
            unicodedata.category(character) == "Cc"
            and character not in "\t\n\r"
            for character in value
        ):
            raise ValueError("Message cannot contain control characters.")
        return value


class ShopAssistantResponse(BaseModel):
    reply: str
    conversation_id: UUID
