import * as React from "react";
import { Card } from "./card";
import { Button } from "./button";
import { ActionGroup } from "./layout-primitives";
import {
  Skeleton,
  SkeletonLine,
  SkeletonAvatar,
  SkeletonBlock,
  SkeletonCard,
  SkeletonTable
} from "./skeleton";
import { cn } from "../../lib/utils";

// ==========================================
// 1. EmptyState Component
// ==========================================
export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, primaryAction, secondaryAction, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="empty"
        className={cn("max-w-lg mx-auto w-full select-none", className)}
        {...props}
      >
        <div className="flex flex-col items-center justify-center text-center p-8 gap-enterprise-component-gap">
          {icon && (
            <div className="p-3 bg-enterprise-background rounded-full text-slate-400 dark:text-slate-500 mb-2" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {typeof title === "string" ? (
              <h3 className="text-enterprise-section-title font-weight-enterprise-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            ) : (
              title
            )}
            {typeof description === "string" ? (
              <p className="text-enterprise-caption text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {description}
              </p>
            ) : (
              description
            )}
          </div>
          {(primaryAction || secondaryAction) && (
            <ActionGroup className="mt-4">
              {secondaryAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              )}
            </ActionGroup>
          )}
        </div>
      </Card>
    );
  }
);
EmptyState.displayName = "EmptyState";


// ==========================================
// 2. LoadingState Component
// ==========================================
export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "table" | "list" | "layout";
  rows?: number;
}

export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, variant = "card", rows = 5, ...props }, ref) => {
    if (variant === "table") {
      return <SkeletonTable ref={ref} rows={rows} className={className} {...props} />;
    }

    if (variant === "list") {
      return (
        <div ref={ref} className={cn("w-full space-y-3", className)} {...props}>
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-enterprise-surface border border-enterprise-border rounded-enterprise-md animate-pulse">
              <SkeletonAvatar />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="w-1/3" />
                <SkeletonLine className="w-1/2 h-3" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      );
    }

    if (variant === "layout") {
      return (
        <div ref={ref} className={cn("w-full space-y-6", className)} {...props}>
          {/* Header Mockup */}
          <div className="flex justify-between items-center pb-4 border-b border-enterprise-border">
            <div className="space-y-2">
              <SkeletonLine className="h-6 w-48" />
              <SkeletonLine className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-28 rounded-enterprise-md" />
          </div>
          {/* Workspace Area Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-enterprise-grid-gap">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-enterprise-surface border border-enterprise-border rounded-enterprise-lg p-6 space-y-4">
                <SkeletonLine className="h-5 w-1/3" />
                <SkeletonBlock className="h-40" />
              </div>
              <div className="bg-enterprise-surface border border-enterprise-border rounded-enterprise-lg p-6 space-y-4">
                <SkeletonLine className="h-5 w-1/4" />
                <SkeletonBlock className="h-24" />
              </div>
            </div>
            <div className="bg-enterprise-surface border border-enterprise-border rounded-enterprise-lg p-6 space-y-4">
              <SkeletonLine className="h-5 w-1/2" />
              <div className="space-y-3">
                <SkeletonBlock className="h-12 rounded-enterprise-md" />
                <SkeletonBlock className="h-12 rounded-enterprise-md" />
                <SkeletonBlock className="h-12 rounded-enterprise-md" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default "card" variant
    return <SkeletonCard ref={ref} className={className} {...props} />;
  }
);
LoadingState.displayName = "LoadingState";


// ==========================================
// 3. ErrorState Component
// ==========================================
export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  retryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  ({ className, title, description, icon, retryAction, secondaryAction, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="alert"
        severity="danger"
        className={cn("max-w-lg mx-auto w-full select-none", className)}
        {...props}
      >
        <div className="flex flex-col items-center justify-center text-center p-8 gap-enterprise-component-gap">
          {icon && (
            <div className="p-3 bg-enterprise-danger/10 text-enterprise-danger rounded-full mb-2" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {typeof title === "string" ? (
              <h3 className="text-enterprise-section-title font-weight-enterprise-bold text-enterprise-danger">
                {title}
              </h3>
            ) : (
              title
            )}
            {typeof description === "string" ? (
              <p className="text-enterprise-caption text-enterprise-danger max-w-sm mx-auto leading-relaxed">
                {description}
              </p>
            ) : (
              description
            )}
          </div>
          {(retryAction || secondaryAction) && (
            <ActionGroup className="mt-4">
              {secondaryAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {retryAction && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={retryAction.onClick}
                  disabled={retryAction.disabled}
                >
                  {retryAction.label}
                </Button>
              )}
            </ActionGroup>
          )}
        </div>
      </Card>
    );
  }
);
ErrorState.displayName = "ErrorState";
