import * as React from "react";
import { cn } from "../../lib/utils";

// --- PageLayout ---
export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full flex flex-col gap-enterprise-section-gap p-enterprise-page-pad",
        className
      )}
      {...props}
    />
  )
);
PageLayout.displayName = "PageLayout";


// --- PageHeader ---
export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, breadcrumbs, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 pb-5 border-b border-enterprise-border w-full select-none",
        className
      )}
      {...props}
    >
      {breadcrumbs && (
        <div className="flex items-center gap-1.5 text-enterprise-caption text-slate-400 font-weight-enterprise-medium tracking-wider uppercase">
          {breadcrumbs}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-enterprise-component-gap w-full mt-1">
        <div className="space-y-1">
          {typeof title === "string" ? (
            <h1 className="font-heading text-enterprise-page-title font-weight-enterprise-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            typeof subtitle === "string" ? (
              <p className="text-enterprise-caption font-weight-enterprise-medium text-brand-600 dark:text-brand-400">
                {subtitle}
              </p>
            ) : (
              subtitle
            )
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 select-none shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
);
PageHeader.displayName = "PageHeader";


// --- Section ---
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "flex flex-col gap-enterprise-component-gap w-full",
        className
      )}
      {...props}
    />
  )
);
Section.displayName = "Section";


// --- SectionHeader ---
export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-enterprise-component-gap w-full select-none",
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">
        {typeof title === "string" ? (
          <h2 className="text-enterprise-section-title font-weight-enterprise-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>
        ) : (
          title
        )}
        {description && (
          typeof description === "string" ? (
            <p className="text-enterprise-caption text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : (
            description
          )
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-enterprise-component-gap shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";


// --- ResponsiveGrid ---
const mobileCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12"
};

const tabletCols: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12"
};

const desktopCols: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  6: "xl:grid-cols-6",
  12: "xl:grid-cols-12"
};

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, cols, ...props }, ref) => {
    const mob = cols?.mobile !== undefined ? mobileCols[cols.mobile] : "grid-cols-1";
    const tab = cols?.tablet !== undefined ? tabletCols[cols.tablet] : "md:grid-cols-2";
    const desk = cols?.desktop !== undefined ? desktopCols[cols.desktop] : "xl:grid-cols-3";

    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-enterprise-grid-gap w-full",
          mob,
          tab,
          desk,
          className
        )}
        {...props}
      />
    );
  }
);
ResponsiveGrid.displayName = "ResponsiveGrid";


// --- ContentStack ---
export interface ContentStackProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ContentStack = React.forwardRef<HTMLDivElement, ContentStackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-enterprise-component-gap w-full",
        className
      )}
      {...props}
    />
  )
);
ContentStack.displayName = "ContentStack";


// --- ActionGroup ---
export interface ActionGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ActionGroup = React.forwardRef<HTMLDivElement, ActionGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:items-center gap-enterprise-component-gap",
        className
      )}
      {...props}
    />
  )
);
ActionGroup.displayName = "ActionGroup";
