import * as React from "react";
import { cn } from "../../../lib/utils";
import { PageContainerProps } from "./types";

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, mode = "wide", ...props }, ref) => {
    const modeClasses = {
      constrained: "max-w-4xl mx-auto w-full",
      wide: "max-w-7xl mx-auto w-full",
      fluid: "w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "px-4 md:px-6 py-6 transition-all duration-300",
          modeClasses[mode],
          className
        )}
        {...props}
      />
    );
  }
);
PageContainer.displayName = "PageContainer";
