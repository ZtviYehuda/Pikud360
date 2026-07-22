import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
  loading?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  shortcut,
  loading = false,
  placeholder = "חיפוש...",
  className,
  ...props
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "relative flex items-center h-9 rounded-xl bg-card border border-border/50 hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-2xs group min-w-[200px] max-w-md w-full",
        className
      )}
    >
      <div className="flex items-center justify-center pl-3 pr-3 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-foreground placeholder:text-muted-foreground/60 focus:ring-0 px-0 h-full"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          title="ניקוי חיפוש"
          className="px-2 text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : shortcut ? (
        <div className="px-2 shrink-0 hidden sm:block">
          <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground/70 bg-muted/60 border border-border/40 rounded-md shadow-2xs select-none">
            {shortcut}
          </kbd>
        </div>
      ) : null}
    </div>
  );
};
SearchInput.displayName = "SearchInput";
