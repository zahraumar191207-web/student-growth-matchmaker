import { Link } from "@tanstack/react-router";
import {
  Award,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  Clock,
  ExternalLink,
  MapPin,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchResult } from "@/lib/matching";
import { toggleSaved, useIsSaved } from "@/lib/store";

import { CategoryBadge, DeadlineBadge, DeadlineDate, MatchRing } from "./opportunity-bits";

export function OpportunityCard({
  match,
  aiReason,
  index = 0,
}: {
  match: MatchResult;
  aiReason?: string | undefined;
  index?: number;
}) {
  const o = match.opportunity;
  const saved = useIsSaved(o.id);

  return (
    <article
      className="group flex flex-col rounded-2xl border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift animate-rise"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={o.category} />
            <Badge variant="free" className="rounded-full">
              Free
            </Badge>
            {o.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <ShieldCheck className="size-3.5" aria-hidden /> Verified provider
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">{o.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{o.provider}</p>
        </div>
        <MatchRing score={match.score} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{o.summary}</p>

      {(aiReason || match.reasons.length > 0) && (
        <div className="mt-3 rounded-xl bg-primary-soft/60 px-3 py-2 text-sm text-primary">
          <p className="flex gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{aiReason ?? match.reasons.slice(0, 2).join(" · ")}</span>
          </p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="flex flex-wrap gap-1">
            {o.locations.map((l) => (
              <Badge key={l} variant="tag" className="rounded-full px-2 py-0">
                {l}
              </Badge>
            ))}
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Commitment</dt>
          <dd>
            ~{o.hoursPerWeek} hrs/week · {o.format}
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Eligibility</dt>
          <dd>{o.eligibility}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <dt className="sr-only">Credential</dt>
          <dd>{o.credential}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden />
            <DeadlineDate daysLeft={o.deadlineInDays} />
            <DeadlineBadge daysLeft={o.deadlineInDays} />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={saved ? "soft" : "outline"}
              size="sm"
              aria-pressed={saved}
              onClick={() => {
                toggleSaved(o.id);
                toast(saved ? "Removed from your tracker" : "Saved to your tracker", {
                  description: o.title,
                });
              }}
            >
              {saved ? <BookmarkCheck /> : <Bookmark />}
              {saved ? "Saved" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/assistant" search={{ id: o.id }}>
                <PenLine /> Draft
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a href={o.url} target="_blank" rel="noreferrer" aria-label={`Visit ${o.provider}`}>
                <ExternalLink />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card" aria-hidden>
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded-full shimmer" />
          <div className="h-6 w-4/5 rounded-md shimmer" />
          <div className="h-4 w-1/2 rounded-md shimmer" />
        </div>
        <div className="size-[52px] rounded-full shimmer" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded-md shimmer" />
        <div className="h-4 w-11/12 rounded-md shimmer" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl shimmer" />
      <div className="mt-5 h-8 w-full rounded-md shimmer" />
    </div>
  );
}
