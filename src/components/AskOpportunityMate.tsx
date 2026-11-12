import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ListFilter, MessageCircleQuestion, RotateCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import avatar from "@/assets/opportunitymate-avatar.png";
import { askOpportunityMate } from "@/lib/ai.functions";
import {
  answerQuery,
  CHAT_MAX_CHARS,
  CHAT_STARTERS,
  composeReply,
  intentLabels,
  sanitizeChatInput,
  type ChatSearch,
} from "@/lib/chat-intent";
import type { MatchResult } from "@/lib/matching";
import { OPPORTUNITIES } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

import { OpportunityCard } from "./OpportunityCard";
import { CATEGORY_ICON } from "./opportunity-bits";

const PLACEHOLDER =
  "Ask anything! e.g., 'I'm a high school student in Dubai looking for weekend event jobs' or 'Find free Python courses with certificates'...";

/** Keep the "Searching…" moment visible long enough to read. */
const MIN_SEARCH_MS = 700;

type UserTurn = { id: string; role: "user"; text: string };
type AssistantTurn = {
  id: string;
  role: "assistant";
  question: string;
  search: ChatSearch;
  labels: string[];
  searching: boolean;
  reply: string | null;
  instant: boolean;
};
type Turn = UserTurn | AssistantTurn;

let turnSeq = 0;
const nextId = () => `t${++turnSeq}`;

export function AskOpportunityMate({
  onShowInResults,
}: {
  onShowInResults: (search: ChatSearch) => void;
}) {
  const askFn = useServerFn(askOpportunityMate);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const busy = turns.some((t) => t.role === "assistant" && (t.searching || t.reply === null));
  const active = turns.find((t): t is AssistantTurn => t.role === "assistant" && t.id === activeId);

  const patch = (id: string, p: Partial<AssistantTurn>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...p } : t)));

  const send = useCallback(
    async (raw: string) => {
      if (busy) return;
      const checked = sanitizeChatInput(raw);
      if (!checked.ok) {
        setHint({ text: checked.hint, tone: "error" });
        return;
      }
      const previous =
        [...turns].reverse().find((t): t is UserTurn => t.role === "user")?.text ?? null;
      const search = answerQuery(OPPORTUNITIES, checked.text, previous);
      const id = nextId();
      setTurns((ts) => [
        ...ts,
        { id: nextId(), role: "user", text: checked.text },
        {
          id,
          role: "assistant",
          question: checked.text,
          search,
          labels: intentLabels(search.intent),
          searching: true,
          reply: null,
          instant: false,
        },
      ]);
      setActiveId(id);
      setInput("");
      setHint(checked.notice ? { text: checked.notice, tone: "info" } : null);
      timers.current.push(window.setTimeout(() => patch(id, { searching: false }), MIN_SEARCH_MS));

      try {
        const res = await askFn({ data: { message: checked.text, previous } });
        patch(id, res.reply ? { reply: res.reply } : { reply: composeReply(search), instant: true });
      } catch {
        patch(id, { reply: composeReply(search), instant: true });
      }
    },
    [askFn, busy, turns],
  );

  const showCards = (turnId: string, oppId?: string) => {
    setActiveId(turnId);
    requestAnimationFrame(() => {
      const target = oppId ? document.getElementById(`ask-card-${oppId}`) : cardsRef.current;
      (target ?? cardsRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const reset = () => {
    setTurns([]);
    setActiveId(null);
    setHint(null);
    setInput("");
  };

  const errorId = "ask-hint";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-gradient-panel px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt=""
              width={48}
              height={48}
              loading="lazy"
              className="size-12 shrink-0 rounded-2xl bg-card p-1 shadow-card"
            />
            <div>
              <h2 className="text-xl font-bold leading-tight sm:text-2xl">Ask OpportunityMate AI</h2>
              <p className="text-sm text-muted-foreground">
                Say it in your own words — I'll pick out where, when and what, then search every
                listing.
              </p>
            </div>
          </div>
          {turns.length > 0 && (
            <Button variant="outline" size="sm" className="rounded-full" onClick={reset}>
              <RotateCcw /> New chat
            </Button>
          )}
        </div>

        {turns.length > 0 && (
          <Conversation className="h-[420px] sm:h-[460px]" aria-label="Chat with OpportunityMate">
            <ConversationContent className="gap-6 px-4 py-5 sm:px-6">
              {turns.map((t) =>
                t.role === "user" ? (
                  <Message key={t.id} from="user">
                    <MessageContent className="group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-ink group-[.is-user]:text-ink-foreground">
                      {t.text}
                    </MessageContent>
                  </Message>
                ) : (
                  <AssistantMessage
                    key={t.id}
                    turn={t}
                    isActive={t.id === activeId}
                    onShow={(oppId) => showCards(t.id, oppId)}
                  />
                ),
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        <div className={cn("space-y-3 p-4 sm:p-5", turns.length > 0 && "border-t")}>
          <PromptInput
            onSubmit={(msg) => void send(msg.text)}
            className="rounded-2xl bg-background [&_[data-slot=input-group]]:rounded-2xl"
          >
            <PromptInputTextarea
              value={input}
              placeholder={PLACEHOLDER}
              aria-label="Ask OpportunityMate"
              aria-invalid={hint?.tone === "error" ? true : undefined}
              aria-describedby={errorId}
              className="min-h-20 text-base sm:text-sm"
              onChange={(e) => {
                let v = e.target.value;
                if (v.length > CHAT_MAX_CHARS) {
                  v = v.slice(0, CHAT_MAX_CHARS);
                  setHint({
                    text: `Keep it under ${CHAT_MAX_CHARS} characters — short questions get the best matches.`,
                    tone: "info",
                  });
                } else if (hint?.tone === "error") {
                  setHint(null);
                }
                setInput(v);
              }}
            />
            <PromptInputFooter className="px-3 pb-3">
              <p
                id={errorId}
                aria-live="polite"
                className={cn(
                  "min-w-0 flex-1 text-xs",
                  hint?.tone === "error" ? "font-medium text-urgent" : "text-muted-foreground",
                )}
              >
                {hint?.text ?? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-3.5" aria-hidden /> Chats stay in this tab — no
                    personal details needed.
                  </span>
                )}
              </p>
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  input.length > CHAT_MAX_CHARS * 0.9 ? "text-urgent" : "text-muted-foreground",
                )}
              >
                {input.length}/{CHAT_MAX_CHARS}
              </span>
              <PromptInputSubmit
                status={busy ? "submitted" : "ready"}
                disabled={busy}
                aria-label="Send question"
                className="rounded-full"
              />
            </PromptInputFooter>
          </PromptInput>

          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Try
            </span>
            <Suggestions className="py-0.5">
              {CHAT_STARTERS.map((s) => (
                <Suggestion
                  key={s}
                  suggestion={s}
                  disabled={busy}
                  onClick={(text) => void send(text)}
                  className="border-primary/25 bg-primary-soft/50 text-primary hover:bg-primary-soft hover:text-primary"
                />
              ))}
            </Suggestions>
          </div>
        </div>
      </div>

      {active && !active.searching && (
        <ChatResults
          ref={cardsRef}
          turn={active}
          onShowInResults={() => onShowInResults(active.search)}
        />
      )}
    </div>
  );
}

function AssistantMessage({
  turn,
  isActive,
  onShow,
}: {
  turn: AssistantTurn;
  isActive: boolean;
  onShow: (oppId?: string) => void;
}) {
  const picks = [...turn.search.matches, ...turn.search.youthPicks];
  return (
    <Message from="assistant" className="max-w-full sm:max-w-[92%]">
      <div className="flex items-start gap-3">
        <img
          src={avatar}
          alt="OpportunityMate"
          width={32}
          height={32}
          loading="lazy"
          className="mt-0.5 size-8 shrink-0 rounded-xl bg-primary-soft p-0.5"
        />
        <MessageContent className="min-w-0 flex-1 gap-3 text-[15px] leading-relaxed">
          {turn.searching ? (
            <Shimmer className="text-sm font-medium">Searching UAE opportunities...</Shimmer>
          ) : (
            <>
              {turn.labels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5" aria-label="What I understood">
                  <span className="text-xs text-muted-foreground">Understood:</span>
                  {turn.labels.map((l) => (
                    <Badge key={l} variant="outline" className="rounded-full bg-card px-2 py-0 text-xs">
                      {l}
                    </Badge>
                  ))}
                </div>
              )}

              {turn.reply === null ? (
                <Shimmer className="text-sm">Writing your answer...</Shimmer>
              ) : (
                <div className="animate-rise">
                  <MessageResponse>{turn.reply}</MessageResponse>
                  {turn.instant && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Quick answer — the AI advisor is busy, but these matches are up to date.
                    </p>
                  )}
                </div>
              )}

              {picks.length > 0 && (
                <ul className="grid gap-1.5" aria-label="Matching opportunities">
                  {picks.slice(0, 3).map((m) => (
                    <MiniPick key={m.opportunity.id} match={m} onClick={() => onShow(m.opportunity.id)} />
                  ))}
                </ul>
              )}
              {picks.length > 0 && (
                <button
                  type="button"
                  onClick={() => onShow()}
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline",
                  )}
                >
                  <ArrowDown className="size-4" aria-hidden />
                  {isActive ? `See all ${picks.length} cards below` : `Show these ${picks.length} cards`}
                </button>
              )}
            </>
          )}
        </MessageContent>
      </div>
    </Message>
  );
}

function MiniPick({ match, onClick }: { match: MatchResult; onClick: () => void }) {
  const o = match.opportunity;
  const Icon = CATEGORY_ICON[o.category];
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            `bg-cat-${o.category}-soft text-cat-${o.category}`,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{o.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {o.provider} · {o.locations.join(" / ")}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-primary-soft px-2 text-xs font-bold leading-5 text-primary">
          {match.score}%
        </span>
      </button>
    </li>
  );
}

function ChatResults({
  ref,
  turn,
  onShowInResults,
}: {
  ref: React.Ref<HTMLDivElement>;
  turn: AssistantTurn;
  onShowInResults: () => void;
}) {
  const { matches, youthPicks, mode } = turn.search;
  return (
    <div ref={ref} className="scroll-mt-24 space-y-4" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <MessageCircleQuestion className="size-3.5" aria-hidden />
            {mode === "match" ? "Matches for your question" : mode === "closest" ? "Closest options" : "Starter mix"}
          </p>
          <h3 className="mt-1 text-lg font-bold sm:text-xl">“{turn.question}”</h3>
        </div>
        {mode !== "starter" && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={onShowInResults}>
            <ListFilter /> Apply to all results
          </Button>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((m, i) => (
          <div key={m.opportunity.id} id={`ask-card-${m.opportunity.id}`} className="scroll-mt-24">
            <OpportunityCard match={m} index={i} />
          </div>
        ))}
      </div>

      {youthPicks.length > 0 && (
        <>
          <h4 className="pt-2 font-display text-base font-semibold">
            Open to under-18s — you can start these now
          </h4>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {youthPicks.map((m, i) => (
              <div key={m.opportunity.id} id={`ask-card-${m.opportunity.id}`} className="scroll-mt-24">
                <OpportunityCard match={m} index={i} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
