import React from "react";
import type { Conversation } from "../types/messaging.types";
import { Users, BellOff, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
}) => {
  const isGroup = conversation.type === "GROUP" || conversation.type === "ORG_UNIT";
  const lastMsg = conversation.last_message;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("he-IL", { month: "numeric", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getAvatarInitials = (name?: string) => {
    if (!name) return isGroup ? "ק" : "מ";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return name.slice(0, 2);
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-right flex items-center gap-3 p-3 rounded-2xl transition-all relative border border-transparent",
        isSelected
          ? "bg-primary/10 border-primary/20 text-foreground font-medium"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm select-none",
            isGroup
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-primary/15 text-primary"
          )}
        >
          {isGroup ? (
            <Users className="w-5 h-5" />
          ) : (
            getAvatarInitials(conversation.title)
          )}
        </div>

        {!isGroup && conversation.members?.some((m) => m.is_online) && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={cn(
              "text-sm font-semibold truncate",
              isSelected ? "text-foreground font-bold" : "text-foreground/90"
            )}
          >
            {conversation.title || (isGroup ? "קבוצה" : "שיחה ישירה")}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatTime(conversation.updated_at || lastMsg?.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground truncate">
            {lastMsg?.status === "READ" && (
              <CheckCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            {lastMsg?.status === "DELIVERED" && (
              <CheckCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            {lastMsg?.status === "SENT" && (
              <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">
              {lastMsg ? (
                <>
                  {isGroup && lastMsg.sender_name && (
                    <span className="font-semibold text-foreground/80 ml-1">
                      {lastMsg.sender_name.split(" ")[0]}:
                    </span>
                  )}
                  {lastMsg.content}
                </>
              ) : (
                <span className="italic">אין הודעות בשיחה</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.is_muted && (
              <BellOff className="w-3.5 h-3.5 text-muted-foreground/60" />
            )}
            {conversation.unread_count > 0 && (
              <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-xs">
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
