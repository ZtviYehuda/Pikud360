import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Check } from "lucide-react";

// --- Color Conversion Helpers ---

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hsvToHex(h: number, s: number, v: number): string {
  const [r, g, b] = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

export function hexToRgb(hex: string): [number, number, number] | null {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return [h, s, v];
}

export function hexToHsv(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [210, 1, 1];
  return rgbToHsv(rgb[0], rgb[1], rgb[2]);
}

const PRESET_HEX_MAP: Record<string, string> = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  pink: "#ec4899",
  rose: "#f43f5e",
  orange: "#f97316",
  amber: "#f59e0b",
  lime: "#84cc16",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  zinc: "#64748b",
};

const SUGGESTED_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#64748b",
];

// --- Upward Pointing Arrow Thumb ---
function SliderArrow({ percent }: { percent: number }) {
  // Clamped percent between 0 and 100 for safe rendering
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="absolute -bottom-3 pointer-events-none z-20 select-none transition-none"
      style={{
        left: `${clampedPercent}%`,
        transform: "translateX(-50%)",
      }}
    >
      <div className="flex flex-col items-center">
        {/* Triangle arrow head pointing UP directly at the track */}
        <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[10px] border-b-[#0091ea] drop-shadow-sm" />
        {/* Arrow base rectangle */}
        <div className="w-3.5 h-3 bg-[#0091ea] rounded-b-xs shadow-md -mt-[1px]" />
      </div>
    </div>
  );
}

// --- Draggable Color Slider Track ---
interface ColorSliderTrackProps {
  label: string;
  value: number; // 0 to 1
  onChange: (val: number) => void;
  background: string;
}

function ColorSliderTrack({
  label,
  value,
  onChange,
  background,
}: ColorSliderTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const calculateRatio = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      // Physical left to right calculation: rect.left is 0%, rect.right is 100%
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(ratio);
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // safe ignore
    }
    calculateRatio(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current || e.buttons > 0) {
      e.stopPropagation();
      calculateRatio(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe ignore
    }
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches && e.touches.length > 0) {
      calculateRatio(e.touches[0].clientX);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-xs font-bold text-foreground">
        <span>{label}</span>
      </div>

      {/* Explicit dir="ltr" ensures left: 0 is visual left and left: 100% is visual right */}
      <div
        dir="ltr"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        className="relative w-full h-8 rounded-lg cursor-pointer touch-none select-none border border-border/50 shadow-inner overflow-visible"
        style={{ background }}
      >
        <SliderArrow percent={value * 100} />
      </div>
    </div>
  );
}

// --- Main Color Picker Dialog ---
interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color: string;
  onColorSelect: (hex: string) => void;
}

export function ColorPickerDialog({
  open,
  onOpenChange,
  color,
  onColorSelect,
}: ColorPickerDialogProps) {
  // Determine initial HSV from current color
  const [h, setH] = useState(210);
  const [s, setS] = useState(1);
  const [v, setV] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      const activeHex = color.startsWith("#") ? color : PRESET_HEX_MAP[color] || "#0074ff";
      const [initH, initS, initV] = hexToHsv(activeHex);
      setH(initH);
      setS(initS);
      setV(initV);
      setShowSuggestions(false);
    }
  }, [open, color]);

  // Current Hex based on H, S, V
  const currentHex = hsvToHex(h, s, v);

  // Handlers for sliders
  const handleHueChange = (ratio: number) => {
    // 0 to 1 ratio maps to 0 to 360 degrees
    const newH = Math.round(ratio * 360) % 360;
    setH(newH);
  };

  const handleSatChange = (ratio: number) => {
    // 0 to 1 ratio maps to 0% to 100% saturation
    setS(ratio);
  };

  const handleValChange = (ratio: number) => {
    // 0 to 1 ratio maps to 0% to 100% brightness
    setV(ratio);
  };

  // Background gradients
  // 1. Hue rainbow gradient: Left is Red(0), through Yellow, Green, Cyan, Blue, Magenta, to Red(360)
  const hueGradient =
    "linear-gradient(to right, #ff0000 0%, #ffff00 16.67%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.67%, #ff00ff 83.33%, #ff0000 100%)";

  // 2. Saturation gradient: Left is 0% Saturation (white/gray), Right is 100% Saturation
  const satGradient = `linear-gradient(to right, ${hsvToHex(h, 0, v)}, ${hsvToHex(h, 1, v)})`;

  // 3. Value gradient: Left is 0% Value (black), Right is 100% Value
  const valGradient = `linear-gradient(to right, #000000, ${hsvToHex(h, s, 1)})`;

  const handleSelectSuggestion = (hex: string) => {
    const [newH, newS, newV] = hexToHsv(hex);
    setH(newH);
    setS(newS);
    setV(newV);
  };

  const handleConfirm = () => {
    onColorSelect(currentHex);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        disableSwipe={true}
        disableKeyboardOffset={true}
        showSwipeHandle={false}
        showCloseButton={false}
        className="w-full max-w-full sm:max-w-md fixed bottom-0 sm:bottom-auto inset-x-0 sm:inset-x-auto sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 rounded-t-[2.2rem] rounded-b-none sm:rounded-3xl border-t sm:border border-border/60 bg-card shadow-2xl p-5 sm:p-6 overflow-visible"
      >
        <DialogHeader className="p-0 text-right space-y-1">
          <DialogTitle className="text-xl font-black text-foreground">
            בחירת צבע
          </DialogTitle>
        </DialogHeader>

        {/* 3 Slider Tracks with spacing for upward arrow thumbs */}
        <div className="space-y-6 pt-2 pb-1">
          {/* גוון (Hue) */}
          <ColorSliderTrack
            label="גוון"
            value={h / 360}
            onChange={handleHueChange}
            background={hueGradient}
          />

          {/* רוויה (Saturation) */}
          <ColorSliderTrack
            label="רוויה"
            value={s}
            onChange={handleSatChange}
            background={satGradient}
          />

          {/* ערך (Value / Brightness) */}
          <ColorSliderTrack
            label="ערך"
            value={v}
            onChange={handleValChange}
            background={valGradient}
          />
        </div>

        {/* Color Preview & Suggestions Trigger */}
        <div className="flex items-center justify-between pt-5 pb-1">
          <div className="flex items-center gap-3">
            {/* Color Swatch Box */}
            <div
              className="w-13 h-13 rounded-xl border-2 border-border/80 shadow-md transition-colors relative overflow-hidden shrink-0"
              style={{ backgroundColor: currentHex }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">הצבע שנבחר</span>
              <span className="font-mono text-sm font-black tracking-wider text-muted-foreground uppercase select-all">
                {currentHex.toUpperCase()}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSuggestions((prev) => !prev)}
            className="text-xs font-black text-primary hover:bg-primary/10 rounded-xl px-3 py-1.5 h-auto gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            הצעות
          </Button>
        </div>

        {/* Suggested Palette Accordion */}
        {showSuggestions && (
          <div className="p-3 bg-muted/20 border border-border/40 rounded-2xl animate-in fade-in-50 zoom-in-95">
            <span className="text-[11px] font-bold text-muted-foreground block mb-2">
              צבעים מומלצים
            </span>
            <div className="grid grid-cols-6 gap-2">
              {SUGGESTED_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => handleSelectSuggestion(hex)}
                  className="w-full aspect-square rounded-lg border border-border/40 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center relative shadow-xs"
                  style={{ backgroundColor: hex }}
                >
                  {currentHex.toLowerCase() === hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: ביטול / הגדר */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/30 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-primary font-black text-sm hover:bg-primary/10 rounded-xl px-5 h-10"
          >
            ביטול
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="text-white font-black text-sm rounded-xl px-6 h-10 shadow-md transition-all active:scale-95"
            style={{ backgroundColor: currentHex }}
          >
            הגדר
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
