import React from "react";
import type { Conversation } from "../types/messaging.types";
import { ConversationItem } from "./ConversationItem";
import { EmptyConversationListState, EmptySearchState } from "./EmptyStates";
import { Search, Plus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: "ALL" | "UNREAD" | "DIRECT" | "GROUP";
  onFilterChange: (filter: "ALL" | "UNREAD" | "DIRECT" | "GROUP") => void;
  onOpenCreateGroup: () => void;
  onOpenSearchModal: () => void;
  isLoading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onOpenCreateGroup,
  onOpenSearchModal,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border/40 select-none">
      <div className="p-4 border-b border-border/40 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">הודעות</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateGroup}
              className="h-8.5 px-3 rounded-xl gap-1.5 text-xs font-bold shadow-xs border-border/60 hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5" />
              קבוצה חדשה
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש שיחה או איש קשר..."
            className="pr-9 pl-4 h-9.5 rounded-xl text-xs bg-muted/40 border-border/40 focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/30">
          {(["ALL", "UNREAD", "DIRECT", "GROUP"] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => onFilterChange(filterKey)}
              className={cn(
                "flex-1 py-1 text-[11px] font-bold rounded-lg transition-all",
                activeFilter === filterKey
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filterKey === "ALL" && "הכל"}
              {filterKey === "UNREAD" && "לא נקראו"}
              {filterKey === "DIRECT" && "ישיר"}
              {filterKey === "GROUP" && "קבוצות"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
        {isLoading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-muted/80 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted/80 rounded w-1/3" />
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          searchQuery ? (
            <EmptySearchState query={searchQuery} />
          ) : (
            <EmptyConversationListState onCreateGroup={onOpenCreateGroup} />
          )
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversationId === conv.id}
              onSelect={() => onSelectConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
