import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
} from "lucide-react";
import { supportApi } from "../api";
import type { SupportActivityItem } from "../types";

export const SupportActivityPage: React.FC = () => {
  const [activity, setActivity] = useState<SupportActivityItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (severityFilter !== "ALL") params.severity = severityFilter;

      const res = await supportApi.getActivity(params);
      setActivity(res.activity);
      setTotal(res.total);
    } catch (e) {
      console.error("Failed to load support activity", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [severityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivity();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            יומן פעולות מערכת (Audit Trail)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ניטור וביקורת מלאים של פעולות מנהל, אירועי התחזות ושינויי אבטחה (סה״כ {total} רשומות)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivity}
          disabled={loading}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>רענון</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="חפש לפי שם משתמש, סוג פעולה או כתובת IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs pr-9 bg-muted/20"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/40 p-0.5 bg-muted/20 text-xs">
                {(["ALL", "INFO", "WARNING", "CRITICAL"] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      severityFilter === sev
                        ? "bg-background font-semibold shadow-xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    {sev === "ALL" ? "הכל" : sev}
                  </button>
                ))}
              </div>

              <Button type="submit" size="sm" className="h-9 text-xs">
                חיפוש
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-right text-xs font-semibold">סוג פעולה</TableHead>
                <TableHead className="text-right text-xs font-semibold">משתמש מבצע</TableHead>
                <TableHead className="text-right text-xs font-semibold">חומרה</TableHead>
                <TableHead className="text-right text-xs font-semibold">טבלה / רכיב</TableHead>
                <TableHead className="text-right text-xs font-semibold">כתובת IP</TableHead>
                <TableHead className="text-right text-xs font-semibold">זמן ביצוע</TableHead>
                <TableHead className="text-left text-xs font-semibold">פרטים נוספים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((act) => (
                <TableRow key={act.id} className="border-border/30 hover:bg-muted/10 text-xs">
                  <TableCell className="font-mono font-semibold text-foreground">
                    {act.action}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {act.user_name || "מערכת"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        act.severity === "CRITICAL"
                          ? "destructive"
                          : act.severity === "WARNING"
                          ? "outline"
                          : "secondary"
                      }
                      className={`text-[9px] py-0 px-1.5 font-mono ${
                        act.severity === "WARNING" ? "text-amber-500 border-amber-500/30" : ""
                      }`}
                    >
                      {act.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-[11px]">
                    {act.table_name || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-[11px]">
                    {act.ip_address}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {new Date(act.created_at).toLocaleString("he-IL")}
                  </TableCell>
                  <TableCell className="text-left font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                    {JSON.stringify(act.details || {})}
                  </TableCell>
                </TableRow>
              ))}

              {activity.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    אין רישומי פעילות התואמים לחיפוש.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportActivityPage;
