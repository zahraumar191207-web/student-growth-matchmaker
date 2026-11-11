import {
  AVAILABILITY,
  type AvailabilityId,
  type Category,
  type Field,
  type Interest,
  type LocationTag,
  type Opportunity,
  type ProfileLocation,
} from "./opportunities";

export interface StudentProfile {
  name: string;
  field: Field | "";
  location: ProfileLocation;
  interests: Interest[];
  availability: AvailabilityId;
  /** No degree yet and looking for paid part-time work. */
  seekingPartTime: boolean;
}

export const EMPTY_PROFILE: StudentProfile = {
  name: "",
  field: "",
  location: "Abu Dhabi",
  interests: [],
  availability: "part",
  seekingPartTime: false,
};

export interface MatchResult {
  opportunity: Opportunity;
  score: number;
  reasons: string[];
}

/**
 * Match score out of 100:
 * - Field of study: 35 for a direct match, 20 if open to any major.
 *   Part-time jobs count as a 35-point match for students seeking part-time work without a degree.
 * - Interests: 12 per shared interest, capped at 30.
 * - Location: 20 for your city, 15 for Online, 10 for Global (Online-only students: Online/Global = 20, in-person = 0).
 * - Availability: 15 if it fits your weekly hours, 5 if within 1.5x, else 0.
 */
export function scoreOpportunity(o: Opportunity, p: StudentProfile): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (o.category === "job" && p.seekingPartTime) {
    score += 35;
    reasons.push("No degree needed — fits your part-time work goal");
  } else if (p.field && o.fields.includes(p.field)) {
    score += 35;
    reasons.push(`Built for ${p.field} students`);
  } else if (o.fields.includes("Any")) {
    score += 20;
    reasons.push("Open to every major");
  }

  const shared = o.interests.filter((i) => p.interests.includes(i));
  if (shared.length > 0) {
    score += Math.min(30, shared.length * 12);
    reasons.push(`Matches your interest in ${shared.slice(0, 2).join(" & ")}`);
  }

  const loc = locationPoints(o.locations, p.location);
  score += loc.points;
  if (loc.reason) reasons.push(loc.reason);

  const maxHours = AVAILABILITY.find((a) => a.id === p.availability)?.maxHours ?? 10;
  if (o.hoursPerWeek <= maxHours) {
    score += 15;
    reasons.push(`Fits your ${maxHours === 40 ? "20+" : maxHours} hrs/week`);
  } else if (o.hoursPerWeek <= maxHours * 1.5) {
    score += 5;
  }

  return { opportunity: o, score: Math.min(100, score), reasons };
}

function locationPoints(
  tags: LocationTag[],
  where: ProfileLocation,
): { points: number; reason?: string } {
  if (where === "Online only") {
    if (tags.includes("Online") || tags.includes("Global"))
      return { points: 20, reason: "Fully online" };
    return { points: 0 };
  }
  if (tags.includes(where)) return { points: 20, reason: `Available in ${where}` };
  if (tags.includes("Online")) return { points: 15, reason: "Join online from anywhere" };
  if (tags.includes("Global")) return { points: 10 };
  return { points: 0 };
}

export type Urgency = "urgent" | "soon" | "open" | "rolling";

/** urgent: 7 days or fewer · soon: 8–30 days · open: 31+ days · rolling: no deadline. */
export function urgencyOf(daysLeft: number | null): Urgency {
  if (daysLeft === null) return "rolling";
  if (daysLeft <= 7) return "urgent";
  if (daysLeft <= 30) return "soon";
  return "open";
}

export function deadlineDate(daysLeft: number | null, today: Date = new Date()): Date | null {
  if (daysLeft === null) return null;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysLeft);
  return d;
}

export type UrgencyFilter = "any" | "week" | "month";
export type SortKey = "match" | "deadline";

export interface MatchFilters {
  category: Category | "all";
  location: LocationTag | "all";
  urgency: UrgencyFilter;
  sort: SortKey;
  query: string;
}

export const DEFAULT_FILTERS: MatchFilters = {
  category: "all",
  location: "all",
  urgency: "any",
  sort: "match",
  query: "",
};

export function filterAndRank(
  list: Opportunity[],
  profile: StudentProfile,
  f: MatchFilters,
): MatchResult[] {
  const q = f.query.trim().toLowerCase();
  const results = list
    .filter((o) => f.category === "all" || o.category === f.category)
    .filter((o) => f.location === "all" || o.locations.includes(f.location))
    .filter((o) => {
      if (f.urgency === "any") return true;
      if (o.deadlineInDays === null) return false;
      return o.deadlineInDays <= (f.urgency === "week" ? 7 : 30);
    })
    .filter(
      (o) =>
        !q ||
        `${o.title} ${o.provider} ${o.summary} ${o.interests.join(" ")}`.toLowerCase().includes(q),
    )
    .map((o) => scoreOpportunity(o, profile));

  return results.sort((a, b) => {
    if (f.sort === "deadline") {
      const da = a.opportunity.deadlineInDays ?? Number.POSITIVE_INFINITY;
      const db = b.opportunity.deadlineInDays ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
    }
    return b.score - a.score;
  });
}
