import { describe, expect, it } from "vitest";

import {
  answerQuery,
  CHAT_MAX_CHARS,
  composeReply,
  filtersFromSearch,
  sanitizeChatInput,
} from "@/lib/chat-intent";
import { OPPORTUNITIES } from "@/lib/opportunities";

describe("Ask OpportunityMate — input guardrails", () => {
  it("rejects empty submissions with a kind hint", () => {
    const r = sanitizeChatInput("   ");
    expect(r.ok).toBe(false);
  });

  it("rejects symbol-only messages", () => {
    expect(sanitizeChatInput("!!!@@@###$$$").ok).toBe(false);
  });

  it("caps long messages at 300 characters and says so", () => {
    const r = sanitizeChatInput("free python courses ".repeat(40));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.text.length).toBeLessThanOrEqual(CHAT_MAX_CHARS);
      expect(r.notice).toMatch(/300/);
    }
  });

  it("removes emails, phone numbers and Emirates ID numbers", () => {
    const r = sanitizeChatInput(
      "jobs in Dubai, email me at sara@example.com or call +971 50 123 4567, ID 784-1999-1234567-1",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.text).not.toMatch(/@|4567|784/);
      expect(r.notice).not.toBeNull();
    }
  });
});

describe("Ask OpportunityMate — understanding and fallbacks", () => {
  it("high school student asking for weekend event jobs in Dubai gets the 18+ note and youth picks", () => {
    const s = answerQuery(
      OPPORTUNITIES,
      "I'm a high school student in Dubai looking for weekend event jobs",
    );
    expect(s.intent.education).toBe("high-school");
    expect(s.intent.locations).toContain("Dubai");
    expect(s.intent.weekend).toBe(true);
    expect(s.matches.length).toBeGreaterThan(0);
    const hasYouthHelp =
      s.youthPicks.length > 0 || s.matches.some((m) => m.opportunity.category !== "job");
    expect(hasYouthHelp).toBe(true);
  });

  it("free Python courses with certificates return courses", () => {
    const s = answerQuery(OPPORTUNITIES, "Find free Python courses with certificates");
    expect(s.intent.categories).toContain("course");
    expect(s.matches.length).toBeGreaterThan(0);
    expect(s.matches.every((m) => m.opportunity.category === "course")).toBe(true);
  });

  it("an emirate we don't list (Ajman) falls back to the nearest cities", () => {
    const s = answerQuery(OPPORTUNITIES, "volunteering in Ajman");
    expect(s.mode).toBe("closest");
    expect(s.matches.length).toBeGreaterThan(0);
    expect(s.notes.join(" ")).toMatch(/Ajman/);
  });

  it("a city outside the UAE gets online options", () => {
    const s = answerQuery(OPPORTUNITIES, "internships in London");
    expect(s.mode).toBe("closest");
    expect(s.matches.length).toBeGreaterThan(0);
  });

  it("off-topic questions get a warm starter mix, never a blank answer", () => {
    const s = answerQuery(OPPORTUNITIES, "what is the best pizza topping");
    expect(s.mode).toBe("starter");
    expect(s.matches.length).toBeGreaterThan(0);
    expect(composeReply(s).length).toBeGreaterThan(0);
  });

  it("scholarship questions explain the limit and still suggest options", () => {
    const s = answerQuery(OPPORTUNITIES, "scholarships for business students");
    expect(s.notes.join(" ")).toMatch(/scholarship/i);
    expect(s.matches.length).toBeGreaterThan(0);
  });
});

describe("Ask OpportunityMate — apply to all results", () => {
  it("weekend jobs in Abu Dhabi set the Jobs tab and Abu Dhabi location", () => {
    const f = filtersFromSearch(answerQuery(OPPORTUNITIES, "Weekend jobs in Abu Dhabi"));
    expect(f.category).toBe("job");
    expect(f.location).toBe("Abu Dhabi");
  });
});
