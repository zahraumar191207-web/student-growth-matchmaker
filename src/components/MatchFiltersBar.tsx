import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_FILTERS, type MatchFilters, type SortKey, type UrgencyFilter } from "@/lib/matching";
import { CATEGORY_META, type Category, type LocationTag } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

import { CATEGORY_ICON } from "./opportunity-bits";

const TABS: (Category | "all")[] = ["all", "course", "volunteer", "internship", "job"];

const ACTIVE_TRIGGER = "border-primary bg-primary-soft/60 font-semibold text-primary";

/** Keep search to plain words: letters, numbers, spaces and basic punctuation, max 60 chars. */
export function sanitizeQuery(q: string) {
  return q.replace(/[^\p{L}\p{N}\s&+.'-]/gu, "").slice(0, 60);
}
const LOCATIONS: (LocationTag | "all")[] = ["all", "Online", "Abu Dhabi", "Dubai", "Sharjah", "Global"];

const URGENCY_LABEL: Record<UrgencyFilter, string> = {
  any: "Any deadline",
  week: "Closing within 7 days",
  month: "Closing within 30 days",
};
const SORT_LABEL: Record<SortKey, string> = {
  match: "Sort: Best match",
  deadline: "Sort: Deadline soonest",
};

export function MatchFiltersBar({
  filters,
  counts,
  onChange,
}: {
  filters: MatchFilters;
  counts: Record<Category | "all", number>;
  onChange: (f: MatchFilters) => void;
}) {
  const isFiltered =
    filters.location !== DEFAULT_FILTERS.location ||
    filters.urgency !== DEFAULT_FILTERS.urgency ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.query !== "";

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Opportunity categories"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {TABS.map((t) => {
          const active = filters.category === t;
          const Icon = t === "all" ? null : CATEGORY_ICON[t];
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => onChange({ ...filters, category: t })}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "border-ink bg-ink text-ink-foreground shadow-card"
                  : "bg-card text-foreground hover:border-primary/40",
              )}
            >
              {Icon && <Icon className="size-4" aria-hidden />}
              {t === "all" ? "All matches" : CATEGORY_META[t].label}
              <span
                className={cn(
                  "rounded-full px-2 text-xs leading-5",
                  active ? "bg-ink-foreground/15" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[t]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: sanitizeQuery(e.target.value) })}
            maxLength={60}
            placeholder="Search titles, providers, skills…"
            className={cn("pl-9 pr-10", filters.query && "border-primary")}
            aria-label="Search opportunities"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select
          value={filters.location}
          onValueChange={(v) => onChange({ ...filters, location: v as LocationTag | "all" })}
        >
          <SelectTrigger
            className={cn("w-full lg:w-44", filters.location !== "all" && ACTIVE_TRIGGER)}
            aria-label="Location"
          >
            <SelectValue>{filters.location === "all" ? "All locations" : filters.location}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l === "all" ? "All locations" : l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.urgency}
          onValueChange={(v) => onChange({ ...filters, urgency: v as UrgencyFilter })}
        >
          <SelectTrigger
            className={cn("w-full lg:w-48", filters.urgency !== "any" && ACTIVE_TRIGGER)}
            aria-label="Deadline"
          >
            <SelectValue>{URGENCY_LABEL[filters.urgency]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(URGENCY_LABEL) as UrgencyFilter[]).map((k) => (
              <SelectItem key={k} value={k}>
                {URGENCY_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as SortKey })}
        >
          <SelectTrigger
            className={cn("w-full lg:w-44", filters.sort !== "match" && ACTIVE_TRIGGER)}
            aria-label="Sort by"
          >
            <SelectValue>{SORT_LABEL[filters.sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORT_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl px-4 sm:col-span-2 lg:col-span-1 lg:h-9 lg:w-auto"
          disabled={!isFiltered}
          onClick={() => onChange({ ...DEFAULT_FILTERS, category: filters.category })}
        >
          <RotateCcw /> Reset
        </Button>
      </div>
    </div>
  );
}
