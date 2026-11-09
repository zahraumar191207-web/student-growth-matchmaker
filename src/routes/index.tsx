import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Globe2, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AgentPanel } from "@/components/AgentPanel";
import { MatchFiltersBar } from "@/components/MatchFiltersBar";
import { OpportunityCard, OpportunityCardSkeleton } from "@/components/OpportunityCard";
import { ProfileBar } from "@/components/ProfileBar";
import heroImg from "@/assets/hero-students.jpg";
import { getMatchInsights } from "@/lib/ai.functions";
import {
  DEFAULT_FILTERS,
  filterAndRank,
  type MatchFilters,
  type StudentProfile,
} from "@/lib/matching";
import { OPPORTUNITIES } from "@/lib/opportunities";
import { profileStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpportunityMate AI — Find free courses & volunteering in the UAE" },
      {
        name: "description",
        content:
          "Enter your major, city and interests to get AI-matched free courses, certificates, volunteering and internships across Abu Dhabi, Dubai, Sharjah and online.",
      },
      { property: "og:title", content: "OpportunityMate AI — Your opportunity matchmaker" },
      {
        property: "og:description",
        content:
          "AI-matched free courses, recognised certificates and verified volunteering for university students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

type Insights = { summary: string; picks: { id: string; reason: string }[]; error: string | null };

function Discover() {
  const stored = profileStore.useValue();
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_FILTERS);
  const [thinking, setThinking] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const insightsFn = useServerFn(getMatchInsights);

  const insights = useMutation<Insights, Error, { profile: StudentProfile; ids: string[] }>({
    mutationFn: (vars) => insightsFn({ data: vars }),
  });

  const profile: StudentProfile = stored;
  const results = useMemo(
    () => filterAndRank(OPPORTUNITIES, profile, filters),
    [profile, filters],
  );
  const counts = useMemo(() => {
    const base = filterAndRank(OPPORTUNITIES, profile, { ...filters, category: "all" });
    return {
      all: base.length,
      course: base.filter((r) => r.opportunity.category === "course").length,
      volunteer: base.filter((r) => r.opportunity.category === "volunteer").length,
      internship: base.filter((r) => r.opportunity.category === "internship").length,
    };
  }, [profile, filters]);

  const aiReasons = useMemo(() => {
    const m = new Map<string, string>();
    insights.data?.picks.forEach((p) => m.set(p.id, p.reason));
    return m;
  }, [insights.data]);

  const runMatch = (p: StudentProfile) => {
    profileStore.set({ ...p, hasMatched: true });
    setFilters(DEFAULT_FILTERS);
    setThinking(true);
    window.setTimeout(() => setThinking(false), 1200);
    const top = filterAndRank(OPPORTUNITIES, p, DEFAULT_FILTERS)
      .slice(0, 6)
      .map((r) => r.opportunity.id);
    insights.mutate({ profile: p, ids: top });
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Three university students walking across a campus at golden hour with the UAE skyline behind them"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20 lg:pt-28">
          <div className="max-w-2xl rounded-3xl bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden /> AI opportunity matchmaker
            </p>
            <h1 className="text-balance-safe text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              Your next big step is{" "}
              <span className="bg-gradient-warm bg-clip-text text-transparent">free</span> — let's
              find it.
            </h1>
            <p className="mt-4 max-w-xl text-base text-foreground/75 sm:text-lg">
              Free online courses, recognised certificates and verified volunteering — matched to
              your major, your city and the hours you actually have.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-foreground/80">
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-success" aria-hidden /> {OPPORTUNITIES.length}{" "}
                curated listings
              </li>
              <li className="flex items-center gap-1.5">
                <Globe2 className="size-4 text-primary" aria-hidden /> Abu Dhabi · Dubai · Sharjah ·
                Online
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-2 max-w-7xl px-4 sm:px-6">
        <ProfileBar profile={profile} busy={thinking} onSubmit={runMatch} />
      </div>

      <section ref={resultsRef} className="mx-auto mt-12 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <AgentPanel
          hasMatched={stored.hasMatched}
          thinking={thinking}
          loadingInsights={insights.isPending}
          summary={insights.data?.summary}
          error={insights.data?.error ?? (insights.isError ? "The advisor couldn't respond." : null)}
          name={profile.name}
          total={OPPORTUNITIES.length}
        />

        <MatchFiltersBar filters={filters} counts={counts} onChange={setFilters} />

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          {thinking
            ? Array.from({ length: 6 }, (_, i) => <OpportunityCardSkeleton key={i} />)
            : results.map((r, i) => (
                <OpportunityCard
                  key={r.opportunity.id}
                  match={r}
                  index={i}
                  aiReason={aiReasons.get(r.opportunity.id)}
                />
              ))}
        </div>

        {!thinking && results.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center">
            <p className="font-display text-lg font-semibold">No matches with these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different location or widen the deadline window.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
