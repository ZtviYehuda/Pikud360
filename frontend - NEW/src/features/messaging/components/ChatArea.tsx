import React, { useState } from "react";
import type { Conversation, Message } from "../types/messaging.types";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { GroupDetailsDrawer } from "./GroupDetailsDrawer";
import { MessageSearchModal } from "./MessageSearchModal";
import { EmptyChatState } from "./EmptyStates";
import { useConversation } from "../hooks/useConversation";

interface ChatAreaProps {
  conversationId: string | null;
  onConversationUpdated: () => void;
  onBack?: () => void;
  onSelectConversation: (id: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversationId,
  onConversationUpdated,
  onBack,
  onSelectConversation,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    replyTarget,
    setReplyTarget,
    editingMessage,
    setEditingMessage,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    triggerTyping,
  } = useConversation(conversationId, onConversationUpdated);

  if (!conversationId || !conversation) {
    return (
      <div className="flex-1 h-full bg-card/20 flex flex-col items-center justify-center">
        <EmptyChatState />
      </div>
    );
  }

  const isGroup = conversation.type === "GROUP" || conversation.type === "ORG_UNIT";

  return (
    <div className="flex-1 flex flex-col h-full bg-card/20 overflow-hidden relative">
      <ChatHeader
        conversation={conversation}
        typingUsers={typingUsers}
        onOpenDetails={() => setIsDetailsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onBack={onBack}
      />

      <MessageList
        messages={messages}
        isGroup={isGroup}
        onReply={(msg) => setReplyTarget(msg)}
        onEdit={(msg) => setEditingMessage(msg)}
        onDelete={deleteMessage}
        isLoading={isLoading}
      />

      <MessageComposer
        onSendMessage={sendMessage}
        onEditMessage={editMessage}
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onTyping={triggerTyping}
        isSending={isSending}
      />

      <GroupDetailsDrawer
        conversation={conversation}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <MessageSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectConversation={onSelectConversation}
      />
    </div>
  );
};
