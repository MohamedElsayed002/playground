import unicodedata
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ShopAssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: UUID | None = None

    model_config = ConfigDict(str_strip_whitespace=True)

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
