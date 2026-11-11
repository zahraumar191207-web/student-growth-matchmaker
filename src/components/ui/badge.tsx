import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        course: "border-transparent bg-cat-course-soft text-cat-course",
        volunteer: "border-transparent bg-cat-volunteer-soft text-cat-volunteer",
        internship: "border-transparent bg-cat-internship-soft text-cat-internship",
        job: "border-transparent bg-cat-job-soft text-cat-job",
        "loc-abudhabi": "border-transparent bg-loc-abudhabi-soft text-loc-abudhabi",
        "loc-dubai": "border-transparent bg-loc-dubai-soft text-loc-dubai",
        "loc-sharjah": "border-transparent bg-loc-sharjah-soft text-loc-sharjah",
        "loc-online": "border-transparent bg-loc-online-soft text-loc-online",
        paid: "border-transparent bg-cat-job text-primary-foreground",
        urgent: "border-transparent bg-urgent-soft text-urgent",
        soon: "border-transparent bg-warning-soft text-warning",
        open: "border-transparent bg-success-soft text-success",
        rolling: "border-transparent bg-muted text-muted-foreground",
        tag: "border-border bg-card font-medium text-muted-foreground",
        free: "border-transparent bg-success text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
