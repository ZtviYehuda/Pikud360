import React, { useRef, useEffect } from "react";
import type { Message } from "../types/messaging.types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  isGroup: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDateSeparator = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return "היום";
      }
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return "אתמול";
      }
      return d.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col justify-end min-h-full space-y-1">
        {isLoading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div className="h-12 w-48 bg-muted/60 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <p className="text-xs">אין עדיין הודעות בשיחה זו. שלח הודעה ראשונה!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const isNewDay =
              !prevMsg ||
              new Date(prevMsg.created_at).toDateString() !==
                new Date(msg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {isNewDay && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="px-3 py-1 rounded-full bg-muted/90 text-muted-foreground text-[11px] font-semibold border border-border/40 shadow-2xs">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isGroup={isGroup}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
