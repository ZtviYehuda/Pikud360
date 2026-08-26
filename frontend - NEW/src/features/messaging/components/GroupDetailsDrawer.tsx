import React from "react";
import type { Conversation, ConversationMember } from "../types/messaging.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, User, BellOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GroupDetailsDrawerProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  if (!conversation) return null;
  const isGroup = conversation.type === "GROUP" || conversation.type === "ORG_UNIT";

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col font-sans" dir="rtl">
        <DialogHeader className="p-6 border-b border-border/40 text-right">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {isGroup ? <Users className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
            {isGroup ? "פרטי קבוצה" : "פרטי שיחה"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/40 border border-border/40">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-3">
              {isGroup ? <Users className="w-8 h-8" /> : conversation.title.slice(0, 2)}
            </div>
            <h3 className="text-base font-bold text-foreground">{conversation.title}</h3>
            {conversation.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{conversation.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-bold">
                {isGroup ? `${conversation.members?.length || 0} חברים` : "שיחה ישירה"}
              </Badge>
              {conversation.is_muted && (
                <Badge variant="outline" className="text-[11px] gap-1 text-muted-foreground">
                  <BellOff className="w-3 h-3" /> מושתק
                </Badge>
              )}
            </div>
          </div>

          {isGroup && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  חברי הקבוצה ({conversation.members?.length || 0})
                </h4>
              </div>

              <div className="space-y-1 divide-y divide-border/20 border border-border/40 rounded-2xl p-2 bg-card">
                {conversation.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center font-bold text-xs">
                        {(member.user_name || "משתמש").slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {member.user_name || "משתמש"}
                          {member.role === "ADMIN" && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 text-primary border-primary/30">
                              מנהל
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {member.user_role_title || "מפקד"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {member.is_online && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="פעיל כעת" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
