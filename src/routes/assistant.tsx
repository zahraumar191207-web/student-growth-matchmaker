import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Lightbulb, PenLine, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CategoryBadge, DeadlineBadge } from "@/components/opportunity-bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOC_TYPES, draftApplication } from "@/lib/ai.functions";
import { AVAILABILITY, OPPORTUNITIES, getOpportunity } from "@/lib/opportunities";
import { profileStore, savedStore } from "@/lib/store";

export const Route = createFileRoute("/assistant")({
  validateSearch: (s: Record<string, unknown>): { id?: string } =>
    typeof s["id"] === "string" ? { id: s["id"] } : {},
  head: () => ({
    meta: [
      { title: "Application Assistant — OpportunityMate AI" },
      {
        name: "description",
        content:
          "Draft motivation letters, short answers and intro emails tailored to each course, volunteering role or internship.",
      },
      { property: "og:title", content: "AI Application Assistant — OpportunityMate AI" },
      {
        property: "og:description",
        content: "Get a tailored first draft of your motivation letter in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

type DocType = keyof typeof DOC_TYPES;
type Tone = "confident" | "warm" | "formal";
type Length = "short" | "medium" | "long";

const TONES: { id: Tone; label: string }[] = [
  { id: "confident", label: "Confident" },
  { id: "warm", label: "Warm" },
  { id: "formal", label: "Formal" },
];
const LENGTHS: { id: Length; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

const PROMPTS = [
  "A project or club I led",
  "Why this cause matters to me",
  "A skill I want to build",
  "Where I see myself in 2 years",
];

function Assistant() {
  const search = Route.useSearch();
  const profile = profileStore.useValue();
  const { items } = savedStore.useValue();
  const [oppId, setOppId] = useState<string>(search.id ?? "");
  const [docType, setDocType] = useState<DocType>("motivation");
  const [tone, setTone] = useState<Tone>("confident");
  const [length, setLength] = useState<Length>("medium");
  const [highlights, setHighlights] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const draftFn = useServerFn(draftApplication);

  useEffect(() => {
    if (search.id) setOppId(search.id);
  }, [search.id]);

  const opp = oppId ? getOpportunity(oppId) : undefined;
  const savedIds = new Set(items.map((i) => i.id));
  const saved = OPPORTUNITIES.filter((o) => savedIds.has(o.id));
  const others = OPPORTUNITIES.filter((o) => !savedIds.has(o.id));

  const draft = useMutation({
    mutationFn: () =>
      draftFn({
        data: {
          profile: {
            name: profile.name,
            field: profile.field,
            location: profile.location,
            interests: profile.interests,
            availability: profile.availability,
          },
          opportunityId: oppId,
          docType,
          tone,
          length,
          highlights,
        },
      }),
    onSuccess: (res) => {
      if (res.error) toast.error(res.error);
      else setOutput(res.text);
    },
    onError: () => toast.error("The assistant couldn't respond. Please try again."),
  });

  const words = output.trim() ? output.trim().split(/\s+/).length : 0;
  const hours = AVAILABILITY.find((a) => a.id === profile.availability)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <p className="text-sm font-semibold text-primary">Application Assistant</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Write it once. Make it yours.</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Pick an opportunity, add a few honest details, and get a tailored first draft you can edit
          right here.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form
          className="space-y-5 rounded-3xl border bg-card p-5 shadow-card sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!oppId) return toast.error("Choose an opportunity first.");
            draft.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="opp">Opportunity</Label>
            <Select value={oppId || undefined} onValueChange={setOppId}>
              <SelectTrigger id="opp" className="w-full">
                <SelectValue placeholder="Choose what you're applying to" />
              </SelectTrigger>
              <SelectContent>
                {saved.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Saved</SelectLabel>
                    {saved.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>All opportunities</SelectLabel>
                  {others.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {opp && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-muted/70 p-3 text-sm">
                <CategoryBadge category={opp.category} />
                <DeadlineBadge daysLeft={opp.deadlineInDays} />
                <span className="w-full text-muted-foreground">{opp.provider}</span>
              </div>
            )}
          </div>

          <ChipGroup
            label="What are you writing?"
            options={(Object.keys(DOC_TYPES) as DocType[]).map((k) => ({
              id: k,
              label: DOC_TYPES[k],
            }))}
            value={docType}
            onChange={setDocType}
          />
          <div className="grid grid-cols-2 gap-4">
            <ChipGroup label="Tone" options={TONES} value={tone} onChange={setTone} />
            <ChipGroup label="Length" options={LENGTHS} value={length} onChange={setLength} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="highlights">What should we highlight?</Label>
            <Textarea
              id="highlights"
              value={highlights}
              maxLength={1500}
              rows={5}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="e.g. I organised a beach clean-up with my university's sustainability club and want to learn data skills for environmental research."
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setHighlights((h) => (h ? `${h.trimEnd()}\n${p}: ` : `${p}: `))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-saffron/40"
                >
                  <Lightbulb className="size-3" aria-hidden /> {p}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium">
              <UserRound className="size-4 text-muted-foreground" aria-hidden /> Using your profile
            </p>
            <p className="mt-1 text-muted-foreground">
              {profile.field || "No major set"} · {profile.location}
              {hours ? ` · ${hours}` : ""}
              {profile.interests.length > 0 ? ` · ${profile.interests.join(", ")}` : ""}
            </p>
            <Link to="/" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
              Edit profile
            </Link>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full rounded-full"
            disabled={draft.isPending}
          >
            <Sparkles /> {draft.isPending ? "Drafting…" : output ? "Write a new draft" : "Draft it for me"}
          </Button>
        </form>

        <section
          className="flex min-h-[480px] flex-col rounded-3xl border bg-gradient-panel shadow-card"
          aria-label="Your draft"
        >
          <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <PenLine className="size-4 text-primary" aria-hidden /> Your draft
              {words > 0 && <span className="font-normal text-muted-foreground">· {words} words</span>}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={!output || draft.isPending}
                onClick={() => draft.mutate()}
              >
                <RotateCcw /> Regenerate
              </Button>
              <Button
                variant="soft"
                size="sm"
                disabled={!output}
                onClick={async () => {
                  await navigator.clipboard.writeText(output);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            {draft.isPending ? (
              <div className="space-y-3" aria-label="Drafting your text">
                <p className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="size-4 animate-pulse" aria-hidden /> Tailoring your draft to{" "}
                  {opp?.provider ?? "this opportunity"}…
                </p>
                {[100, 94, 98, 70, 0, 96, 90, 85, 60].map((w, i) =>
                  w === 0 ? (
                    <div key={i} className="h-2" />
                  ) : (
                    <div key={i} className="h-4 rounded-md shimmer" style={{ width: `${w}%` }} />
                  ),
                )}
              </div>
            ) : output ? (
              <>
                <Textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  className="min-h-[380px] flex-1 resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
                  aria-label="Edit your draft"
                />
                <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                  Replace any [bracketed] placeholders with your real details before sending.
                </p>
              </>
            ) : (
              <div className="m-auto max-w-sm text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-saffron/30 text-saffron-foreground">
                  <PenLine className="size-6" aria-hidden />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">Your draft appears here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The more specific your highlights, the more <em>you</em> it sounds. We never make
                  up achievements.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={o.id}
            type="button"
            variant="chip"
            size="sm"
            data-active={value === o.id}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
