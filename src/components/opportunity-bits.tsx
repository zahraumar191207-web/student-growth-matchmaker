import { BookOpen, Briefcase, HeartHandshake, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { deadlineDate, urgencyOf } from "@/lib/matching";
import { CATEGORY_META, type Category } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  course: BookOpen,
  volunteer: HeartHandshake,
  internship: Briefcase,
};

export function CategoryBadge({ category }: { category: Category }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <Badge variant={category} className="gap-1 rounded-full">
      <Icon className="size-3" aria-hidden />
      {CATEGORY_META[category].short}
    </Badge>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatShortDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function deadlineText(daysLeft: number | null) {
  if (daysLeft === null) return "Rolling · self-paced";
  if (daysLeft === 0) return "Closes today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}

export function DeadlineBadge({
  daysLeft,
  className,
}: {
  daysLeft: number | null;
  className?: string;
}) {
  const urgency = urgencyOf(daysLeft);
  return (
    <Badge variant={urgency} className={cn("gap-1.5 rounded-full", className)}>
      {urgency === "urgent" && (
        <span className="size-1.5 rounded-full bg-urgent animate-pulse-dot" aria-hidden />
      )}
      {deadlineText(daysLeft)}
    </Badge>
  );
}

export function DeadlineDate({ daysLeft }: { daysLeft: number | null }) {
  const d = deadlineDate(daysLeft);
  if (!d) return <span>No fixed deadline</span>;
  return <span suppressHydrationWarning>{formatShortDate(d)}</span>;
}

export function MatchRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${score}% match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn(
            "fill-none transition-[stroke-dashoffset] duration-700",
            score >= 70 ? "stroke-primary" : score >= 45 ? "stroke-saffron" : "stroke-coral",
          )}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold">
        {score}
        <span className="sr-only">%</span>
      </span>
    </div>
  );
}
