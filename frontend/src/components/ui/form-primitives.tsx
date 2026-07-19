import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// ==========================================
// Types
// ==========================================

export type FormColumns = 1 | 2 | 3 | 4;

// ==========================================
// 1. RequiredIndicator
// ==========================================

/**
 * Accessible required field marker.
 * Renders an asterisk with an sr-only label so screen readers announce it.
 */
export const RequiredIndicator: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  ...props
}) => (
  <span
    className={cn("text-red-500 font-bold mr-0.5 select-none", className)}
    aria-hidden="true"
    {...props}
  >
    *
    <span className="sr-only">שדה חובה</span>
  </span>
);
RequiredIndicator.displayName = "RequiredIndicator";

// ==========================================
// 2. FormLabel
// ==========================================

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * Standard form field label.
 * Use the `required` prop to append the RequiredIndicator automatically.
 */
export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-semibold text-slate-700 dark:text-slate-300",
        "mb-1.5 select-none leading-none",
        className
      )}
      {...props}
    >
      {required && <RequiredIndicator />}
      {children}
    </label>
  )
);
FormLabel.displayName = "FormLabel";

// ==========================================
// 3. FormHint
// ==========================================

/**
 * Helper text rendered below a field.
 * Wire up `id` + field's `aria-describedby` for full accessibility.
 *
 * @example
 * <FormHint id="name-hint">מקסימום 50 תווים</FormHint>
 * <Input aria-describedby="name-hint" />
 */
export const FormHint = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed",
      className
    )}
    {...props}
  />
));
FormHint.displayName = "FormHint";

// ==========================================
// 4. FormErrorMessage
// ==========================================

/**
 * Validation error message rendered below a field.
 * Uses `role="alert"` so screen readers announce it immediately.
 *
 * Wire up `id` + field's `aria-describedby` for full accessibility.
 *
 * @example
 * <FormErrorMessage id="name-error">שם הוא שדה חובה</FormErrorMessage>
 * <Input aria-describedby="name-error" aria-invalid="true" />
 */
export const FormErrorMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    role="alert"
    aria-live="polite"
    className={cn(
      "mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 leading-snug",
      className
    )}
    {...props}
  />
));
FormErrorMessage.displayName = "FormErrorMessage";

// ==========================================
// 5. FormFieldGroup
// ==========================================

export interface FormFieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  /** htmlFor wired to the label automatically */
  htmlFor?: string;
}

/**
 * Composed field wrapper: label → input slot → hint/error.
 *
 * Provides standardized spacing, label association, and error announcement.
 *
 * @example
 * <FormFieldGroup label="שם פרטי" required htmlFor="first-name" hint="כפי שמופיע בתעודת זהות">
 *   <Input id="first-name" />
 * </FormFieldGroup>
 */
export const FormFieldGroup = React.forwardRef<HTMLDivElement, FormFieldGroupProps>(
  ({ className, children, label, hint, error, required, htmlFor, ...props }, ref) => {
    const hintId  = htmlFor ? `${htmlFor}-hint`  : undefined;
    const errorId = htmlFor ? `${htmlFor}-error` : undefined;

    return (
      <div ref={ref} className={cn("flex flex-col", className)} {...props}>
        {label && (
          <FormLabel htmlFor={htmlFor} required={required}>
            {label}
          </FormLabel>
        )}

        {/* Inject aria-describedby onto direct child input/select/textarea */}
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const describedBy = [
            error && errorId,
            hint  && hintId,
          ]
            .filter(Boolean)
            .join(" ") || undefined;

          return React.cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            "aria-describedby": describedBy,
            "aria-invalid":     error ? "true" : undefined,
          } as React.HTMLAttributes<HTMLElement>);
        })}

        {error && (
          <FormErrorMessage id={errorId}>{error}</FormErrorMessage>
        )}
        {!error && hint && (
          <FormHint id={hintId}>{hint}</FormHint>
        )}
      </div>
    );
  }
);
FormFieldGroup.displayName = "FormFieldGroup";

// ==========================================
// 6. FormRow
// ==========================================

const formRowVariants = cva(
  "grid gap-4 w-full",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      },
    },
    defaultVariants: {
      cols: 1,
    },
  }
);

export interface FormRowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formRowVariants> {}

/**
 * Responsive grid row for form fields.
 *
 * - Mobile: always single column (stacks vertically).
 * - Desktop: expands to the specified number of columns.
 *
 * Use `cols={2}` for side-by-side fields (e.g., first name + last name).
 *
 * @example
 * <FormRow cols={2}>
 *   <FormFieldGroup label="שם פרטי" htmlFor="first-name" required>
 *     <Input id="first-name" />
 *   </FormFieldGroup>
 *   <FormFieldGroup label="שם משפחה" htmlFor="last-name" required>
 *     <Input id="last-name" />
 *   </FormFieldGroup>
 * </FormRow>
 */
export const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, cols, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(formRowVariants({ cols }), className)}
      {...props}
    />
  )
);
FormRow.displayName = "FormRow";

// ==========================================
// 7. FormDivider
// ==========================================

/**
 * Visual separator between form sections.
 * Optionally renders a label.
 *
 * @example
 * <FormDivider label="פרטי קשר" />
 */
export interface FormDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
}

export const FormDivider = React.forwardRef<HTMLDivElement, FormDividerProps>(
  ({ className, label, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 w-full select-none", className)}
      role="separator"
      {...props}
    >
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      {label && (
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  )
);
FormDivider.displayName = "FormDivider";

// ==========================================
// 8. FormSection
// ==========================================

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Section heading */
  title?: React.ReactNode;
  /** Optional supporting description beneath the title */
  description?: React.ReactNode;
}

/**
 * Logical grouping of related form fields.
 *
 * Renders a section title, optional description, and a vertical stack of children
 * with standardized spacing.
 *
 * @example
 * <FormSection title="פרטים אישיים" description="מידע בסיסי על העובד">
 *   <FormRow cols={2}>
 *     <FormFieldGroup label="שם פרטי" htmlFor="first-name" required>
 *       <Input id="first-name" />
 *     </FormFieldGroup>
 *     <FormFieldGroup label="שם משפחה" htmlFor="last-name" required>
 *       <Input id="last-name" />
 *     </FormFieldGroup>
 *   </FormRow>
 * </FormSection>
 */
export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, children, title, description, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 w-full", className)}
      {...props}
    >
      {(title || description) && (
        <div className="flex flex-col space-y-0.5 select-none">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";

// ==========================================
// 9. FormActions
// ==========================================

/**
 * Standardized action row for form submission controls.
 *
 * Primary action goes last (rightmost on LTR, leftmost on RTL).
 * On mobile, buttons stack vertically and expand full-width.
 *
 * @example
 * <FormActions>
 *   <Button variant="outline" type="button">ביטול</Button>
 *   <Button variant="primary" type="submit" loading={submitting}>שמור</Button>
 * </FormActions>
 */
export const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Mobile: full-width vertical stack
      "flex flex-col gap-2 w-full",
      // Desktop: horizontal row, right-aligned
      "sm:flex-row sm:items-center sm:justify-end sm:gap-2",
      // Ensure children expand on mobile
      "[&>button]:w-full sm:[&>button]:w-auto",
      className
    )}
    {...props}
  />
));
FormActions.displayName = "FormActions";
