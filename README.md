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
