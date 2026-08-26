import React, { useState } from "react";
import type { SearchResults } from "../types/messaging.types";
import { messagingApi } from "../api/messagingApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convId: string) => void;
}

export const MessageSearchModal: React.FC<MessageSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await messagingApi.search(val.trim());
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (convId: string) => {
    onSelectConversation(convId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg font-sans max-h-[85vh] flex flex-col p-0" dir="rtl">
        <DialogHeader className="p-4 border-b border-border/40 text-right">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            חיפוש גלובלי בהודעות ובקבצים
          </DialogTitle>
          <div className="relative mt-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="חפש תוכן הודעה, שם קבוצה, או קובץ..."
              className="pr-9 pl-3 h-10 rounded-xl text-xs bg-muted/40"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
              מחפש בשיחות ובהודעות...
            </div>
          ) : !results || (!results.conversations.length && !results.messages.length && !results.files.length) ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {query ? "לא נמצאו תוצאות לחיפוש זה" : "הקלד מילת חיפוש למציאת הודעות וקבצים"}
            </div>
          ) : (
            <>
              {results.conversations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    שיחות וקבוצות ({results.conversations.length})
                  </span>
                  <div className="space-y-1">
                    {results.conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect(c.id)}
                        className="w-full text-right flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-xs border border-border/40"
                      >
                        <div className="flex items-center gap-2">
                          <MessagesSquare className="w-4 h-4 text-primary" />
                          <span className="font-bold">{c.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.type === "DIRECT" ? "שיחה ישירה" : "קבוצה"}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.messages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    הודעות שנמצאו ({results.messages.length})
                  </span>
                  <div className="space-y-1">
                    {results.messages.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelect(m.conversation_id)}
                        className="w-full text-right p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-xs border border-border/40 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-primary">{m.sender_name}</span>
                          <span className="text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{m.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.files.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    קבצים ומסמכים ({results.files.length})
                  </span>
                  <div className="space-y-1">
                    {results.files.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleSelect(f.conversation_id)}
                        className="w-full text-right flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-xs border border-border/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-bold truncate">{f.filename}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {(f.file_size / 1024).toFixed(1)} KB
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
