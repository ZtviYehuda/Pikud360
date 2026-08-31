import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Search, Check } from "lucide-react";
import apiClient from "@/config/api.client";

interface Contact {
  id: string | number;
  first_name: string;
  last_name: string;
  rank?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (title: string, description?: string, memberUserIds?: string[]) => Promise<any>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient
        .get("/workforce/employees/chat-contacts")
        .then((res) => {
          setContacts(res.data || []);
        })
        .catch((err) => console.error("Error loading chat contacts:", err));
    }
  }, [isOpen]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setIsSubmitting(true);
      await onCreateGroup(title.trim(), description.trim() || undefined, selectedUserIds);
      setTitle("");
      setDescription("");
      setSelectedUserIds([]);
      onClose();
    } catch (err) {
      // toast shown in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md font-sans p-4 sm:p-6 rounded-t-[2.2rem] rounded-b-none sm:rounded-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            יצירת קבוצה חדשה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Group Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">שם הקבוצה *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="צוות מבצעי צפון"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          {/* Group Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">תיאור הקבוצה (אופציונלי)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מטרת הקבוצה ותיאום..."
              rows={2}
              className="rounded-xl text-xs resize-none"
            />
          </div>

          {/* Members Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">בחירת חברים ({selectedUserIds.length})</Label>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש איש קשר..."
                className="pr-8 pl-3 h-8.5 text-xs rounded-xl bg-muted/40"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 border border-border/40 rounded-xl p-1 bg-muted/20">
              {filteredContacts.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">לא נמצאו אנשי קשר</div>
              ) : (
                filteredContacts.map((contact) => {
                  const uid = String(contact.id);
                  const isChecked = selectedUserIds.includes(uid);
                  return (
                    <button
                      type="button"
                      key={uid}
                      onClick={() => toggleUser(uid)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-right ${
                        isChecked ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center font-bold text-[10px]">
                          {contact.first_name[0]}
                        </div>
                        <div>
                          <span>{contact.first_name} {contact.last_name}</span>
                          {contact.rank && (
                            <span className="text-[10px] text-muted-foreground mr-1.5">({contact.rank})</span>
                          )}
                        </div>
                      </div>
                      {isChecked && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            ביטול
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isSubmitting}
            className="rounded-xl font-bold"
          >
            צור קבוצה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
