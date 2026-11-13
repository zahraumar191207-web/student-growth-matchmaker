// "Ask OpportunityMate" — deterministic intent parsing and search for the chat assistant.
// Pure functions shared by the browser (instant cards) and the server (AI reply context),
// so both always agree on what was understood and which listings are shown.
import { DEFAULT_FILTERS, type MatchFilters, type MatchResult } from "./matching";
import {
  CATEGORY_META,
  type Category,
  type Interest,
  type LocationTag,
  type Opportunity,
} from "./opportunities";

export const CHAT_MAX_CHARS = 300;

export const CHAT_STARTERS = [
  "Weekend jobs in Abu Dhabi",
  "Free AI certifications",
  "High school volunteering",
] as const;

// ---------------------------------------------------------------------------
// Input guardrails
// ---------------------------------------------------------------------------

export type ChatCheck = { ok: true; text: string; notice: string | null } | { ok: false; hint: string };

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const EMIRATES_ID = /\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g;
const PHONE = /\+?\d[\d\s-]{7,}\d/g;

/** Clean a chat message and explain kindly when it can't be used. */
export function sanitizeChatInput(raw: string): ChatCheck {
  if (!raw.trim()) {
    return { ok: false, hint: "Type a question first — or tap one of the ideas below." };
  }
  const notices: string[] = [];
  let t = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, " ");

  const beforePii = t;
  t = t.replace(EMAIL, " ").replace(EMIRATES_ID, " ").replace(PHONE, " ");
  if (t !== beforePii) {
    notices.push("I left out contact or ID details — you never need to share those here.");
  }

  t = t
    .replace(/[^\p{L}\p{N}\s.,!?'"&+\-/():%]/gu, " ")
    .replace(/([.,!?'"&+\-/():%])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const letters = (t.match(/\p{L}/gu) ?? []).length;
  if (letters === 0) {
    return {
      ok: false,
      hint: "That looks like only symbols or numbers. Try a few words, like “free coding courses in Dubai”.",
    };
  }
  if (letters < 3) {
    return {
      ok: false,
      hint: "Add a little more detail — what, where or when? e.g. “volunteering in Sharjah”.",
    };
  }

  if (t.length > CHAT_MAX_CHARS) {
    const cut = t.slice(0, CHAT_MAX_CHARS);
    t = cut.slice(0, Math.max(cut.lastIndexOf(" "), CHAT_MAX_CHARS - 40)).trim();
    notices.push(`That was a long one, so I focused on the first ${CHAT_MAX_CHARS} characters.`);
  }

  return { ok: true, text: t, notice: notices.length ? notices.join(" ") : null };
}

// ---------------------------------------------------------------------------
// Intent parsing
// ---------------------------------------------------------------------------

export type EducationLevel = "high-school" | "university" | "no-degree";

export interface ChatIntent {
  locations: LocationTag[];
  categories: Category[];
  interests: Interest[];
  keywords: string[];
  education: EducationLevel | null;
  age: number | null;
  weekend: boolean;
  wantsCertificate: boolean;
  /** Other meaningful words (e.g. "blockchain") checked against listing text. */
  freeTerms: string[];
  /** A place we don't list (e.g. Ajman, London) and where we looked instead. */
  place: { asked: string; nearest: LocationTag[]; inUae: boolean } | null;
  unsupported: UnsupportedTopic[];
  /** No recognisable opportunity signal at all. */
  offTopic: boolean;
}

export type UnsupportedTopic = "scholarship" | "full-time" | "visa" | "degree";

const LOCATION_TERMS: [LocationTag, string[]][] = [
  ["Abu Dhabi", ["abu dhabi", "abudhabi", "auh", "al ain", "yas", "yas island", "saadiyat", "khalifa city", "mussafah"]],
  ["Dubai", ["dubai", "dxb", "deira", "jumeirah", "dubai marina", "jlt", "bur dubai"]],
  ["Sharjah", ["sharjah", "shj", "muwaileh"]],
  ["Online", ["online", "remote", "remotely", "from home", "virtual", "virtually", "anywhere", "wfh"]],
];

const NEAR_UAE: [string, string[], LocationTag[]][] = [
  ["Ajman", ["ajman"], ["Sharjah", "Dubai"]],
  ["Umm Al Quwain", ["umm al quwain", "uaq"], ["Sharjah"]],
  ["Ras Al Khaimah", ["ras al khaimah", "rak"], ["Dubai", "Online"]],
  ["Fujairah", ["fujairah"], ["Sharjah", "Online"]],
];

const ABROAD = [
  "london", "uk", "england", "usa", "america", "united states", "canada", "india", "pakistan",
  "egypt", "saudi", "riyadh", "jeddah", "qatar", "doha", "oman", "muscat", "kuwait", "bahrain",
  "europe", "germany", "france", "australia", "abroad", "overseas", "turkey", "malaysia",
];

const CATEGORY_TERMS: [Category, string[]][] = [
  ["course", ["course", "courses", "certificate", "certificates", "certification", "certifications", "certified", "learn", "learning", "class", "classes", "mooc", "tutorial", "tutorials", "credential", "badge"]],
  ["volunteer", ["volunteer", "volunteering", "volunteers", "community service", "charity", "ngo", "give back", "giving back", "help out", "service hours", "social work"]],
  ["internship", ["intern", "interns", "internship", "internships", "workshop", "workshops", "placement", "shadowing", "bootcamp", "hackathon", "work experience", "skill building"]],
  ["job", ["job", "jobs", "part-time", "part time", "parttime", "earn", "earning", "money", "paid", "salary", "wage", "shift", "shifts", "gig", "gigs", "hiring", "employment", "marshal", "usher", "barista", "cashier", "retail", "sales associate", "invigilator", "customer service", "call centre", "call center", "promoter", "traffic", "parking", "waiter"]],
];

const INTEREST_TERMS: [Interest, string[]][] = [
  ["AI", ["ai", "artificial intelligence", "machine learning", "ml", "chatgpt", "genai", "generative ai"]],
  ["Coding", ["coding", "code", "programming", "python", "javascript", "java", "web development", "web dev", "developer", "software", "html", "app development"]],
  ["Data", ["data", "analytics", "sql", "excel", "statistics", "data science"]],
  ["Cybersecurity", ["cyber", "cybersecurity", "security", "hacking", "ethical hacking"]],
  ["Entrepreneurship", ["startup", "startups", "entrepreneur", "entrepreneurship", "founder", "own business"]],
  ["Finance", ["finance", "fintech", "accounting", "banking", "investing"]],
  ["Marketing", ["marketing", "social media", "seo", "sales", "advertising", "branding"]],
  ["Design", ["design", "designer", "canva", "ux", "ui", "graphic", "graphics", "creative"]],
  ["Healthcare", ["health", "healthcare", "medical", "medicine", "hospital", "nursing", "first aid"]],
  ["Sustainability", ["environment", "environmental", "climate", "sustainability", "sustainable", "mangrove", "mangroves", "trees", "green", "nature"]],
  ["Community", ["community", "social impact", "humanitarian"]],
  ["Teaching", ["teach", "teaching", "tutor", "tutoring", "education", "mentor", "mentoring", "invigilator"]],
  ["Research", ["research", "lab", "labs"]],
  ["Leadership", ["leadership", "leader", "lead", "management"]],
  ["Events", ["event", "events", "festival", "festivals", "concert", "concerts", "f1", "formula 1", "race", "expo", "exhibition", "gitex", "usher", "marshal", "traffic", "parking", "theme park"]],
];

/** Specific words worth matching against listing text (titles, summaries, formats). */
const KEYWORDS = [
  "python", "sql", "excel", "javascript", "web", "cloud", "azure", "machine learning", "cyber",
  "seo", "canva", "climate", "mangrove", "tutor", "traffic", "parking", "usher", "barista",
  "retail", "invigilator", "theme park", "exhibition", "concert", "festival", "fintech",
  "red crescent", "customer service", "social media", "infection", "harvard", "google", "microsoft", "ibm",
];

const HIGH_SCHOOL = ["high school", "highschool", "secondary school", "school student", "grade 9", "grade 10", "grade 11", "grade 12", "year 10", "year 11", "year 12", "year 13", "teen", "teenager", "igcse", "a level", "a levels", "sixth form"];
const NO_DEGREE = ["no degree", "without a degree", "without degree", "don't have a degree", "dont have a degree", "no qualifications", "haven't graduated", "havent graduated", "not graduated", "dropout", "gap year"];
const UNIVERSITY = ["university", "uni", "college", "undergrad", "undergraduate", "bachelor", "bachelors", "freshman", "sophomore", "first year", "final year"];
const WEEKEND = ["weekend", "weekends", "saturday", "saturdays", "sunday", "sundays"];

const UNSUPPORTED_TERMS: [UnsupportedTopic, string[]][] = [
  ["scholarship", ["scholarship", "scholarships", "tuition", "funding", "grant", "grants", "financial aid"]],
  ["full-time", ["full-time", "full time", "fulltime", "permanent job", "career job"]],
  ["visa", ["visa", "residency", "work permit", "sponsorship", "sponsor"]],
  ["degree", ["mba", "masters", "master's", "phd", "doctorate", "degree program", "degree programme", "diploma"]],
];

const STOPWORDS = new Set(
  (
    "i i'm im am a an the for to in on at of and or with me my mine find finding looking look want wanna need needs any some free best good great show give get getting can could would should will you your please what which where when how who why about is are was there here student students opportunity opportunities something anything things thing like do does did help near around this that these those week weeks hours hour time times new more also just really start starting beginner beginners basic basics intro introduction them they it its from by as be been have has had uae emirates city town local program programs programme programmes skill skills all available recommend suggest tell list year years old now today soon summer winter spring evening evenings morning mornings day days daily flexible hi hello hey thanks thank kind ideas idea option options way ways kind sort type types into over under than then only very much many lot lots so if not no yes but too our we us one two three short long study studying studies while during abroad apply applying join joining"
  ).split(" "),
);

function normalise(text: string) {
  return ` ${text.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}' +-]/gu, " ").replace(/\s+/g, " ")} `;
}

function has(norm: string, term: string) {
  return norm.includes(` ${term} `);
}

function anyOf(norm: string, terms: readonly string[]) {
  return terms.some((t) => has(norm, t));
}

const DICTIONARY_WORDS = new Set(
  [
    ...LOCATION_TERMS.flatMap(([, t]) => t),
    ...NEAR_UAE.flatMap(([, t]) => t),
    ...ABROAD,
    ...CATEGORY_TERMS.flatMap(([, t]) => t),
    ...INTEREST_TERMS.flatMap(([, t]) => t),
    ...KEYWORDS,
    ...HIGH_SCHOOL,
    ...NO_DEGREE,
    ...UNIVERSITY,
    ...WEEKEND,
    ...UNSUPPORTED_TERMS.flatMap(([, t]) => t),
    "work",
    "working",
  ].flatMap((t) => t.split(/[ -]/)),
);

const PAY_WORDS = ["paid", "money", "earn", "earning", "salary", "wage"];

export function parseIntent(message: string): ChatIntent {
  const n = normalise(message);

  const locations: LocationTag[] = [];
  for (const [tag, terms] of LOCATION_TERMS) if (anyOf(n, terms)) locations.push(tag);

  let place: ChatIntent["place"] = null;
  for (const [name, terms, nearest] of NEAR_UAE) {
    if (anyOf(n, terms)) {
      place = { asked: name, nearest, inUae: true };
      break;
    }
  }
  if (!place) {
    const abroad = ABROAD.find((t) => has(n, t));
    if (abroad) {
      place = {
        asked: abroad.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bUk\b|\bUsa\b/, (m) => m.toUpperCase()),
        nearest: ["Online"],
        inUae: false,
      };
    }
  }
  if (place && locations.length === 0) locations.push(...place.nearest);

  const unsupported: UnsupportedTopic[] = [];
  for (const [topic, terms] of UNSUPPORTED_TERMS) if (anyOf(n, terms)) unsupported.push(topic);

  const categories: Category[] = [];
  for (const [cat, terms] of CATEGORY_TERMS) {
    // "work permit" is a visa question, not a job request.
    if (cat === "job" && unsupported.includes("visa") && !anyOf(n, ["job", "jobs", "part-time", "part time"])) continue;
    if (!anyOf(n, terms)) continue;
    // "paid internship" is an internship, not a job request.
    if (cat === "job" && categories.length > 0 && !anyOf(n, terms.filter((t) => !PAY_WORDS.includes(t)))) continue;
    categories.push(cat);
  }
  // Plain "work" means a job unless something more specific was asked.
  if (categories.length === 0 && anyOf(n, ["work", "working"]) && !has(n, "volunteer work")) {
    categories.push("job");
  }
  if (unsupported.includes("full-time") && !categories.includes("job")) categories.push("job");
  if (categories.length === 0) {
    if (unsupported.includes("scholarship")) categories.push("course", "internship");
    else if (unsupported.includes("degree")) categories.push("course");
    else if (unsupported.includes("visa")) categories.push("job");
  }

  const interests: Interest[] = [];
  for (const [interest, terms] of INTEREST_TERMS) if (anyOf(n, terms)) interests.push(interest);

  const keywords = KEYWORDS.filter((k) => has(n, k));

  const ageMatch =
    n.match(/ (1[3-9]|2\d) ?(?:years? old|yrs? old|yo|y\/o) /) ?? n.match(/ i'?m (1[3-9]|2\d) /) ?? n.match(/ i am (1[3-9]|2\d) /);
  const age = ageMatch?.[1] ? Number(ageMatch[1]) : null;

  let education: EducationLevel | null = null;
  if (anyOf(n, HIGH_SCHOOL) || (age !== null && age < 18)) education = "high-school";
  else if (anyOf(n, NO_DEGREE)) education = "no-degree";
  else if (anyOf(n, UNIVERSITY)) education = "university";

  const weekend = anyOf(n, WEEKEND);
  const wantsCertificate = /certif|credential/.test(n);
  const freeTerms = [
    ...new Set(
      n
        .split(" ")
        .map((w) => w.replace(/^[-+']+|[-+']+$/g, ""))
        .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !STOPWORDS.has(w) && !DICTIONARY_WORDS.has(w)),
    ),
  ].slice(0, 4);

  const offTopic =
    locations.length === 0 &&
    categories.length === 0 &&
    interests.length === 0 &&
    keywords.length === 0 &&
    education === null &&
    unsupported.length === 0 &&
    !weekend;

  return {
    locations,
    categories,
    interests,
    keywords,
    education,
    age,
    weekend,
    wantsCertificate,
    freeTerms,
    place,
    unsupported,
    offTopic,
  };
}

/**
 * Follow-ups like "what about in Dubai?" keep the earlier topic: when the new message names no
 * category or topic, inherit them from the previous question.
 */
export function mergeIntent(prev: ChatIntent | null, next: ChatIntent): ChatIntent {
  if (!prev) return next;
  const followUp =
    next.categories.length === 0 &&
    next.interests.length === 0 &&
    next.keywords.length === 0 &&
    next.freeTerms.length === 0;
  if (!followUp || next.offTopic) return next;
  return {
    ...next,
    categories: prev.categories,
    interests: prev.interests,
    keywords: prev.keywords,
    freeTerms: prev.freeTerms,
    wantsCertificate: next.wantsCertificate || prev.wantsCertificate,
    locations: next.locations.length ? next.locations : prev.locations,
    education: next.education ?? prev.education,
    age: next.age ?? prev.age,
    weekend: next.weekend || prev.weekend,
  };
}

/** Short labels for "what I understood" chips. */
export function intentLabels(i: ChatIntent): string[] {
  const out: string[] = [];
  if (i.place) out.push(i.place.asked);
  else out.push(...i.locations);
  if (i.education === "high-school") out.push(i.age ? `Age ${i.age}` : "High school");
  if (i.education === "no-degree") out.push("No degree yet");
  if (i.education === "university") out.push("University");
  out.push(...i.categories.map((c) => CATEGORY_META[c].short));
  const topics = [...i.interests, ...i.keywords.filter((k) => !i.interests.some((x) => x.toLowerCase() === k))];
  out.push(...topics.slice(0, 4).map((t) => (t.length <= 3 ? t.toUpperCase() : t[0]!.toUpperCase() + t.slice(1))));
  if (i.weekend) out.push("Weekends");
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type Relaxation = "location" | "topic" | "category";

export interface ChatSearch {
  intent: ChatIntent;
  mode: "match" | "closest" | "starter";
  matches: MatchResult[];
  /** Under-18 friendly alternatives when the main picks need you to be 18+. */
  youthPicks: MatchResult[];
  relaxed: Relaxation[];
  /** Plain-language notes on limits, relaxations and fallbacks (shown to the AI and the student). */
  notes: string[];
}

const MAX_RESULTS = 6;
/** A balanced, beginner-friendly mix shown when a question isn't about opportunities. */
const STARTER_IDS = ["elements-of-ai", "volunteers-ae", "forage-deloitte", "campus-assistant"];

function minAge(o: Opportunity): number | null {
  const m = o.eligibility.match(/(\d{2})\+/);
  return m?.[1] ? Number(m[1]) : null;
}

const UNI_ONLY = /undergrad|university students|enrolled students|students years|students in years|uae nationals only/i;

function isAdultOnly(o: Opportunity) {
  return (minAge(o) ?? 0) >= 18 || UNI_ONLY.test(o.eligibility);
}

function listingText(o: Opportunity) {
  return normalise(`${o.title} ${o.provider} ${o.summary} ${o.format} ${o.credential} ${o.eligibility}`);
}

function inLocation(o: Opportunity, wanted: LocationTag[], allowOnline: boolean) {
  if (wanted.length === 0) return true;
  const tags = new Set<LocationTag>(o.locations);
  if (tags.has("Global")) tags.add("Online");
  if (wanted.some((w) => tags.has(w))) return true;
  return allowOnline && tags.has("Online");
}

function scoreForChat(o: Opportunity, i: ChatIntent): MatchResult & { topicHits: number } {
  let score = 30;
  const reasons: string[] = [];
  const text = listingText(o);

  if (i.categories.includes(o.category)) score += 15;

  const hereFor = i.locations.find((l) => l !== "Online" && o.locations.includes(l));
  if (hereFor) {
    score += 15;
    reasons.push(`In ${hereFor}`);
  } else if (o.locations.includes("Online") || o.locations.includes("Global")) {
    score += i.locations.includes("Online") ? 15 : 5;
    reasons.push("Join online");
  }

  const shared = o.interests.filter((x) => i.interests.includes(x));
  const words = [...i.keywords, ...i.freeTerms].filter((k) => has(text, k));
  if (shared.length) {
    score += Math.min(24, shared.length * 12);
    reasons.push(`Matches ${shared.slice(0, 2).join(" & ")}`);
  }
  if (words.length) {
    score += Math.min(20, words.length * 12);
    reasons.push(`Mentions “${words[0]}”`);
  }

  if (i.wantsCertificate && /certif/i.test(o.credential)) {
    score += 5;
    reasons.push(o.category === "job" ? "Includes training" : "Free certificate");
  }

  if (i.weekend && /weekend|saturday/i.test(`${o.format} ${o.title} ${o.summary}`)) {
    score += 12;
    reasons.push("Weekend-friendly");
  } else if (i.weekend && /self-paced|flexible|you set your hours|remote/i.test(o.format)) {
    score += 6;
    reasons.push("Fits around your week");
  }

  if (i.education === "high-school") {
    const age = minAge(o);
    if ((age !== null && age >= 18) || UNI_ONLY.test(o.eligibility)) {
      score -= 25;
      reasons.unshift(age !== null && age >= 18 ? "18+ only — one to plan for" : "For university students");
    } else if (/16\+|open to (all|everyone)|all ages|students 16/i.test(o.eligibility)) {
      score += 10;
      reasons.unshift(/16\+|students 16/i.test(o.eligibility) ? "Open from age 16" : "Open to school students");
    }
  }
  if (i.education === "no-degree" && (o.category === "job" || /no degree/i.test(o.eligibility))) {
    score += 12;
    reasons.unshift("No degree needed");
  }

  return {
    opportunity: o,
    score: Math.max(5, Math.min(99, score)),
    reasons: [...new Set(reasons)],
    topicHits: shared.length + words.length,
  };
}

function rank(list: (MatchResult & { topicHits: number })[]) {
  return list.sort(
    (a, b) =>
      b.score - a.score ||
      (a.opportunity.deadlineInDays ?? 999) - (b.opportunity.deadlineInDays ?? 999),
  );
}

const strip = ({ topicHits: _t, ...m }: MatchResult & { topicHits: number }): MatchResult => m;

const UNSUPPORTED_NOTE: Record<UnsupportedTopic, string> = {
  scholarship:
    "OpportunityMate doesn't list scholarships or tuition funding yet — free certificates and internships are a great way to strengthen a scholarship application.",
  "full-time":
    "We focus on part-time and student-friendly roles that fit around your studies, rather than full-time jobs.",
  visa: "I can't advise on visas or permits — your university careers office or MoHRE can. Many paid student jobs here need a UAE part-time work permit.",
  degree:
    "We list free courses and certificates rather than degree programmes like a master's or MBA.",
};

export function searchOpportunities(list: Opportunity[], intent: ChatIntent): ChatSearch {
  const notes: string[] = [];
  const relaxed: Relaxation[] = [];

  if (intent.place) {
    notes.push(
      intent.place.inUae
        ? `We don't have listings in ${intent.place.asked} yet, so I looked in ${intent.place.nearest.join(" and ")} instead.`
        : `OpportunityMate focuses on the UAE and online, so here are options you can join online from ${intent.place.asked}.`,
    );
  }
  for (const u of intent.unsupported) notes.push(UNSUPPORTED_NOTE[u]);

  const termHit = intent.freeTerms.some((t) => list.some((o) => has(listingText(o), t)));
  if (intent.offTopic && !termHit) {
    notes.push(
      "I'm built to find free courses, volunteering, internships and part-time jobs for students in the UAE and online — here's a starter mix.",
    );
    const picks = STARTER_IDS.map((id) => list.find((o) => o.id === id))
      .filter((o) => o !== undefined)
      .map((o) => strip(scoreForChat(o, intent)));
    return { intent, mode: "starter", matches: picks, youthPicks: [], relaxed, notes };
  }

  const wantsTopic = intent.interests.length > 0 || intent.keywords.length > 0 || intent.freeTerms.length > 0;
  const tiers: { relax: Relaxation | null; allowOnline: boolean; needTopic: boolean; useCategory: boolean }[] = [
    { relax: null, allowOnline: false, needTopic: wantsTopic, useCategory: true },
    { relax: "location", allowOnline: true, needTopic: wantsTopic, useCategory: true },
    { relax: "category", allowOnline: true, needTopic: wantsTopic, useCategory: false },
    { relax: "topic", allowOnline: true, needTopic: false, useCategory: true },
    { relax: "topic", allowOnline: true, needTopic: false, useCategory: false },
  ];

  let found: (MatchResult & { topicHits: number })[] = [];
  for (const tier of tiers) {
    found = rank(
      list
        .filter((o) => !tier.useCategory || intent.categories.length === 0 || intent.categories.includes(o.category))
        .filter((o) => inLocation(o, intent.locations, tier.allowOnline))
        .map((o) => scoreForChat(o, intent))
        .filter((m) => !tier.needTopic || m.topicHits > 0),
    );
    if (found.length > 0) {
      if (tier.relax) relaxed.push(tier.relax);
      break;
    }
  }
  if (found.length === 0) found = rank(list.map((o) => scoreForChat(o, intent)));

  const where = intent.locations.filter((l) => l !== "Online").join(" or ");
  const what = intent.categories.length
    ? intent.categories.map((c) => CATEGORY_META[c].short.toLowerCase()).join(" or ")
    : "opportunities";
  const topic = [...intent.keywords, ...intent.interests, ...intent.freeTerms][0];
  if (relaxed.includes("location") && where) {
    notes.push(`Nothing matched exactly in ${where}, so I added online options you can join from anywhere.`);
  }
  if (relaxed.includes("topic") && topic) {
    notes.push(`I couldn't find anything about “${topic}” right now, so here are the closest ${what} instead.`);
  }
  if (relaxed.includes("category") && intent.categories.length) {
    notes.push(`There are no ${what} about “${topic ?? "that"}” yet, so I found related picks in other categories.`);
  }

  // Thin results after relaxing: top up with the closest picks from the asked category.
  if (relaxed.length > 0 && found.length < 3) {
    const have = new Set(found.map((m) => m.opportunity.id));
    const extra = rank(
      list
        .filter((o) => !have.has(o.id))
        .filter((o) => intent.categories.length === 0 || intent.categories.includes(o.category))
        .filter((o) => inLocation(o, intent.locations, true))
        .map((o) => scoreForChat(o, intent)),
    );
    found = [...found, ...extra].slice(0, 4);
  }

  // School students: when enough picks are open to them, hide the 18+ / university-only ones.
  if (intent.education === "high-school") {
    const open = found.filter((m) => !isAdultOnly(m.opportunity));
    if (open.length >= 3) found = open;
  }
  const matches = found.slice(0, MAX_RESULTS).map(strip);

  let youthPicks: MatchResult[] = [];
  if (intent.education === "high-school") {
    const adultOnly = matches.filter((m) => isAdultOnly(m.opportunity));
    if (adultOnly.some((m) => m.opportunity.category === "job")) {
      notes.push(
        "Most paid jobs in the UAE need you to be 18+ with a part-time work permit, so treat those as ones to plan for — the volunteering below is open to younger students now.",
      );
    } else if (adultOnly.length > 0) {
      notes.push("A few of these are for 18+ or university students — start with the ones marked open to you.");
    }
    if (adultOnly.length >= Math.ceil(matches.length / 2)) {
      const shown = new Set(matches.map((m) => m.opportunity.id));
      youthPicks = rank(
        list
          .filter((o) => !shown.has(o.id) && o.category !== "job")
          .filter((o) => !isAdultOnly(o))
          .filter((o) => inLocation(o, intent.locations, true))
          .map((o) => scoreForChat(o, intent)),
      )
        .slice(0, 3)
        .map(strip);
    }
  }

  const mode = relaxed.length > 0 || intent.place || intent.unsupported.length ? "closest" : "match";
  return { intent, mode, matches, youthPicks, relaxed, notes };
}

/** Run the full pipeline for one message (optionally continuing an earlier question). */
export function answerQuery(list: Opportunity[], message: string, previous?: string | null) {
  const prev = previous ? parseIntent(previous) : null;
  return searchOpportunities(list, mergeIntent(prev, parseIntent(message)));
}

/** Friendly reply used instantly and whenever the AI is unavailable. */
export function composeReply(s: ChatSearch): string {
  const n = s.matches.length;
  const top = s.matches[0]?.opportunity.title;
  const lead =
    s.mode === "starter"
      ? "Happy to help!"
      : s.mode === "closest"
        ? "Good question — here's the closest I can find."
        : `Great news — I found ${n} ${n === 1 ? "match" : "matches"} for you.`;
  const notes = s.notes.join(" ");
  const pick = top ? ` A strong place to start is **${top}**.` : "";
  return `${lead} ${notes}${pick} Tap Save on anything you like to track its deadline.`.replace(/\s+/g, " ").trim();
}

/** Turn a chat question into the main page's filters ("Apply to all results"). */
export function filtersFromSearch(s: ChatSearch): MatchFilters {
  const i = s.intent;
  const city = i.locations.find((l) => l !== "Online");
  const location = city ?? (i.locations.includes("Online") ? "Online" : "all");
  return {
    ...DEFAULT_FILTERS,
    category: i.categories.length === 1 ? i.categories[0]! : "all",
    location,
    query: s.relaxed.includes("topic") ? "" : (i.keywords[0] ?? ""),
  };
}
