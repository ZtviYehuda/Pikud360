import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { SupportHeader } from "./components/SupportHeader";
import { SupportSidebar } from "./components/SupportSidebar";
import { SupportUserDrawer } from "./components/SupportUserDrawer";
import { supportApi } from "./api";
import type { SupportDashboardStats } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User } from "lucide-react";
import type { SupportUserListItem } from "./types";

export const SupportWorkspaceLayout: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [stats, setStats] = useState<SupportDashboardStats | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SupportUserListItem[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Selected user for diagnostic drawer
  const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);

  // Fetch basic header health stats on interval
  useEffect(() => {
    let isMounted = true;
    const loadHealth = async () => {
      try {
        const data = await supportApi.getDashboard();
        if (isMounted) setStats(data);
      } catch (e) {
        // silent fail in background
      }
    };

    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search users debounce
  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await supportApi.getUsers({ search: searchQuery.trim(), limit: 5 });
        setSearchResults(res.users);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans" dir="rtl">
      {/* Top Header */}
      <SupportHeader
        systemStatus={stats?.system_status || "healthy"}
        openIncidentsCount={stats?.open_incidents_count || 0}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Sidebar */}
        <SupportSidebar />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8">
          <Outlet context={{ stats, onSelectUser: (id: number | string) => setSelectedUserId(id) }} />
        </main>
      </div>

      {/* Quick User Search Modal (Cmd+K) */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg p-4 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <span>חיפוש מהיר של משתמש במערכת</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <div className="relative">
              <Input
                placeholder="חפש לפי שם, מספר אישי או שם משתמש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 text-xs pr-9 bg-muted/20"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-3" />
            </div>

            {searching && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSelectedUserId(u.id);
                    }}
                    className="w-full text-right p-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {u.first_name?.[0] || u.username[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {u.display_name || `${u.first_name} ${u.last_name}`}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {u.username} • {u.department_name || "ללא מחלקה"}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-primary font-medium">פתח תיק ←</span>
                  </button>
                ))}
              </div>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                לא נמצאו משתמשים התואמים לחיפוש.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diagnostic Dossier Drawer */}
      <SupportUserDrawer
        userId={selectedUserId}
        open={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
};

export default SupportWorkspaceLayout;
