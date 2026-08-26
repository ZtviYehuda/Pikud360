import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Set
from app.modules.messaging.models import (
    ConversationType, MemberRole, MessageType, ConversationModel, MessageModel
)
from app.modules.messaging.repositories import MessagingRepository

logger = logging.getLogger("matzevet.modules.messaging.services")


class MessagingService:
    def __init__(self, repo: Optional[MessagingRepository] = None):
        self.repo = repo or MessagingRepository()
        # Ephemeral presence & typing cache in memory (no continuous DB writes)
        self._presence_cache: Dict[str, Dict[str, Any]] = {}
        self._typing_cache: Dict[str, Dict[str, float]] = {}  # conv_id -> { user_id: timestamp }

    def set_user_presence(self, user_id: str, status: str, custom_status: Optional[str] = None):
        self._presence_cache[str(user_id)] = {
            "status": status,
            "custom_status": custom_status,
            "last_seen": datetime.now(timezone.utc).isoformat()
        }

    def get_user_presence(self, user_id: str) -> Dict[str, Any]:
        return self._presence_cache.get(str(user_id), {
            "status": "online",
            "custom_status": None,
            "last_seen": datetime.now(timezone.utc).isoformat()
        })

    def set_typing_state(self, conv_id: str, user_id: str, is_typing: bool):
        conv_key = str(conv_id)
        if conv_key not in self._typing_cache:
            self._typing_cache[conv_key] = {}
        
        if is_typing:
            self._typing_cache[conv_key][str(user_id)] = datetime.now(timezone.utc).timestamp()
        else:
            self._typing_cache[conv_key].pop(str(user_id), None)

    def get_typing_users(self, conv_id: str, exclude_user_id: Optional[str] = None) -> List[str]:
        conv_key = str(conv_id)
        users = []
        if conv_key in self._typing_cache:
            now = datetime.now(timezone.utc).timestamp()
            for uid, ts in list(self._typing_cache[conv_key].items()):
                if now - ts < 4.0:  # Valid for 4s
                    if not exclude_user_id or str(uid) != str(exclude_user_id):
                        users.append(uid)
                else:
                    self._typing_cache[conv_key].pop(uid, None)
        return users

    def get_or_create_direct(self, tenant_id: str, current_user_id: str, target_user_id: str, initial_msg: Optional[str] = None) -> ConversationModel:
        # Check existing
        existing_id = self.repo.get_direct_conversation(tenant_id, current_user_id, target_user_id)
        if existing_id:
            if initial_msg and initial_msg.strip():
                self.repo.create_message(existing_id, current_user_id, initial_msg.strip())
            conv = self.repo.get_conversation_by_id(existing_id, current_user_id)
            if conv:
                return conv

        # Create new direct
        conv_id = self.repo.create_conversation(
            tenant_id=tenant_id,
            conv_type=ConversationType.DIRECT,
            created_by=current_user_id,
            member_ids=[current_user_id, target_user_id],
            admin_ids=[current_user_id, target_user_id]
        )
        if initial_msg and initial_msg.strip():
            self.repo.create_message(conv_id, current_user_id, initial_msg.strip())

        conv = self.repo.get_conversation_by_id(conv_id, current_user_id)
        return conv

    def create_group(
        self, tenant_id: str, creator_id: str, title: str, description: Optional[str] = None,
        member_ids: Optional[List[str]] = None, initial_msg: Optional[str] = None, avatar_url: Optional[str] = None
    ) -> ConversationModel:
        conv_id = self.repo.create_conversation(
            tenant_id=tenant_id,
            conv_type=ConversationType.GROUP,
            created_by=creator_id,
            title=title,
            description=description,
            avatar_url=avatar_url,
            member_ids=member_ids,
            admin_ids=[creator_id]
        )
        if initial_msg and initial_msg.strip():
            self.repo.create_message(conv_id, creator_id, initial_msg.strip())

        conv = self.repo.get_conversation_by_id(conv_id, creator_id)
        return conv

    def list_conversations(self, tenant_id: str, user_id: str) -> List[ConversationModel]:
        convs = self.repo.list_conversations_for_user(tenant_id, user_id)
        for c in convs:
            for m in c.members:
                pres = self.get_user_presence(m.user_id)
                m.is_online = (pres.get("status") in ["online", "busy", "away"])
        return convs

    def get_messages(self, conv_id: str, user_id: str, limit: int = 50, offset: int = 0) -> List[MessageModel]:
        return self.repo.get_messages(conv_id, limit, offset)

    def send_message(
        self, conv_id: str, sender_id: str, content: str, message_type: MessageType = MessageType.TEXT,
        reply_to_id: Optional[str] = None, forwarded_from_id: Optional[str] = None, attachments: Optional[List[Dict[str, Any]]] = None
    ) -> MessageModel:
        msg = self.repo.create_message(
            conv_id=conv_id, sender_id=sender_id, content=content, message_type=message_type,
            reply_to_id=reply_to_id, forwarded_from_id=forwarded_from_id, attachments=attachments
        )
        self.set_typing_state(conv_id, sender_id, False)
        return msg

    def edit_message(self, msg_id: str, user_id: str, new_content: str) -> Optional[MessageModel]:
        return self.repo.edit_message(msg_id, user_id, new_content)

    def delete_message(self, msg_id: str, user_id: str) -> bool:
        return self.repo.soft_delete_message(msg_id, user_id)

    def mark_read(self, conv_id: str, user_id: str, last_message_id: Optional[str] = None):
        self.repo.mark_conversation_as_read(conv_id, user_id, last_message_id)

    def search(self, tenant_id: str, user_id: str, query: str) -> Dict[str, Any]:
        return self.repo.search_all(tenant_id, user_id, query)
