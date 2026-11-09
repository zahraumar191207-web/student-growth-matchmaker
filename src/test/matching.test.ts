import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  filterAndRank,
  scoreOpportunity,
  urgencyOf,
  type StudentProfile,
} from "@/lib/matching";
import type { Opportunity } from "@/lib/opportunities";

const base: Opportunity = {
  id: "t",
  title: "Test",
  provider: "P",
  category: "course",
  locations: ["Dubai"],
  fields: ["Business"],
  interests: ["Marketing", "Finance", "Design"],
  hoursPerWeek: 4,
  format: "",
  eligibility: "",
  deadlineInDays: 10,
  credential: "",
  summary: "",
  url: "",
  verified: true,
};

const student: StudentProfile = {
  name: "",
  field: "Business",
  location: "Dubai",
  interests: ["Marketing", "Finance", "Design"],
  availability: "part",
};

describe("match score", () => {
  it("gives 100 for a perfect field, interest, city and hours match", () => {
    expect(scoreOpportunity(base, student).score).toBe(100);
  });

  it("gives 20 (not 35) when the opportunity is open to any major", () => {
    const o = { ...base, fields: ["Any" as const], interests: [], locations: ["Sharjah" as const] };
    expect(scoreOpportunity(o, { ...student, availability: "light", field: "Engineering" }).score).toBe(
      20 + 15,
    );
  });

  it("caps interest points at 30", () => {
    const o = { ...base, fields: [], locations: ["Sharjah" as const], hoursPerWeek: 99 };
    expect(scoreOpportunity(o, student).score).toBe(30);
  });

  it("scores Online 15 for a city-based student but 20 for an online-only student", () => {
    const o = { ...base, fields: [], interests: [], locations: ["Online" as const], hoursPerWeek: 99 };
    expect(scoreOpportunity(o, student).score).toBe(15);
    expect(scoreOpportunity(o, { ...student, location: "Online only" }).score).toBe(20);
  });

  it("gives online-only students 0 location points for in-person listings", () => {
    const o = { ...base, fields: [], interests: [], hoursPerWeek: 99 };
    expect(scoreOpportunity(o, { ...student, location: "Online only" }).score).toBe(0);
  });

  it("gives 5 availability points when hours are within 1.5x of the student's limit", () => {
    const o = { ...base, fields: [], interests: [], locations: ["Sharjah" as const], hoursPerWeek: 14 };
    expect(scoreOpportunity(o, student).score).toBe(5); // limit 10 hrs, 14 <= 15
  });
});

describe("deadline urgency", () => {
  it("is urgent at 7 days or fewer, soon up to 30, open after, rolling without a date", () => {
    expect(urgencyOf(7)).toBe("urgent");
    expect(urgencyOf(8)).toBe("soon");
    expect(urgencyOf(30)).toBe("soon");
    expect(urgencyOf(31)).toBe("open");
    expect(urgencyOf(null)).toBe("rolling");
  });

  it("'closing within 7 days' filter excludes rolling and later deadlines", () => {
    const list = [
      { ...base, id: "a", deadlineInDays: 3 },
      { ...base, id: "b", deadlineInDays: 12 },
      { ...base, id: "c", deadlineInDays: null },
    ];
    const ids = filterAndRank(list, student, { ...DEFAULT_FILTERS, urgency: "week" }).map(
      (r) => r.opportunity.id,
    );
    expect(ids).toEqual(["a"]);
  });

  it("deadline sort puts the soonest first and rolling last", () => {
    const list = [
      { ...base, id: "rolling", deadlineInDays: null },
      { ...base, id: "late", deadlineInDays: 40 },
      { ...base, id: "soon", deadlineInDays: 2 },
    ];
    const ids = filterAndRank(list, student, { ...DEFAULT_FILTERS, sort: "deadline" }).map(
      (r) => r.opportunity.id,
    );
    expect(ids).toEqual(["soon", "late", "rolling"]);
  });
});
