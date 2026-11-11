// Evaluation "exam set": 15 student scenarios with the listing a careers advisor would expect
// to see in the top 3. Run with `bunx vitest run src/test/match-eval.test.ts`.
import { describe, expect, it } from "vitest";

import { DEFAULT_FILTERS, filterAndRank, type StudentProfile } from "@/lib/matching";
import { OPPORTUNITIES } from "@/lib/opportunities";

const p = (o: Partial<StudentProfile>): StudentProfile => ({
  name: "",
  field: "",
  location: "Abu Dhabi",
  interests: [],
  availability: "part",
  seekingPartTime: false,
  ...o,
});

const SCENARIOS: { name: string; profile: StudentProfile; expectInTop3: string }[] = [
  {
    name: "CS · Abu Dhabi · AI research, full-time",
    profile: p({ field: "Computer Science", interests: ["AI", "Research"], availability: "full" }),
    expectInTop3: "mbzuai-ugrip",
  },
  {
    name: "Business · Dubai · marketing",
    profile: p({
      field: "Business",
      location: "Dubai",
      interests: ["Marketing", "Entrepreneurship"],
    }),
    expectInTop3: "google-digital-marketing",
  },
  {
    name: "Health · Abu Dhabi",
    profile: p({ field: "Health Sciences", interests: ["Healthcare", "Research"] }),
    expectInTop3: "health-shadowing",
  },
  {
    name: "Environmental · Sharjah",
    profile: p({
      field: "Environmental Science",
      location: "Sharjah",
      interests: ["Sustainability"],
      availability: "half",
    }),
    expectInTop3: "uncc-climate",
  },
  {
    name: "Education · Dubai · light hours",
    profile: p({
      field: "Education",
      location: "Dubai",
      interests: ["Teaching", "Community"],
      availability: "light",
    }),
    expectInTop3: "dubai-cares",
  },
  {
    name: "Design · online only",
    profile: p({
      field: "Arts & Design",
      location: "Online only",
      interests: ["Design", "Marketing"],
      availability: "light",
    }),
    expectInTop3: "canva-design",
  },
  {
    name: "Law · Abu Dhabi · community",
    profile: p({ field: "Law & Social Sciences", interests: ["Community", "Leadership"] }),
    expectInTop3: "maan-ad",
  },
  {
    name: "Engineering · Sharjah · sustainability",
    profile: p({
      field: "Engineering",
      location: "Sharjah",
      interests: ["Sustainability", "Research"],
      availability: "full",
    }),
    expectInTop3: "srtip-innovation",
  },
  {
    name: "Media · Dubai",
    profile: p({
      field: "Media & Communication",
      location: "Dubai",
      interests: ["Marketing", "Design"],
    }),
    expectInTop3: "in5-design",
  },
  {
    name: "CS · online only · cybersecurity",
    profile: p({
      field: "Computer Science",
      location: "Online only",
      interests: ["Cybersecurity", "Coding"],
      availability: "light",
    }),
    expectInTop3: "ibm-cyber",
  },
  {
    name: "No major, no interests · Abu Dhabi (fallback)",
    profile: p({}),
    expectInTop3: "erc-youth",
  },
  {
    name: "Business · Abu Dhabi · finance",
    profile: p({ field: "Business", interests: ["Finance", "Entrepreneurship"] }),
    expectInTop3: "adgm-fintech",
  },
  {
    name: "No degree · Abu Dhabi · events, part-time",
    profile: p({ interests: ["Events"], availability: "half", seekingPartTime: true }),
    expectInTop3: "traffic-marshal-yas",
  },
  {
    name: "No degree · Dubai · events, part-time",
    profile: p({
      field: "Business",
      location: "Dubai",
      interests: ["Events", "Community"],
      availability: "half",
      seekingPartTime: true,
    }),
    expectInTop3: "parking-marshal-dubai",
  },
  {
    name: "No degree · online · tutoring, part-time",
    profile: p({
      field: "Education",
      location: "Online only",
      interests: ["Teaching"],
      seekingPartTime: true,
    }),
    expectInTop3: "peer-tutor-online",
  },
];

describe("matchmaker evaluation set", () => {
  it.each(SCENARIOS)("$name → $expectInTop3 in top 3", ({ profile, expectInTop3 }) => {
    const top3 = filterAndRank(OPPORTUNITIES, profile, DEFAULT_FILTERS)
      .slice(0, 3)
      .map((r) => r.opportunity.id);
    expect(top3).toContain(expectInTop3);
  });

  it("never returns an empty list for any scenario", () => {
    for (const s of SCENARIOS) {
      expect(filterAndRank(OPPORTUNITIES, s.profile, DEFAULT_FILTERS).length).toBeGreaterThan(0);
    }
  });

  it("puts part-time jobs on top for students seeking part-time work in a city", () => {
    const top = filterAndRank(OPPORTUNITIES, SCENARIOS[13]!.profile, DEFAULT_FILTERS)[0];
    expect(top?.opportunity.category).toBe("job");
  });
});
