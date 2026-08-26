from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class ConversationType(str, Enum):
    DIRECT = "DIRECT"
    GROUP = "GROUP"
    ORG_UNIT = "ORG_UNIT"


class MemberRole(str, Enum):
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class MessageType(str, Enum):
    TEXT = "TEXT"
    FILE = "FILE"
    IMAGE = "IMAGE"
    SYSTEM = "SYSTEM"


class MessageDeliveryStatus(str, Enum):
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"


class MessageAttachmentModel(BaseModel):
    id: str
    message_id: str
    filename: str
    mime_type: str
    file_size: int
    storage_path: str
    thumbnail_path: Optional[str] = None
    created_at: datetime


class MessageModel(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    content: str
    message_type: MessageType = MessageType.TEXT
    status: MessageDeliveryStatus = MessageDeliveryStatus.SENT
    reply_to_message_id: Optional[str] = None
    reply_to_content: Optional[str] = None
    reply_to_sender_name: Optional[str] = None
    forwarded_from_message_id: Optional[str] = None
    created_at: datetime
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    attachments: List[MessageAttachmentModel] = Field(default_factory=list)
    read_by_users: List[str] = Field(default_factory=list)


class ConversationMemberModel(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    user_name: Optional[str] = None
    user_role_title: Optional[str] = None
    avatar_url: Optional[str] = None
    role: MemberRole = MemberRole.MEMBER
    joined_at: datetime
    left_at: Optional[datetime] = None
    permissions: Dict[str, Any] = Field(default_factory=dict)
    is_online: bool = False
    last_seen: Optional[datetime] = None


class ConversationModel(BaseModel):
    id: str
    tenant_id: str
    type: ConversationType
    title: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False
    is_muted: bool = False
    is_pinned: bool = False
    unread_count: int = 0
    last_read_message_id: Optional[str] = None
    last_message: Optional[MessageModel] = None
    members: List[ConversationMemberModel] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
