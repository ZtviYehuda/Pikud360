import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { supportApi } from "../api";
import type { SystemHealthData } from "../types";

export const SupportSystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pinging, setPinging] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      const data = await supportApi.getSystemHealth();
      setHealth(data);
    } catch (e) {
      console.error("Failed to load system health", e);
    } finally {
      setLoading(false);
      setPinging(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handlePing = () => {
    setPinging(true);
    fetchHealth();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            בריאות מערכת ותשתיות
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ניטור בזמן אמת של מסד הנתונים, שרתי האפליקציה וזמינות השירות
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePing}
          disabled={pinging}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pinging ? "animate-spin" : ""}`} />
          <span>בדיקת זמן תגובה (Ping)</span>
        </Button>
      </div>

      {/* Grid: Server & Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostgreSQL Database Health */}
        <Card className="border-border/40 shadow-xs">
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>מסד נתונים PostgreSQL</span>
            </CardTitle>
            <Badge
              variant={health?.database.status === "connected" ? "default" : "destructive"}
              className="text-[10px] py-0 px-2"
            >
              {health?.database.status === "connected" ? "מחובר ותקין" : "מנותק"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">זמן תגובה (Latency):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {health?.database.latency_ms !== undefined ? `${health.database.latency_ms} ms` : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">טווח חיבורי בריכה (Pool):</span>
              <span className="font-mono font-medium">
                {health?.database.pool.min_connections} (מינימום) — {health?.database.pool.max_connections} (מקסימום)
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">סוג בסיס נתונים:</span>
              <span className="font-medium text-foreground">PostgreSQL 15+ (Local / Cloud)</span>
            </div>
          </CardContent>
        </Card>

        {/* Backend Application Server Health */}
        <Card className="border-border/40 shadow-xs">
          <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              <span>שרת יישום (Flask Application)</span>
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] py-0 px-2">
              {health?.server.environment || "DEVELOPMENT"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">זמן פעילות רציף (Uptime):</span>
              <span className="font-mono font-medium text-foreground">
                {health?.server.uptime_human || "פעיל"} ({health?.server.uptime_seconds || 0} שניות)
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">גרסת שרת רשמית:</span>
              <span className="font-mono font-bold text-foreground">
                {health?.server.app_version || "v1.1.3"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-muted-foreground">שעון מערכת:</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {health?.server.server_time ? new Date(health.server.server_time).toLocaleString("he-IL") : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unexposed Infrastructure Metrics (Strictly Marked "לא זמין") */}
      <Card className="border-border/40 shadow-xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                מדדי תשתית ומארח (Host Infrastructure)
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                מדדים אלו אינם חשופים כעת על-ידי שרת היישום ומוגדרים לפי התקן כבלתי זמינים (Zero Fake Metrics)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px]">עומס מעבד (CPU)</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-muted-foreground">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {health?.unexposed_metrics?.cpu_usage || "לא זמין"}
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px]">שימוש בזיכרון (RAM)</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-muted-foreground">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {health?.unexposed_metrics?.memory_usage || "לא זמין"}
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px]">קלט/פלט דיסק (Disk I/O)</span>
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-muted-foreground">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {health?.unexposed_metrics?.disk_io || "לא זמין"}
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px]">תעבורת רשת (Network)</span>
                <Network className="w-3.5 h-3.5" />
              </div>
              <div className="font-semibold text-muted-foreground">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {health?.unexposed_metrics?.network_traffic || "לא זמין"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportSystemHealthPage;
