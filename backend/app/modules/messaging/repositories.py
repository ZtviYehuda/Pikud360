import logging
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from app.database.connection import get_db_connection
from app.modules.messaging.models import (
    ConversationType, MemberRole, MessageType, MessageDeliveryStatus,
    ConversationModel, ConversationMemberModel, MessageModel, MessageAttachmentModel
)

logger = logging.getLogger("matzevet.modules.messaging.repositories")


class MessagingRepository:

    def _get_user_display(self, cur, user_id: str) -> Dict[str, Any]:
        """Fetch display name, avatar, and role for a user."""
        try:
            cur.execute("""
                SELECT 
                    u.id, 
                    u.username,
                    COALESCE(e.first_name, u.username, 'משתמש') as first_name,
                    COALESCE(e.last_name, '') as last_name,
                    e.rank
                FROM security.users u
                LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                WHERE u.id::text = %s OR u.username = %s;
            """, (str(user_id), str(user_id)))
            row = cur.fetchone()
            if row:
                name = f"{row[2]} {row[3]}".strip()
                return {"id": str(row[0]), "name": name, "rank": row[4] or "מפקד", "phone": None}
        except Exception as e:
            logger.error(f"Error fetching user display {user_id}: {e}")
        return {"id": str(user_id), "name": "משתמש", "rank": "משתמש", "phone": None}

    def get_direct_conversation(self, tenant_id: str, user_a: str, user_b: str) -> Optional[str]:
        """Finds existing 1-on-1 direct conversation between two users."""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT c.id
                    FROM core.conversations c
                    JOIN core.conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id::text = %s
                    JOIN core.conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id::text = %s
                    WHERE c.type = 'DIRECT' AND c.tenant_id = %s
                    LIMIT 1;
                """, (str(user_a), str(user_b), str(tenant_id)))
                row = cur.fetchone()
                if row:
                    return str(row[0])
        return None

    def create_conversation(
        self, tenant_id: str, conv_type: Any, created_by: str,
        title: Optional[str] = None, description: Optional[str] = None, avatar_url: Optional[str] = None,
        member_ids: Optional[List[str]] = None, admin_ids: Optional[List[str]] = None
    ) -> str:
        """Creates a conversation and adds members."""
        type_val = conv_type.value if hasattr(conv_type, "value") else str(conv_type)
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO core.conversations (
                        tenant_id, type, title, description, avatar_url, created_by, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id;
                """, (str(tenant_id), type_val, title, description, avatar_url, str(created_by)))
                conv_id = str(cur.fetchone()[0])

                # Ensure creator is included
                all_members = set(member_ids or [])
                all_members.add(str(created_by))
                admins = set(admin_ids or [])
                admins.add(str(created_by))

                for mid in all_members:
                    role = "ADMIN" if mid in admins else "MEMBER"
                    cur.execute("""
                        INSERT INTO core.conversation_members (
                            conversation_id, user_id, role, joined_at
                        ) VALUES (%s, %s, %s, NOW())
                        ON CONFLICT (conversation_id, user_id) DO NOTHING;
                    """, (conv_id, str(mid), role))

                    cur.execute("""
                        INSERT INTO core.conversation_user_states (
                            conversation_id, user_id, unread_count, updated_at
                        ) VALUES (%s, %s, 0, NOW())
                        ON CONFLICT (conversation_id, user_id) DO NOTHING;
                    """, (conv_id, str(mid)))

                conn.commit()
                return conv_id

    def list_conversations_for_user(self, tenant_id: str, user_id: str) -> List[ConversationModel]:
        """Lists all conversations for the user with calculated metadata, members, and last message."""
        results: List[ConversationModel] = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Fetch all aliases for current user
                cur.execute("""
                    SELECT u.id, u.username, e.id, e.employee_number
                    FROM security.users u
                    LEFT JOIN workforce.employees e ON e.user_id = u.id OR e.employee_number::text = u.username
                    WHERE u.id::text = %s OR u.username = %s;
                """, (str(user_id), str(user_id)))
                user_aliases = {str(user_id).lower()}
                for r in cur.fetchall():
                    for item in r:
                        if item:
                            user_aliases.add(str(item).lower())

                # 1. Fetch conversations joined by user
                cur.execute("""
                    SELECT 
                        c.id, c.tenant_id, c.type, c.title, c.description, c.avatar_url,
                        c.created_by, c.created_at, c.updated_at, c.is_archived,
                        COALESCE(s.unread_count, 0) as unread_count,
                        COALESCE(s.is_muted, FALSE) as is_muted,
                        COALESCE(s.is_pinned, FALSE) as is_pinned,
                        s.last_read_message_id
                    FROM core.conversations c
                    JOIN core.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id::text = %s
                    LEFT JOIN core.conversation_user_states s ON s.conversation_id = c.id AND s.user_id::text = %s
                    WHERE c.tenant_id = %s AND cm.left_at IS NULL
                    ORDER BY COALESCE(s.is_pinned, FALSE) DESC, c.updated_at DESC;
                """, (str(user_id), str(user_id), str(tenant_id)))
                conv_rows = cur.fetchall()

                for row in conv_rows:
                    cid = str(row[0])
                    ctype = ConversationType(row[2])
                    raw_title = row[3]
                    raw_desc = row[4]
                    raw_avatar = row[5]

                    # Fetch members
                    cur.execute("""
                        SELECT m.id, m.conversation_id, m.user_id, m.role, m.joined_at, m.left_at
                        FROM core.conversation_members m
                        WHERE m.conversation_id = %s AND m.left_at IS NULL;
                    """, (cid,))
                    mem_rows = cur.fetchall()

                    members: List[ConversationMemberModel] = []
                    direct_other_name = None
                    for mrow in mem_rows:
                        mid = str(mrow[2])
                        udisplay = self._get_user_display(cur, mid)
                        members.append(ConversationMemberModel(
                            id=str(mrow[0]),
                            conversation_id=cid,
                            user_id=mid,
                            user_name=udisplay["name"],
                            user_role_title=udisplay["rank"],
                            avatar_url=None,
                            role=MemberRole(mrow[3]),
                            joined_at=mrow[4],
                            left_at=mrow[5],
                            is_online=True
                        ))
                        if ctype == ConversationType.DIRECT and mid.lower() not in user_aliases:
                            direct_other_name = udisplay["name"]

                    display_title = raw_title
                    if ctype == ConversationType.DIRECT:
                        display_title = direct_other_name or raw_title or "שיחה ישירה"
                    elif not display_title:
                        display_title = "קבוצה ללא שם"

                    # Fetch last message
                    cur.execute("""
                        SELECT id, sender_id, content, message_type, status, created_at, edited_at, deleted_at
                        FROM core.messages
                        WHERE conversation_id = %s
                        ORDER BY created_at DESC
                        LIMIT 1;
                    """, (cid,))
                    last_msg_row = cur.fetchone()
                    last_msg = None
                    if last_msg_row:
                        sender_disp = self._get_user_display(cur, str(last_msg_row[1]))
                        content = last_msg_row[2]
                        if last_msg_row[7]:
                            content = "הודעה זו נמחקה"
                        last_msg = MessageModel(
                            id=str(last_msg_row[0]),
                            conversation_id=cid,
                            sender_id=str(last_msg_row[1]),
                            sender_name=sender_disp["name"],
                            content=content,
                            message_type=MessageType(last_msg_row[3]),
                            status=MessageDeliveryStatus(last_msg_row[4]),
                            created_at=last_msg_row[5],
                            edited_at=last_msg_row[6],
                            deleted_at=last_msg_row[7]
                        )

                    results.append(ConversationModel(
                        id=cid,
                        tenant_id=str(row[1]),
                        type=ctype,
                        title=display_title,
                        description=raw_desc,
                        avatar_url=raw_avatar,
                        created_by=str(row[6]) if row[6] else None,
                        created_at=row[7],
                        updated_at=row[8],
                        is_archived=bool(row[9]),
                        unread_count=int(row[10] or 0),
                        is_muted=bool(row[11]),
                        is_pinned=bool(row[12]),
                        last_read_message_id=str(row[13]) if row[13] else None,
                        last_message=last_msg,
                        members=members
                    ))

        return results

    def get_conversation_by_id(self, conv_id: str, user_id: str) -> Optional[ConversationModel]:
        """Gets a single conversation with complete metadata if user is a member."""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        c.id, c.tenant_id, c.type, c.title, c.description, c.avatar_url,
                        c.created_by, c.created_at, c.updated_at, c.is_archived,
                        COALESCE(s.unread_count, 0) as unread_count,
                        COALESCE(s.is_muted, FALSE) as is_muted,
                        COALESCE(s.is_pinned, FALSE) as is_pinned,
                        s.last_read_message_id
                    FROM core.conversations c
                    JOIN core.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id::text = %s
                    LEFT JOIN core.conversation_user_states s ON s.conversation_id = c.id AND s.user_id::text = %s
                    WHERE c.id = %s AND cm.left_at IS NULL;
                """, (str(user_id), str(user_id), str(conv_id)))
                row = cur.fetchone()
                if not row:
                    return None

                cid = str(row[0])
                ctype = ConversationType(row[2])

                # Fetch members
                cur.execute("""
                    SELECT m.id, m.conversation_id, m.user_id, m.role, m.joined_at, m.left_at
                    FROM core.conversation_members m
                    WHERE m.conversation_id = %s AND m.left_at IS NULL;
                """, (cid,))
                mem_rows = cur.fetchall()
                members: List[ConversationMemberModel] = []
                direct_other_name = None
                for mrow in mem_rows:
                    mid = str(mrow[2])
                    udisplay = self._get_user_display(cur, mid)
                    members.append(ConversationMemberModel(
                        id=str(mrow[0]),
                        conversation_id=cid,
                        user_id=mid,
                        user_name=udisplay["name"],
                        user_role_title=udisplay["rank"],
                        avatar_url=None,
                        role=MemberRole(mrow[3]),
                        joined_at=mrow[4],
                        left_at=mrow[5]
                    ))
                    if ctype == ConversationType.DIRECT and mid != str(user_id):
                        direct_other_name = udisplay["name"]

                display_title = row[3]
                if ctype == ConversationType.DIRECT:
                    display_title = direct_other_name or display_title or "שיחה ישירה"

                return ConversationModel(
                    id=cid,
                    tenant_id=str(row[1]),
                    type=ctype,
                    title=display_title,
                    description=row[4],
                    avatar_url=row[5],
                    created_by=str(row[6]) if row[6] else None,
                    created_at=row[7],
                    updated_at=row[8],
                    is_archived=bool(row[9]),
                    unread_count=int(row[10] or 0),
                    is_muted=bool(row[11]),
                    is_pinned=bool(row[12]),
                    last_read_message_id=str(row[13]) if row[13] else None,
                    members=members
                )

    def get_messages(self, conv_id: str, limit: int = 50, offset: int = 0) -> List[MessageModel]:
        """Fetches paginated messages for a conversation including replies, attachments, and reads."""
        messages: List[MessageModel] = []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        m.id, m.conversation_id, m.sender_id, m.content, m.message_type,
                        m.status, m.reply_to_message_id, m.forwarded_from_message_id,
                        m.created_at, m.edited_at, m.deleted_at, m.deleted_by,
                        r.content as reply_content, r.sender_id as reply_sender_id
                    FROM core.messages m
                    LEFT JOIN core.messages r ON r.id = m.reply_to_message_id
                    WHERE m.conversation_id = %s
                    ORDER BY m.created_at ASC
                    LIMIT %s OFFSET %s;
                """, (str(conv_id), limit, offset))
                rows = cur.fetchall()

                for row in rows:
                    msg_id = str(row[0])
                    sender_disp = self._get_user_display(cur, str(row[2]))
                    reply_sender_name = None
                    if row[13]:
                        reply_sender_name = self._get_user_display(cur, str(row[13]))["name"]

                    # Fetch attachments
                    cur.execute("""
                        SELECT id, filename, mime_type, file_size, storage_path, thumbnail_path, created_at
                        FROM core.message_attachments
                        WHERE message_id = %s;
                    """, (msg_id,))
                    att_rows = cur.fetchall()
                    attachments = [
                        MessageAttachmentModel(
                            id=str(a[0]), message_id=msg_id, filename=a[1],
                            mime_type=a[2], file_size=a[3], storage_path=a[4],
                            thumbnail_path=a[5], created_at=a[6]
                        ) for a in att_rows
                    ]

                    # Fetch read users
                    cur.execute("""
                        SELECT user_id FROM core.message_reads WHERE message_id = %s;
                    """, (msg_id,))
                    read_users = [str(r[0]) for r in cur.fetchall()]

                    content = row[3]
                    if row[10]:
                        content = "הודעה זו נמחקה"

                    messages.append(MessageModel(
                        id=msg_id,
                        conversation_id=str(row[1]),
                        sender_id=str(row[2]),
                        sender_name=sender_disp["name"],
                        content=content,
                        message_type=MessageType(row[4]),
                        status=MessageDeliveryStatus(row[5]),
                        reply_to_message_id=str(row[6]) if row[6] else None,
                        reply_to_content=row[12] if row[12] and not row[10] else None,
                        reply_to_sender_name=reply_sender_name,
                        forwarded_from_message_id=str(row[7]) if row[7] else None,
                        created_at=row[8],
                        edited_at=row[9],
                        deleted_at=row[10],
                        deleted_by=str(row[11]) if row[11] else None,
                        attachments=attachments,
                        read_by_users=read_users
                    ))

        return messages

    def create_message(
        self, conv_id: str, sender_id: str, content: str,
        message_type: Any = MessageType.TEXT,
        reply_to_id: Optional[str] = None, forwarded_from_id: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> MessageModel:
        """Inserts a message and increments unread count for other members."""
        mtype_val = message_type.value if hasattr(message_type, "value") else str(message_type)
        mtype_enum = MessageType(mtype_val) if mtype_val in [e.value for e in MessageType] else MessageType.TEXT
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Insert message
                cur.execute("""
                    INSERT INTO core.messages (
                        conversation_id, sender_id, content, message_type, status,
                        reply_to_message_id, forwarded_from_message_id, created_at
                    ) VALUES (%s, %s, %s, %s, 'SENT', %s, %s, NOW())
                    RETURNING id, created_at;
                """, (str(conv_id), str(sender_id), content.strip(), mtype_val, reply_to_id, forwarded_from_id))
                row = cur.fetchone()
                msg_id = str(row[0])
                created_at = row[1]

                # 2. Insert attachments if any
                saved_attachments: List[MessageAttachmentModel] = []
                if attachments:
                    for att in attachments:
                        cur.execute("""
                            INSERT INTO core.message_attachments (
                                message_id, filename, mime_type, file_size, storage_path, thumbnail_path, created_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
                            RETURNING id, created_at;
                        """, (msg_id, att["filename"], att["mime_type"], att["file_size"], att["storage_path"], att.get("thumbnail_path")))
                        arow = cur.fetchone()
                        saved_attachments.append(MessageAttachmentModel(
                            id=str(arow[0]),
                            message_id=msg_id,
                            filename=att["filename"],
                            mime_type=att["mime_type"],
                            file_size=att["file_size"],
                            storage_path=att["storage_path"],
                            thumbnail_path=att.get("thumbnail_path"),
                            created_at=arow[1]
                        ))

                # 3. Update conversation updated_at
                cur.execute("""
                    UPDATE core.conversations SET updated_at = NOW() WHERE id = %s;
                """, (str(conv_id),))

                # 4. Increment unread count for other members
                cur.execute("""
                    UPDATE core.conversation_user_states
                    SET unread_count = unread_count + 1, updated_at = NOW()
                    WHERE conversation_id = %s AND user_id::text != %s;
                """, (str(conv_id), str(sender_id)))

                # 5. Mark sender as read
                cur.execute("""
                    INSERT INTO core.message_reads (message_id, user_id, read_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (message_id, user_id) DO NOTHING;
                """, (msg_id, str(sender_id)))

                conn.commit()

                sender_disp = self._get_user_display(cur, str(sender_id))
                return MessageModel(
                    id=msg_id,
                    conversation_id=str(conv_id),
                    sender_id=str(sender_id),
                    sender_name=sender_disp["name"],
                    content=content.strip(),
                    message_type=mtype_enum,
                    status=MessageDeliveryStatus.SENT,
                    reply_to_message_id=reply_to_id,
                    forwarded_from_message_id=forwarded_from_id,
                    created_at=created_at,
                    attachments=saved_attachments,
                    read_by_users=[str(sender_id)]
                )

    def mark_conversation_as_read(self, conv_id: str, user_id: str, last_message_id: Optional[str] = None):
        """Resets unread count, marks message_reads, and updates state."""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Reset user state
                cur.execute("""
                    UPDATE core.conversation_user_states
                    SET unread_count = 0, last_read_message_id = COALESCE(%s, last_read_message_id), updated_at = NOW()
                    WHERE conversation_id = %s AND user_id::text = %s;
                """, (last_message_id, str(conv_id), str(user_id)))

                # 2. Mark reads for all unread messages in conversation for this user
                cur.execute("""
                    INSERT INTO core.message_reads (message_id, user_id, read_at)
                    SELECT m.id, %s, NOW()
                    FROM core.messages m
                    WHERE m.conversation_id = %s AND NOT EXISTS (
                        SELECT 1 FROM core.message_reads mr WHERE mr.message_id = m.id AND mr.user_id::text = %s
                    )
                    ON CONFLICT (message_id, user_id) DO NOTHING;
                """, (str(user_id), str(conv_id), str(user_id)))

                # 3. Update status of messages to READ if all active members have read
                cur.execute("""
                    UPDATE core.messages m
                    SET status = 'READ'
                    WHERE m.conversation_id = %s AND m.status != 'READ'
                    AND NOT EXISTS (
                        SELECT 1 FROM core.conversation_members cm
                        WHERE cm.conversation_id = %s AND cm.left_at IS NULL
                        AND NOT EXISTS (
                            SELECT 1 FROM core.message_reads mr WHERE mr.message_id = m.id AND mr.user_id = cm.user_id
                        )
                    );
                """, (str(conv_id), str(conv_id)))

                conn.commit()

    def edit_message(self, msg_id: str, user_id: str, new_content: str) -> Optional[MessageModel]:
        """Edits an existing message if user is the sender."""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE core.messages
                    SET content = %s, edited_at = NOW()
                    WHERE id = %s AND sender_id::text = %s AND deleted_at IS NULL
                    RETURNING conversation_id, sender_id, message_type, status, created_at, edited_at;
                """, (new_content.strip(), str(msg_id), str(user_id)))
                row = cur.fetchone()
                if row:
                    conn.commit()
                    sender_disp = self._get_user_display(cur, str(row[1]))
                    return MessageModel(
                        id=str(msg_id),
                        conversation_id=str(row[0]),
                        sender_id=str(row[1]),
                        sender_name=sender_disp["name"],
                        content=new_content.strip(),
                        message_type=MessageType(row[2]),
                        status=MessageDeliveryStatus(row[3]),
                        created_at=row[4],
                        edited_at=row[5]
                    )
        return None

    def soft_delete_message(self, msg_id: str, user_id: str) -> bool:
        """Soft deletes a message by setting deleted_at and deleted_by."""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE core.messages
                    SET deleted_at = NOW(), deleted_by = %s
                    WHERE id = %s AND (sender_id::text = %s OR EXISTS (
                        SELECT 1 FROM core.conversation_members cm
                        WHERE cm.conversation_id = core.messages.conversation_id AND cm.user_id::text = %s AND cm.role = 'ADMIN'
                    ));
                """, (str(user_id), str(msg_id), str(user_id), str(user_id)))
                conn.commit()
                return cur.rowcount > 0

    def search_all(self, tenant_id: str, user_id: str, query: str) -> Dict[str, Any]:
        """Searches across user's conversations, messages, files, and reachable contacts."""
        clean_q = f"%{query.strip()}%"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Search conversations
                cur.execute("""
                    SELECT c.id, c.title, c.type, c.description
                    FROM core.conversations c
                    JOIN core.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id::text = %s
                    WHERE c.tenant_id = %s AND (c.title ILIKE %s OR c.description ILIKE %s);
                """, (str(user_id), str(tenant_id), clean_q, clean_q))
                convs = [{"id": str(r[0]), "title": r[1] or "שיחה", "type": r[2], "description": r[3]} for r in cur.fetchall()]

                # 2. Search messages
                cur.execute("""
                    SELECT m.id, m.conversation_id, m.content, m.created_at, m.sender_id
                    FROM core.messages m
                    JOIN core.conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id::text = %s
                    WHERE m.content ILIKE %s AND m.deleted_at IS NULL
                    ORDER BY m.created_at DESC LIMIT 20;
                """, (str(user_id), clean_q))
                msgs = []
                for r in cur.fetchall():
                    sdisp = self._get_user_display(cur, str(r[4]))
                    msgs.append({
                        "id": str(r[0]), "conversation_id": str(r[1]),
                        "content": r[2], "created_at": r[3].isoformat(),
                        "sender_name": sdisp["name"]
                    })

                # 3. Search files/attachments
                cur.execute("""
                    SELECT a.id, a.message_id, a.filename, a.mime_type, a.file_size, a.storage_path, m.conversation_id
                    FROM core.message_attachments a
                    JOIN core.messages m ON m.id = a.message_id
                    JOIN core.conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id::text = %s
                    WHERE a.filename ILIKE %s;
                """, (str(user_id), clean_q))
                files = [{
                    "id": str(r[0]), "message_id": str(r[1]), "filename": r[2],
                    "mime_type": r[3], "file_size": r[4], "storage_path": r[5], "conversation_id": str(r[6])
                } for r in cur.fetchall()]

                return {"conversations": convs, "messages": msgs, "files": files}
