import React from "react";
import type { Message } from "../types/messaging.types";
import { useAuthContext } from "@/context/AuthContext";
import {
  Check,
  CheckCheck,
  Reply,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Download,
  CornerUpLeft,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isGroup: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuthContext();
  const isMine =
    String(message.sender_id) === String(user?.id) ||
    String(message.sender_id) === String(user?.username);

  const isDeleted = Boolean(message.deleted_at);

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col my-1 max-w-[85%] sm:max-w-[70%] transition-all",
        isMine ? "self-end items-end" : "self-start items-start"
      )}
    >
      {/* Sender name for group chats if not mine */}
      {isGroup && !isMine && message.sender_name && (
        <span className="text-[11px] font-bold text-primary mb-1 px-2 select-none">
          {message.sender_name}
        </span>
      )}

      {/* Bubble Box */}
      <div
        className={cn(
          "relative min-w-[120px] px-4 py-2.5 rounded-2xl text-xs md:text-sm shadow-xs transition-all",
          isDeleted
            ? "bg-muted/40 text-muted-foreground italic border border-border/40"
            : isMine
            ? "bg-primary text-primary-foreground rounded-tl-xs"
            : "bg-card border border-border/60 text-card-foreground rounded-tr-xs"
        )}
      >
        {/* Reply Reference Preview */}
        {message.reply_to_content && !isDeleted && (
          <div
            className={cn(
              "mb-2 p-2 rounded-xl text-xs border-r-3 flex items-start gap-2 select-none",
              isMine
                ? "bg-primary-foreground/15 border-primary-foreground/50 text-primary-foreground/90"
                : "bg-muted/80 border-primary text-muted-foreground"
            )}
          >
            <CornerUpLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-75" />
            <div className="min-w-0 flex-1">
              {message.reply_to_sender_name && (
                <div className="font-bold text-[10px] mb-0.5 opacity-90">
                  {message.reply_to_sender_name}
                </div>
              )}
              <div className="truncate text-[11px] leading-tight">{message.reply_to_content}</div>
            </div>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && !isDeleted && (
          <div className="space-y-1.5 mb-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.storage_path}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl text-xs border transition-all",
                  isMine
                    ? "bg-primary-foreground/15 border-primary-foreground/20 hover:bg-primary-foreground/25 text-primary-foreground"
                    : "bg-muted/50 border-border/40 hover:bg-muted text-foreground"
                )}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{att.filename}</div>
                  <div className="text-[10px] opacity-75">
                    {(att.file_size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 shrink-0 opacity-75" />
              </a>
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className="leading-relaxed whitespace-pre-wrap break-words text-right">
          {message.content}
        </div>

        {/* Meta Info (Time + Status) */}
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none",
            isMine ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {message.edited_at && !isDeleted && (
            <span className="opacity-80 font-medium">נערך</span>
          )}

          <span>{formatTime(message.created_at)}</span>

          {isMine && !isDeleted && (
            <span className="shrink-0">
              {message.status === "READ" ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-200 dark:text-sky-300" />
              ) : message.status === "DELIVERED" ? (
                <CheckCheck className="w-3.5 h-3.5 opacity-80" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-80" />
              )}
            </span>
          )}
        </div>

        {/* Hover Actions Menu */}
        {!isDeleted && (
          <div
            className={cn(
              "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isMine ? "-left-8" : "-right-8"
            )}
          >
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-6.5 h-6.5 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground shadow-xs flex items-center justify-center">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align={isMine ? "start" : "end"} className="w-36 p-1 text-xs space-y-0.5 font-sans" dir="rtl">
                <button
                  onClick={() => onReply(message)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-right transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  השב
                </button>

                {isMine && (
                  <button
                    onClick={() => onEdit(message)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-right transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    ערוך
                  </button>
                )}

                {isMine && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-destructive/10 text-destructive text-right transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
