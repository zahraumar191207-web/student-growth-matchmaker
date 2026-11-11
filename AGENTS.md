<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Opportunity listings live in `src/lib/opportunities.ts` as curated static data with deadlines stored as day offsets from today, so countdowns stay fresh without a backend.
- Match scoring is deterministic client-side code in `src/lib/matching.ts` (covered by `src/test/matching.test.ts`); the AI only writes explanations and drafts, never the ranking itself.
- AI calls go through `src/lib/ai.server.ts` (Lovable AI Gateway SDK, Responses surface) and are exposed only via server functions in `src/lib/ai.functions.ts`; client-shared constants stay out of `.functions.ts`.
- Student profile and saved tracker items persist in localStorage via `useSyncExternalStore` stores in `src/lib/store.ts`; no accounts exist yet.
- Radix `SelectValue` gets explicit children so the selected label renders during SSR.
- Client libraries are pre-bundled via `vite.optimizeDeps.include` in `vite.config.ts`; late dependency discovery re-optimizes mid-session and loads two React copies (null hook dispatcher crash). Add new client packages there.
- Thumbs up/down feedback is stored only on-device (`feedbackStore`); AI logs record label, latency and sizes only, never prompts, outputs or names.
