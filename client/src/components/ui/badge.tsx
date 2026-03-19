import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-yellow/40 bg-yellow/20 text-yellow",
        secondary: "border-cream/20 bg-cream/10 text-cream/70",
        destructive: "border-red-500/30 bg-red-500/20 text-red-400",
        outline: "border-yellow/40 text-yellow",
        success: "border-lime/30 bg-lime/20 text-lime",
        warning: "border-yellow/40 bg-yellow/20 text-yellow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
