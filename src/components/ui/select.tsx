import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Styled native select - reliable, accessible, and looks like a real dropdown.
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-input bg-card pr-9 pl-3 text-sm text-foreground outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { Select };
