# OpportunityMate AI

AI matchmaker that helps university students in the UAE find free courses, recognised
certificates, verified volunteering, internships and part-time jobs that need no degree.

## How it works

- **Matchmaker:** a profile (major, city, interests, weekly hours, "no degree yet / part-time
  work") is scored against every listing out of 100 — field 35, interests 30, location 20,
  availability 15. Ranking is deterministic and tested.
- **AI advisor & Application Assistant:** Lovable AI writes the match briefing and drafts
  motivation letters / cover notes, with on-topic guardrails and privacy-safe logs (no prompts
  or names logged).
- **Tracker & ratings:** saved items, statuses and thumbs up/down stay on the student's device.

## Run & test

```sh
bun install
bun run dev                                  # app on http://localhost:8080
bunx vitest run                              # all tests
bunx vitest run src/test/match-eval.test.ts  # 15-scenario evaluation set
```

---

# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

# OpportunityMate AI 🇦🇪
**Tagline:** An agentic AI matchmaking platform connecting UAE university and high school students with free certified courses, verified volunteering roles, and flexible part-time jobs.

## 🚀 Live Application & Demo
- **Live App (Lovable):** https://student-growth-matchmaker.lovable.app
- **Tech Stack:** Lovable.dev (React, TypeScript, Tailwind CSS, Agentic Prompt Routing)

## 🎯 Problem & Solution
Students in the UAE—especially high schoolers and university undergraduates—struggle to find legitimate, verified opportunities tailored to their exact Emirate, schedule, and academic level without getting lost on generic job boards. 

**OpportunityMate AI** solves this through an interactive, guardrail-protected AI assistant that curates real, accessible opportunities across three pillars:
1. **Free Certified Courses:** Skill-building courses with recognized certificates across tech, business, and sustainability (e.g., Coursera, edX, Hub71 workshops).
2. **Verified UAE Volunteering:** Community and sustainability initiatives across Abu Dhabi, Dubai, and Sharjah with participation certificates (e.g., Goumbook).
3. **Student Earn & Learn:** Flexible, entry-level part-time roles accessible to pre-degree and high school students (event support, brand ambassadors, venue operations).

## ✨ Key Features
- **Ask OpportunityMate AI (Conversational Matcher):** Natural-language chat interface with starter prompt chips allowing students to describe their goals and receive instant, structured recommendations.
- **Smart Filtering & Match Cards:** Displays clear eligibility ("Open to every major", "Open to all ages"), Emirate tags, time commitment (`~2 hrs/week`), deadlines, and direct source links.
- **Application & Resume Assistant (`Draft`):** One-click drafting for tailored motivation letters and resume bullet points.
- **Opportunity Tracker (`Save`):** Bookmarking system to track deadlines and saved opportunities.
- **Built-In Quality Feedback:** Thumbs-up/down match rating on every recommendation card to continuously refine match relevance.

## 🛡️ Guardrails & Evaluation
- **Precision & Speed:** Validated across 15+ diverse UAE student personas (high schoolers, STEM majors, business students) with sub-1.5s filtering latency and empathetic fallback guidance for niche queries.
- **Privacy & Trust:** Zero personal data (PII) stored; every opportunity card links directly to its verified source organization with a reminder to confirm dates and eligibility before applying.

## 📂 Repository Structure
- `src/` — Core React & Tailwind CSS application code synced from Lovable.
- `README.md` — Project overview, architecture, live demo link, and evaluation summary.
