import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*                                Base Components                              */
/* -------------------------------------------------------------------------- */

interface FormFieldProps {
  field: {
    name: string;
    label: string;
    type?: "text" | "number" | "email" | "tel" | "date" | "password";
    placeholder?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
  };
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", field.className)}>
      <Label
        htmlFor={field.name}
        className="text-sm font-medium text-foreground/80"
      >
        {field.label}{" "}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={field.name}
        type={field.type || "text"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className={cn(
          "h-9 transition-all hover:border-primary/30 focus-visible:ring-offset-0 focus-visible:ring-1",
          error && "border-destructive focus-visible:ring-destructive",
        )}
        disabled={field.disabled}
      />
      {error && (
        <p className="text-xs text-destructive font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-accent/5 transition-colors">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="scale-90"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Layout Components                            */
/* -------------------------------------------------------------------------- */

interface FormSectionProps {
  title: string;
  description?: string;
  fields: any[];
  values: any;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FormSection({
  title,
  description,
  fields,
  values,
  onChange,
  errors = {},
  columns = 2,
  className,
}: FormSectionProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2", // Mobile: 1, Desktop: 2
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", // Mobile: 1, Tablet: 2, Desktop: 3
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const currentGridClass =
    typeof columns === "number"
      ? gridCols[columns as 1 | 2 | 3 | 4] || gridCols[2]
      : gridCols[2];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-2 mb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className={cn("grid gap-x-4 gap-y-4", currentGridClass)}>
        {fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => onChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </div>
    </div>
  );
}

interface TabNavigationProps {
  tabs: { value: string; label: string; icon?: React.ElementType }[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabNavigationProps) {
  return (
    <div
      className={cn(
        "flex space-x-1 rtl:space-x-reverse border-b border-border/60 mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 pt-2",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-t-md",
            activeTab === tab.value
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
          )}
        >
          <div className="flex items-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </div>
          {activeTab === tab.value && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary " />
          )}
        </button>
      ))}
    </div>
  );
}

interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function FormContainer({ children, className }: FormContainerProps) {
  return (
    <Card
      className={cn(
        "border-border/60  p-4 sm:p-5 transition-all hover: h-full",
        className,
      )}
    >
      <div className="space-y-5 h-full">{children}</div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            New Dashboard Components                         */
/* -------------------------------------------------------------------------- */

export function CompactCard({
  children,
  className,
  title,
  action,
  headerClassName,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  headerClassName?: string;
  id?: string;
}) {
  return (
    <Card
      id={id}
      className={cn(
        "border-border/60  hover: transition-all h-full flex flex-col overflow-hidden bg-card/50",
        className,
      )}
    >
      {(title || action) && (
        <div
          className={cn(
            "flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-border/40 bg-muted/20 min-h-[42px] sm:min-h-[48px]",
            headerClassName,
          )}
        >
          {title && (
            <h3 className="font-semibold text-sm tracking-tight text-foreground/90 leading-none flex items-center gap-2">
              {title}
            </h3>
          )}
          {action && (
            <div className="flex items-center gap-2 text-sm">{action}</div>
          )}
        </div>
      )}
      <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 flex-1">{children}</div>
    </Card>
  );
}

export function DashboardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 lg:gap-6 items-start",
        className,
      )}
    >
      {children}
    </div>
  );
}
