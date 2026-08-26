import React from "react";
import { MessageSquare, MessagesSquare, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyConversationListState({ onCreateGroup }: { onCreateGroup?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px] text-muted-foreground">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <MessagesSquare className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">אין שיחות פעילות</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-5">
        עדיין לא התחלת שיחות במערכת. בחר איש קשר מהרשימה או פתח קבוצה חדשה.
      </p>
      {onCreateGroup && (
        <Button onClick={onCreateGroup} size="sm" className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          יצירת קבוצה חדשה
        </Button>
      )}
    </div>
  );
}

export function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground select-none">
      <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground/60">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">מרכז ההודעות הפנימי</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        בחר שיחה מהתפריט הצידי כדי לצפות בהודעות, לשלוח קבצים ולהתכתב בזמן אמת.
      </p>
    </div>
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
      <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
        <Search className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-foreground mb-1">לא נמצאו תוצאות</h4>
      <p className="text-xs text-muted-foreground">לא נמצאו שיחות או הודעות התואמות לחיפוש "{query}"</p>
    </div>
  );
}
