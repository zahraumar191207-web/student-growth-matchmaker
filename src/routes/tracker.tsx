import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlarmClock,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  PenLine,
  Search,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { CategoryBadge, DeadlineBadge, DeadlineDate } from "@/components/opportunity-bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOpportunity, type Opportunity } from "@/lib/opportunities";
import {
  SAVED_STATUS_META,
  savedStore,
  setSavedStatus,
  toggleSaved,
  type SavedItem,
  type SavedStatus,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tracker")({
  head: () => ({
    meta: [
      { title: "Application Tracker — OpportunityMate AI" },
      {
        name: "description",
        content:
          "Track saved courses, volunteering and internships, see upcoming deadlines and move applications from interested to submitted.",
      },
      { property: "og:title", content: "Application & Deadline Tracker — OpportunityMate AI" },
      {
        property: "og:description",
        content: "Keep every saved opportunity and deadline in one student-friendly dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tracker,
});

const COLUMNS: SavedStatus[] = ["interested", "applying", "submitted"];

type Row = SavedItem & { o: Opportunity };

function Tracker() {
  const { items } = savedStore.useValue();
  const rows: Row[] = items
    .map((i) => {
      const o = getOpportunity(i.id);
      return o ? { ...i, o } : null;
    })
    .filter((r): r is Row => r !== null)
    .sort(
      (a, b) =>
        (a.o.deadlineInDays ?? Number.POSITIVE_INFINITY) -
        (b.o.deadlineInDays ?? Number.POSITIVE_INFINITY),
    );

  const closingSoon = rows.filter(
    (r) => r.status !== "submitted" && r.o.deadlineInDays !== null && r.o.deadlineInDays <= 7,
  );
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const progress = rows.length ? Math.round((submitted / rows.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Your application tracker</h1>
          <p className="mt-1 text-muted-foreground">
            Everything you've saved, ordered by the nearest deadline.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-full">
          <Link to="/">
            <Search /> Find more
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Bookmark />} label="Saved" value={rows.length} />
        <Stat
          icon={<AlarmClock />}
          label="Closing in 7 days"
          value={closingSoon.length}
          tone={closingSoon.length > 0 ? "urgent" : "default"}
        />
        <Stat
          icon={<PenLine />}
          label="Drafting"
          value={rows.filter((r) => r.status === "applying").length}
        />
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" aria-hidden /> Submitted
          </p>
          <p className="mt-1 font-display text-3xl font-bold">
            {submitted}
            <span className="text-base font-medium text-muted-foreground">/{rows.length}</span>
          </p>
          <Progress value={progress} className="mt-2 h-1.5" aria-label="Submission progress" />
        </div>
      </div>

      {closingSoon.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-urgent/20 bg-urgent-soft p-4 text-sm">
          <AlarmClock className="mt-0.5 size-5 shrink-0 text-urgent" aria-hidden />
          <p>
            <span className="font-semibold text-urgent">Heads up:</span>{" "}
            {closingSoon.map((r) => r.o.title).join(", ")}{" "}
            {closingSoon.length === 1 ? "closes" : "close"} within a week. Use the Assistant to get
            a draft ready today.
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed bg-card p-10 text-center sm:p-16">
          <Bookmark className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Tap “Save” on any opportunity and it lands here with a live deadline countdown.
          </p>
          <Button variant="hero" asChild className="mt-6 rounded-full">
            <Link to="/">Discover opportunities</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colRows = rows.filter((r) => r.status === col);
            return (
              <section key={col} className="rounded-3xl bg-muted/60 p-3 sm:p-4">
                <h2 className="mb-3 flex items-center justify-between px-1 text-base font-bold">
                  {SAVED_STATUS_META[col].label}
                  <span className="rounded-full bg-card px-2 text-xs font-semibold leading-6 text-muted-foreground">
                    {colRows.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {colRows.length === 0 && (
                    <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      Nothing here yet
                    </p>
                  )}
                  {colRows.map((r) => (
                    <TrackerItem key={r.id} row={r} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: "default" | "urgent";
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4",
          tone === "urgent" && "[&_svg]:text-urgent",
        )}
      >
        {icon} {label}
      </p>
      <p className={cn("mt-1 font-display text-3xl font-bold", tone === "urgent" && "text-urgent")}>
        {value}
      </p>
    </div>
  );
}

function TrackerItem({ row }: { row: Row }) {
  const { o } = row;
  return (
    <article className="rounded-2xl border bg-card p-4 shadow-card animate-rise">
      <div className="flex items-start justify-between gap-2">
        <CategoryBadge category={o.category} />
        <DeadlineBadge daysLeft={o.deadlineInDays} />
      </div>
      <h3 className="mt-2 font-semibold leading-snug">{o.title}</h3>
      <p className="text-sm text-muted-foreground">{o.provider}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Deadline: <DeadlineDate daysLeft={o.deadlineInDays} />
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={row.status} onValueChange={(v) => setSavedStatus(o.id, v as SavedStatus)}>
          <SelectTrigger className="h-8 w-36 text-xs" aria-label={`Status for ${o.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((s) => (
              <SelectItem key={s} value={s}>
                {SAVED_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link
              to="/assistant"
              search={{ id: o.id }}
              aria-label={`Draft application for ${o.title}`}
            >
              <PenLine />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <a href={o.url} target="_blank" rel="noreferrer" aria-label={`Visit ${o.provider}`}>
              <ExternalLink />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => toggleSaved(o.id)}
            aria-label={`Remove ${o.title}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}
