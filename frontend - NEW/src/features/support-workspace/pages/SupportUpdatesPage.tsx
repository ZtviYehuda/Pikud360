import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  RefreshCw,
  Sparkles,
  Bug,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { supportApi } from "../api";
import type { SystemUpdateItem } from "../types";

export const SupportUpdatesPage: React.FC = () => {
  const [updates, setUpdates] = useState<SystemUpdateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getUpdates();
      setUpdates(data);
    } catch (e) {
      console.error("Failed to load updates", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            עדכוני גרסה ויומן שינויים (Changelog)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            היסטוריית שחרורי גרסה, פיצ'רים חדשים, תיקוני באגים ועדכוני אבטחה
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUpdates}
          disabled={loading}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>רענון</span>
        </Button>
      </div>

      {/* Updates Timeline List */}
      <div className="space-y-4">
        {updates.map((update, idx) => (
          <Card key={idx} className="border-border/40 shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between border-b border-border/30">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="font-mono text-xs px-2.5 py-0.5">
                  v{update.version}
                </Badge>
                <CardTitle className="text-sm font-bold text-foreground">
                  {update.title}
                </CardTitle>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{update.date}</span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {update.highlights && update.highlights.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    דגשים מרכזיים
                  </span>
                  <ul className="list-disc list-inside text-xs space-y-1 text-foreground">
                    {update.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {update.changes && update.changes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
                    פירוט שינויים
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {update.changes.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 text-xs border border-border/20"
                      >
                        {c.type === "feature" && (
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        )}
                        {c.type === "fix" && (
                          <Bug className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        {c.type === "security" && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        {c.type === "improvement" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <span className="text-foreground">{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {updates.length === 0 && !loading && (
          <div className="p-12 text-center border border-dashed border-border/60 rounded-2xl text-xs text-muted-foreground">
            לא נמצאו רישומי גרסאות במערכת.
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportUpdatesPage;
