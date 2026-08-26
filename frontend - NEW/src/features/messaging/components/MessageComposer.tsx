import React, { useState, useRef, useEffect } from "react";
import type { Message } from "../types/messaging.types";
import { Send, Paperclip, X, CornerUpLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
  onEditMessage?: (msgId: string, content: string) => void;
  replyTarget: Message | null;
  onCancelReply: () => void;
  editingMessage: Message | null;
  onCancelEdit: () => void;
  onTyping: (isTyping: boolean) => void;
  isSending: boolean;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onEditMessage,
  replyTarget,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onTyping,
  isSending,
  disabled,
}) => {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
    }
  }, [editingMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!content.trim() && stagedFiles.length === 0) || isSending || disabled) return;

    if (editingMessage && onEditMessage) {
      onEditMessage(editingMessage.id, content.trim());
      setContent("");
      onCancelEdit();
      return;
    }

    const attachments = stagedFiles.map((file) => ({
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: URL.createObjectURL(file),
    }));

    onSendMessage(content, attachments.length > 0 ? attachments : undefined);
    setContent("");
    setStagedFiles([]);
    onTyping(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setStagedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (idx: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-3 md:p-4 bg-background/95 backdrop-blur-md border-t border-border/40 shrink-0">
      <div className="max-w-4xl mx-auto w-full">
        {/* Reply Banner */}
        {replyTarget && (
          <div className="flex items-center justify-between p-2.5 mb-2 bg-muted/70 border-r-4 border-primary rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <CornerUpLeft className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-bold ml-1 text-foreground">
                  מענה ל-{replyTarget.sender_name || "הודעה"}:
                </span>
                <span className="text-muted-foreground truncate">{replyTarget.content}</span>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Edit Banner */}
        {editingMessage && (
          <div className="flex items-center justify-between p-2.5 mb-2 bg-amber-500/10 border-r-4 border-amber-500 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0 text-amber-600 dark:text-amber-400">
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">עריכת הודעה</span>
            </div>
            <button
              onClick={() => {
                setContent("");
                onCancelEdit();
              }}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Staged File Chips */}
        {stagedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {stagedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted border border-border/60 text-xs"
              >
                <span className="truncate max-w-[160px] font-medium">{file.name}</span>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-end gap-2 bg-card p-1.5 rounded-2xl border border-border/50 shadow-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/80"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="הקלד הודעה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
              rows={1}
              disabled={disabled}
              className="min-h-[42px] max-h-[140px] py-2.5 px-3 text-xs md:text-sm rounded-xl resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60"
            />
          </div>

          <Button
            type="button"
            onClick={handleSend}
            disabled={(!content.trim() && stagedFiles.length === 0) || isSending || disabled}
            className="h-10 px-4 rounded-xl font-bold gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{editingMessage ? "שמור" : "שלח"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
