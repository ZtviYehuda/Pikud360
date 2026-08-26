from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.modules.messaging.models import (
    ConversationType, MemberRole, MessageType, MessageDeliveryStatus,
    MessageModel, ConversationMemberModel, ConversationModel, MessageAttachmentModel
)


class CreateDirectConversationRequest(BaseModel):
    target_user_id: str
    initial_message: Optional[str] = None


class CreateGroupConversationRequest(BaseModel):
    title: str
    description: Optional[str] = None
    member_user_ids: List[str] = Field(default_factory=list)
    initial_message: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_archived: Optional[bool] = None
    is_muted: Optional[bool] = None
    is_pinned: Optional[bool] = None


class AddMemberRequest(BaseModel):
    user_id: str
    role: MemberRole = MemberRole.MEMBER


class AttachmentPayload(BaseModel):
    filename: str
    mime_type: str
    file_size: int
    storage_path: str
    thumbnail_path: Optional[str] = None


class SendMessageRequest(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    reply_to_message_id: Optional[str] = None
    forwarded_from_message_id: Optional[str] = None
    attachments: List[AttachmentPayload] = Field(default_factory=list)


class EditMessageRequest(BaseModel):
    content: str


class MarkConversationReadRequest(BaseModel):
    last_read_message_id: Optional[str] = None


class TypingSignalRequest(BaseModel):
    conversation_id: str
    is_typing: bool


class PresenceUpdateRequest(BaseModel):
    status: str  # online, away, busy, offline
    custom_status: Optional[str] = None
