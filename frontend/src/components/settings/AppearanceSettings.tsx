import { Palette, Moon, Sun, Type, Monitor, Pipette, Check, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

interface AppearanceSettingsProps {
  theme: string;
  setTheme: (theme: any) => void;
  accentColor: string;
  setAccentColor: (color: any) => void;
  fontSize: string;
  setFontSize: (size: any) => void;
  showAiSupport: boolean;
  setShowAiSupport: (show: boolean) => void;
}

export function AppearanceSettings({
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  fontSize,
  setFontSize,
  showAiSupport,
  setShowAiSupport,
}: AppearanceSettingsProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(accentColor.startsWith("#"));
  const colorInputRef = useRef<HTMLInputElement>(null);

  const accentColors = [
    { id: "blue", label: "כחול", class: "bg-blue-500" },
    { id: "indigo", label: "אינדיגו", class: "bg-indigo-500" },
    { id: "violet", label: "סגול", class: "bg-violet-500" },
    { id: "pink", label: "ורוד", class: "bg-pink-500" },
    { id: "rose", label: "ורד", class: "bg-rose-500" },
    { id: "orange", label: "כתום", class: "bg-orange-500" },
    { id: "amber", label: "ענבר", class: "bg-amber-500" },
    { id: "lime", label: "ליים", class: "bg-lime-500" },
    { id: "emerald", label: "אמרלד", class: "bg-emerald-500" },
    { id: "teal", label: "טורקיז", class: "bg-teal-500" },
    { id: "cyan", label: "ציאן", class: "bg-cyan-500" },
    { id: "zinc", label: "ניטרלי", class: "bg-slate-500" },
  ];

  const fontSizes = [
    { id: "small", label: "קטן" },
    { id: "normal", label: "רגיל" },
    { id: "large", label: "גדול" },
  ];

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentColor(e.target.value);
  };

  return (
    <div id="appearance-settings-page" className="w-full pb-24 lg:pb-0 space-y-6 sm:space-y-8">
      {/* Top Row: Theme & Font Size Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-stretch">
        <SectionCard icon={Palette} title="ערכת נושא">
          <div className="grid grid-cols-2 gap-4 h-full">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as any)}
                className={cn(
                  "group relative p-2 rounded-2xl border transition-all overflow-hidden flex flex-col items-center justify-between h-32 sm:h-44",
                  theme === t
                    ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/10",
                )}
              >
                {/* Mockup Preview */}
                <div className={cn(
                  "w-full flex-1 rounded-xl overflow-hidden border border-border/10 flex flex-col transition-all duration-300 relative",
                  t === "light" ? "bg-slate-50" : "bg-slate-950"
                )}>
                  {/* Mockup Header */}
                  <div className={cn(
                    "h-4 w-full flex items-center px-1.5 gap-1 border-b border-border/5 shrink-0 justify-between",
                    t === "light" ? "bg-white" : "bg-slate-900"
                  )}>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-red-400/80" />
                      <div className="w-1 h-1 rounded-full bg-yellow-400/80" />
                      <div className="w-1 h-1 rounded-full bg-green-400/80" />
                    </div>
                    {/* Tiny representation of user icon or status */}
                    <div className={cn("w-1.5 h-1.5 rounded-full", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                  </div>
                  {/* Mockup Content */}
                  <div className="flex-grow p-1.5 flex gap-1.5">
                    {/* Mockup Sidebar */}
                    <div className={cn(
                      "w-4 shrink-0 rounded-xs flex flex-col gap-0.5 p-0.5 border-e border-border/5",
                      t === "light" ? "bg-slate-100/50" : "bg-slate-900/50"
                    )}>
                      <div className={cn("h-1 w-full rounded-xs", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                      <div className={cn("h-1 w-full rounded-xs", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                      <div className={cn("h-1 w-2/3 rounded-xs", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                    </div>
                    {/* Mockup Main */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className={cn(
                        "rounded-xs p-1 flex-grow flex flex-col gap-1 border border-border/5",
                        t === "light" ? "bg-white" : "bg-slate-900"
                      )}>
                        <div className={cn("h-1 w-1/2 rounded-xs", t === "light" ? "bg-slate-300" : "bg-slate-700")} />
                        <div className={cn("h-0.5 w-full rounded-xs", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                        <div className={cn("h-0.5 w-3/4 rounded-xs", t === "light" ? "bg-slate-200" : "bg-slate-800")} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator & Label */}
                <div className="w-full flex items-center justify-between px-1.5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "p-1 rounded-lg transition-colors",
                      theme === t ? "bg-primary/10 text-primary" : "text-muted-foreground bg-muted/40"
                    )}>
                      {t === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn("font-black text-[11px] sm:text-xs", theme === t ? "text-primary" : "text-muted-foreground")}>
                      {t === "light" ? "מראה יום" : "מראה לילה"}
                    </span>
                  </div>
                  {theme === t && (
                    <motion.div layoutId="active-theme-check" className="p-0.5 bg-primary rounded-full text-white shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </motion.div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Type} title="גודל גופן">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full">
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id as any)}
                className={cn(
                  "group relative p-2 rounded-2xl border transition-all overflow-hidden flex flex-col items-center justify-between h-32 sm:h-44",
                  fontSize === size.id
                    ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/10",
                )}
              >
                {/* Visual Scale Indicator */}
                <div className="w-full flex-grow rounded-xl bg-muted/20 border border-border/5 flex flex-col items-center justify-center relative p-2">
                  {/* We draw letters with size comparisons */}
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className={cn(
                      "font-black text-muted-foreground/30 transition-all",
                      size.id === "small" ? "text-primary scale-110 font-bold" : "text-xs"
                    )}>
                      A
                    </span>
                    <span className={cn(
                      "font-black text-muted-foreground/40 transition-all",
                      size.id === "normal" ? "text-primary scale-110 font-bold" : "text-sm"
                    )}>
                      A
                    </span>
                    <span className={cn(
                      "font-black text-muted-foreground/50 transition-all",
                      size.id === "large" ? "text-primary scale-110 font-bold" : "text-lg"
                    )}>
                      A
                    </span>
                  </div>
                  
                  {/* Sentence representation under the scale */}
                  <span className={cn(
                    "font-bold mt-2.5 transition-all text-center tracking-tight truncate w-full",
                    size.id === "small" && "text-[9px] text-muted-foreground/70",
                    size.id === "normal" && "text-[11px] text-muted-foreground/80",
                    size.id === "large" && "text-[13px] text-muted-foreground",
                    fontSize === size.id && "text-primary font-black"
                  )}>
                    גופן {size.label}
                  </span>
                </div>

                {/* Selection indicator & label info */}
                <div className="w-full flex items-center justify-between px-1.5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "p-1 rounded-lg transition-colors",
                      fontSize === size.id ? "bg-primary/10 text-primary" : "text-muted-foreground bg-muted/40"
                    )}>
                      <Type className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn("font-black text-[11px] sm:text-xs", fontSize === size.id ? "text-primary" : "text-muted-foreground")}>
                      {size.label}
                    </span>
                  </div>
                  {fontSize === size.id && (
                    <motion.div layoutId="active-font-check" className="p-0.5 bg-primary rounded-full text-white shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </motion.div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom Row: Full Palette */}
      <div id="color-palette-container">
        <SectionCard icon={Pipette} title="מניפת צבעי מערכת">
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-center lg:justify-between gap-y-3.5 gap-x-1.5 sm:gap-2 pb-2">
            {accentColors.map((color, index) => (
              <motion.button
                key={color.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{ 
                  delay: index * 0.04,
                  type: "spring",
                  stiffness: 260,
                  damping: 20 
                }}
                onClick={() => {
                  setAccentColor(color.id);
                  setIsCustomOpen(false);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all min-w-[50px] sm:min-w-[60px] lg:min-w-[0] lg:flex-1",
                )}
              >
                <div
                  className={cn(
                    "w-8.5 h-8.5 sm:w-10 sm:h-10 lg:w-8.5 lg:h-8.5 xl:w-9.5 xl:h-9.5 rounded-full transition-all duration-300 relative flex items-center justify-center",
                    color.class,
                    accentColor === color.id && !isCustomOpen
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110",
                  )}
                >
                  {accentColor === color.id && !isCustomOpen && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold text-center truncate w-full",
                    accentColor === color.id && !isCustomOpen ? "text-primary" : "text-muted-foreground"
                  )}>
                  {color.label}
                </span>
              </motion.button>
            ))}

            {/* Custom Color Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              transition={{ delay: accentColors.length * 0.04 }}
              onClick={() => {
                setIsCustomOpen(true);
                colorInputRef.current?.click();
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all min-w-[50px] sm:min-w-[60px] lg:min-w-[0] lg:flex-1",
              )}
            >
              <div
                className={cn(
                  "w-8.5 h-8.5 sm:w-10 sm:h-10 lg:w-8.5 lg:h-8.5 xl:w-9.5 xl:h-9.5 rounded-full transition-all duration-300 relative flex items-center justify-center overflow-hidden",
                  isCustomOpen
                    ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-linear-to-tr from-red-500 via-green-500 to-blue-500 hover:scale-110",
                )}
                style={isCustomOpen ? { backgroundColor: accentColor } : {}}
              >
                {!isCustomOpen ? (
                  <Pipette className="w-4 h-4 text-white" />
                ) : (
                  <Check className="w-4 h-4 text-white" />
                )}
                <input
                  ref={colorInputRef}
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                  value={accentColor.startsWith("#") ? accentColor : "#0074ff"}
                  onChange={handleCustomColorChange}
                />
              </div>
              <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold text-center",
                  isCustomOpen ? "text-primary" : "text-muted-foreground"
                )}>
                מותאם
              </span>
            </motion.button>
          </div>

          <AnimatePresence>
            {isCustomOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 p-5 rounded-[2.5rem] bg-muted/20 border border-border/40 backdrop-blur-md">
                  <div 
                    className="w-14 h-14 rounded-2xl border border-white/20 relative"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">מזהה צבע נבחר</label>
                      <div className="flex items-center gap-3">
                         <span className="font-mono text-lg font-black tracking-tighter text-foreground">{accentColor.toUpperCase()}</span>
                         <div className="h-4 w-px bg-border" />
                         <button 
                          onClick={() => colorInputRef.current?.click()}
                          className="text-xs text-primary font-bold hover:underline"
                         >
                           שינוי צבע
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </SectionCard>
      </div>

      {/* AI Support Toggle Section */}
      <div id="ai-support-setting-container">
        <SectionCard icon={HelpCircle} title="עוזר תמיכה AI">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/40 backdrop-blur-md">
            <div className="space-y-1 pr-1">
              <h4 className="text-sm font-black text-foreground">
                הצגת כפתור התמיכה והמדריך הצף
              </h4>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                כאשר הגדרה זו פעילה, יופיע כפתור צף בפינת המסך המאפשר להפעיל את עוזר ה-AI או לצפות במדריך המודרך של המערכת.
              </p>
            </div>
            <Switch
              checked={showAiSupport}
              onCheckedChange={setShowAiSupport}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Button to open AI support directly from settings */}
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event('open-ai-support'))}
              className="rounded-xl border-primary/20 text-primary font-black text-xs gap-2 hover:bg-primary/10 transition-all h-10 px-5"
            >
              <HelpCircle className="w-4 h-4" />
              פתח עוזר AI כעת
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: any) {
  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-black text-foreground tracking-tight">
          {title}
        </h3>
      </div>
      <div className="bg-card/40 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-border/40 p-3 sm:p-6 overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}


