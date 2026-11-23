import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  Ban,
  CheckCircle2,
  Filter,
  UserCheck,
} from "lucide-react";
import { supportApi } from "../api";
import { SupportUserDrawer } from "../components/SupportUserDrawer";
import type { SupportUserListItem } from "../types";

export const SupportUserLookupPage: React.FC = () => {
  const [users, setUsers] = useState<SupportUserListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { search: search.trim() || undefined, limit: 50 };
      if (statusFilter === "ACTIVE") params.is_active = true;
      if (statusFilter === "BLOCKED") params.is_active = false;

      const data = await supportApi.getUsers(params);
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            איתור ואבחון משתמשים
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            חיפוש משתמשים, בדיקת הרשאות, ניהול גישה וביצוע פעולות מבוקרות (סה״כ {total} משתמשים)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>רענון רשימה</span>
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="חפש לפי שם פרטי, משפחה, כינוי או מספר אישי..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs pr-9 bg-muted/20"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/40 p-0.5 bg-muted/20 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === "ALL" ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  הכל
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === "ACTIVE" ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  פעילים
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("BLOCKED")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    statusFilter === "BLOCKED" ? "bg-background font-semibold shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  חסומים
                </button>
              </div>

              <Button type="submit" size="sm" className="h-9 text-xs">
                חיפוש
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-right text-xs font-semibold">משתמש</TableHead>
                <TableHead className="text-right text-xs font-semibold">מספר אישי</TableHead>
                <TableHead className="text-right text-xs font-semibold">מחלקה ומדור</TableHead>
                <TableHead className="text-right text-xs font-semibold">תפקיד</TableHead>
                <TableHead className="text-right text-xs font-semibold">סטטוס</TableHead>
                <TableHead className="text-right text-xs font-semibold">התחברות אחרונה</TableHead>
                <TableHead className="text-left text-xs font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-border/30 hover:bg-muted/10 text-xs">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {u.first_name?.[0] || u.username[0]}
                      </div>
                      <div>
                        <span className="font-semibold block text-foreground">
                          {u.display_name || `${u.first_name} ${u.last_name}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {u.email || u.phone_number || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{u.username}</TableCell>
                  <TableCell>
                    <span className="text-foreground">{u.department_name || "ללא"}</span>
                    {u.section_name && (
                      <span className="text-muted-foreground text-[11px] block">
                        {u.section_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.role_name || "משתמש"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.is_active ? "default" : "destructive"}
                      className="text-[10px] py-0 px-1.5"
                    >
                      {u.is_active ? "פעיל" : "חסום"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString("he-IL") : "לא התחבר"}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 hover:text-primary"
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <span>פתח תיק אבחון</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                    לא נמצאו משתמשים תואמים לחיפוש.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawer */}
      <SupportUserDrawer
        userId={selectedUserId}
        open={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
};

export default SupportUserLookupPage;
