import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md active:scale-[0.98]",
        outline: "border-2 border-border bg-background hover:bg-muted hover:border-accent/50 active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-muted hover:text-foreground active:scale-[0.98]",
        link: "text-accent underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]",
        hero: "bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:shadow-accent hover:-translate-y-0.5 active:translate-y-0 font-bold tracking-wide btn-neon",
        "hero-outline": "border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm active:scale-[0.98] hover:border-accent/50 hover:shadow-accent",
        "hero-secondary": "bg-gradient-to-r from-[hsl(180_100%_50%)] to-[hsl(270_80%_65%)] text-white shadow-lg hover:shadow-xl hover:shadow-neon-cyan hover:-translate-y-0.5 active:translate-y-0 font-bold tracking-wide btn-neon-cyan",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-md active:scale-[0.98]",
        glass: "bg-white/80 backdrop-blur-xl border border-border/50 text-foreground hover:bg-white/90 shadow-md active:scale-[0.98]",
        premium: "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 font-bold",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
