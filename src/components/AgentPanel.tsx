import { Bot, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  "Reading your profile",
  "Scoring every opportunity",
  "Ranking by fit & deadline",
  "Writing your personal briefing",
];

export function AgentPanel({
  hasMatched,
  thinking,
  loadingInsights,
  summary,
  error,
  name,
  total,
}: {
  hasMatched: boolean;
  thinking: boolean;
  loadingInsights: boolean;
  summary: string | undefined;
  error: string | null;
  name: string;
  total: number;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!thinking) return;
    setStep(0);
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, 2)), 380);
    return () => window.clearInterval(t);
  }, [thinking]);

  const activeStep = thinking ? step : loadingInsights ? 3 : 4;

  if (!hasMatched) {
    return (
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-2xl font-bold sm:text-3xl">Popular with students right now</h2>
        <p className="text-muted-foreground">
          Fill in your profile above and the matchmaker will re-rank all {total} listings for you.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border bg-gradient-panel shadow-card">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
        <div className="flex items-start gap-3 lg:w-80 lg:shrink-0">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-ink-foreground">
            <Bot className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold">
              {name ? `${name}, here are your matches` : "Your matches are in"}
            </h2>
            <ol className="mt-3 space-y-1.5 text-sm" aria-label="Matchmaker progress">
              {STEPS.map((s, i) => {
                const done = i < activeStep;
                const running = i === activeStep;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      done ? "text-foreground" : running ? "text-primary" : "text-muted-foreground/60",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="size-4 text-success" aria-hidden />
                    ) : running ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <span className="size-4 rounded-full border-2 border-current" aria-hidden />
                    )}
                    {s}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border bg-card p-4 sm:p-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" aria-hidden /> Advisor briefing
          </p>
          {loadingInsights || thinking ? (
            <div className="space-y-2" aria-label="Writing your briefing">
              <div className="h-4 w-full rounded-md shimmer" />
              <div className="h-4 w-5/6 rounded-md shimmer" />
              <div className="h-4 w-2/3 rounded-md shimmer" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              {error} Your matches below are still ranked for you.
            </p>
          ) : summary ? (
            <p className="text-base leading-relaxed text-foreground animate-rise">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Press “Find my matches” to get a personal briefing on your top picks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
