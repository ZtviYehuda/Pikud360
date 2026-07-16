import * as React from "react";
import { Card } from "./card";
import { cn } from "../../lib/utils";

// --- Base Skeleton ---
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-enterprise-sm bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

// --- SkeletonLine ---
const SkeletonLine = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Skeleton
      ref={ref}
      className={cn("h-4 w-full", className)}
      {...props}
    />
  )
);
SkeletonLine.displayName = "SkeletonLine";

// --- SkeletonAvatar ---
const SkeletonAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Skeleton
      ref={ref}
      className={cn("h-10 w-10 rounded-full shrink-0", className)}
      {...props}
    />
  )
);
SkeletonAvatar.displayName = "SkeletonAvatar";

// --- SkeletonBlock ---
const SkeletonBlock = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Skeleton
      ref={ref}
      className={cn("h-24 w-full rounded-enterprise-md", className)}
      {...props}
    />
  )
);
SkeletonBlock.displayName = "SkeletonBlock";

// --- SkeletonCard ---
const SkeletonCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="loading"
      className={cn("w-full", className)}
      {...props}
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <SkeletonAvatar />
          <div className="space-y-2 flex-1">
            <SkeletonLine className="w-1/4" />
            <SkeletonLine className="w-1/3 h-3" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine className="w-5/6" />
          <SkeletonLine className="w-2/3" />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Skeleton className="h-8 w-20 rounded-enterprise-sm" />
          <Skeleton className="h-8 w-24 rounded-enterprise-sm" />
        </div>
      </div>
    </Card>
  )
);
SkeletonCard.displayName = "SkeletonCard";

// --- SkeletonTable ---
export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ className, rows = 5, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("w-full space-y-4", className)}
      {...props}
    >
      {/* Mock Header Row */}
      <div className="flex items-center gap-4 py-2 border-b border-enterprise-border">
        <SkeletonLine className="h-4 w-12" />
        <SkeletonLine className="h-4 w-1/4" />
        <SkeletonLine className="h-4 w-1/5" />
        <SkeletonLine className="h-4 w-1/6" />
      </div>
      {/* Mock Table Rows */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-4 py-3 border-b border-enterprise-border/50 animate-pulse"
        >
          <SkeletonLine className="h-4 w-8" />
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/5" />
          <SkeletonLine className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
);
SkeletonTable.displayName = "SkeletonTable";

export {
  Skeleton,
  SkeletonLine,
  SkeletonAvatar,
  SkeletonBlock,
  SkeletonCard,
  SkeletonTable
};
