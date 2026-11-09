import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatchFilters, SortKey, UrgencyFilter } from "@/lib/matching";
import { CATEGORY_META, type Category, type LocationTag } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

import { CATEGORY_ICON } from "./opportunity-bits";

const TABS: (Category | "all")[] = ["all", "course", "volunteer", "internship"];
const LOCATIONS: (LocationTag | "all")[] = ["all", "Online", "Abu Dhabi", "Dubai", "Sharjah", "Global"];

export function MatchFiltersBar({
  filters,
  counts,
  onChange,
}: {
  filters: MatchFilters;
  counts: Record<Category | "all", number>;
  onChange: (f: MatchFilters) => void;
}) {
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

      <div className="grid gap-3 rounded-2xl border bg-card p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search titles, providers, skills…"
            className="pl-9"
            aria-label="Search opportunities"
          />
        </div>

        <Select
          value={filters.location}
          onValueChange={(v) => onChange({ ...filters, location: v as LocationTag | "all" })}
        >
          <SelectTrigger className="w-full lg:w-44" aria-label="Location">
            <SelectValue />
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
          <SelectTrigger className="w-full lg:w-48" aria-label="Deadline">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any deadline</SelectItem>
            <SelectItem value="week">Closing within 7 days</SelectItem>
            <SelectItem value="month">Closing within 30 days</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as SortKey })}
        >
          <SelectTrigger className="w-full lg:w-44" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match">Sort: Best match</SelectItem>
            <SelectItem value="deadline">Sort: Deadline soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
