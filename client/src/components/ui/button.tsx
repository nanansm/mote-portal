import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-yellow text-green-dark rounded-full hover:bg-lime active:scale-95",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/30 rounded-full hover:bg-red-500/20",
        outline: "border border-yellow/40 text-yellow rounded-full hover:bg-yellow/10 hover:border-yellow/60",
        secondary: "bg-green-dark text-cream rounded-full border border-yellow/20 hover:border-yellow/40 hover:bg-green-dark/80",
        ghost: "text-cream/70 rounded-xl hover:bg-yellow/10 hover:text-cream",
        link: "text-yellow underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-6 py-2.5",
        sm: "h-8 px-4 py-1.5 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
