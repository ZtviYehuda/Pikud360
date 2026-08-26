import React from "react";
import type { Conversation } from "../types/messaging.types";
import { Users, Info, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  conversation: Conversation;
  typingUsers: string[];
  onOpenDetails: () => void;
  onOpenSearch: () => void;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  typingUsers,
  onOpenDetails,
  onOpenSearch,
  onBack,
}) => {
  const isGroup = conversation.type === "GROUP" || conversation.type === "ORG_UNIT";

  const getSubStatus = () => {
    if (typingUsers.length > 0) {
      return <span className="text-primary font-medium animate-pulse">מקליד/ה...</span>;
    }
    if (isGroup) {
      return <span>{conversation.members?.length || 0} חברים</span>;
    }
    const onlineMember = conversation.members?.find((m) => m.is_online);
    if (onlineMember) {
      return <span className="text-emerald-600 dark:text-emerald-400 font-medium">פעיל/ה כעת</span>;
    }
    return <span>לא פעיל/ה</span>;
  };

  const getInitials = (title?: string) => {
    if (!title) return isGroup ? "ק" : "מ";
    const parts = title.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return title.slice(0, 2);
  };

  return (
    <div className="h-16 px-4 border-b border-border/40 bg-card/60 backdrop-blur-xs flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden h-9 w-9 rounded-xl shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0",
            isGroup
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-primary/15 text-primary"
          )}
        >
          {isGroup ? <Users className="w-5 h-5" /> : getInitials(conversation.title)}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate leading-tight">
            {conversation.title}
          </h3>
          <div className="text-[11px] text-muted-foreground truncate">{getSubStatus()}</div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSearch}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenDetails}
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
