import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ImpersonationBanner = () => {
  const { user, logout } = useAuthContext();

  // If user is already the admin / system manager, they are not impersonating
  const isImpersonating = Boolean(
    user &&
    !user.is_admin &&
    user.username !== "admin" &&
    // @ts-ignore
    (user.is_impersonated || localStorage.getItem("admin_token"))
  );

  if (!isImpersonating || !user) return null;

  const handleReturnToAdmin = () => {
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("dashboard_filters");
      window.location.replace("/");
    } else {
      logout();
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.03, cursor: "grabbing" }}
      initial={{ y: -60, opacity: 0, x: "-50%" }}
      animate={{ y: 16, opacity: 1, x: "-50%" }}
      style={{ x: "-50%" }}
      className="fixed top-0 left-1/2 z-[200] cursor-grab touch-none select-none max-w-[95vw]"
    >
      <div
        className={cn(
          "flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-full border-2 shadow-2xl backdrop-blur-2xl transition-all",
          "bg-amber-500/15 border-amber-500/50 text-foreground dark:bg-amber-950/90 dark:border-amber-500/60",
          "hover:border-amber-500/80 shadow-amber-500/10"
        )}
        dir="rtl"
      >
        {/* Drag Handle */}
        <div className="pl-1 pr-1 cursor-grab active:cursor-grabbing text-amber-600/70 dark:text-amber-400/70 hover:text-amber-600 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-1">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </div>
          <div className="flex items-baseline gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">
              מחובר כעת בתור:
            </span>
            <span className="font-black text-amber-900 dark:text-amber-200 tracking-tight">
              {user.first_name} {user.last_name}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-amber-500/30 mx-1" />

        {/* Action Button */}
        <Button
          onClick={handleReturnToAdmin}
          size="sm"
          className="h-8 rounded-full px-3.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>חזור לחשבון אדמין</span>
        </Button>
      </div>
    </motion.div>
  );
};
