import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ImpersonationBanner = () => {
  const { user, logout } = useAuthContext();

  // @ts-ignore - is_impersonated added dynamically
  if (!user || !user.is_impersonated) return null;

  const handleLogout = () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("dashboard_filters"); // Clear filters to reset view for admin
      window.location.href = "/";
    } else {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      initial={{ y: -50, opacity: 0, x: "-50%" }}
      animate={{ y: 24, opacity: 1, x: "-50%" }}
      style={{ x: "-50%" }}
      className="fixed top-0 left-1/2 z-[100] cursor-grab touch-none"
    >
      <div
        className={cn(
          "flex items-center gap-1 p-1.5 pl-1 pr-1.5 rounded-full border-2  backdrop-blur-xl select-none transition-all",
          // Dynamic Theme Colors - Extra Pop
          "bg-background/80 border-primary/50 text-foreground",
          " dark:",
          "hover:border-primary/80 hover:",
          // Gradient hint for prominence
          "bg-gradient-to-r from-background via-background to-primary/5",
        )}
        dir="rtl"
      >
        {/* Drag Handle */}
        <div className="pl-2 pr-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors group">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary "></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground/80">
              מציג כ-
            </span>
            <span className="text-sm font-black text-foreground tracking-tight decoration-primary/30 underline decoration-2 underline-offset-4">
              {user.first_name} {user.last_name}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border/60 mx-3" />

        {/* Action */}
        <Button
          onClick={handleLogout}
          size="sm"
          className="h-8 rounded-full px-4 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary  transition-all"
        >
          <LogOut className="w-3.5 h-3.5 ml-2" />
          חזור לניהול
        </Button>
      </div>
    </motion.div>
  );
};

