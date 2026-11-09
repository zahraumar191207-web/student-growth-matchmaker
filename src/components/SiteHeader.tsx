import { Link } from "@tanstack/react-router";
import { Bookmark, Compass, PenLine, Search } from "lucide-react";

import { savedStore } from "@/lib/store";

const linkBase =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const linkActive = "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary";

export function SiteHeader() {
  const count = savedStore.useValue().items.length;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="OpportunityMate AI home">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Compass className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold leading-none tracking-tight">
            OpportunityMate<span className="text-coral"> AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          <Link
            to="/"
            className={linkBase}
            activeProps={{ className: linkActive }}
            activeOptions={{ exact: true }}
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden sm:inline">Discover</span>
          </Link>
          <Link to="/tracker" className={linkBase} activeProps={{ className: linkActive }}>
            <Bookmark className="size-4" aria-hidden />
            <span className="hidden sm:inline">Tracker</span>
            {count > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold leading-5 text-coral-foreground">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/assistant"
            search={{}}
            className={linkBase}
            activeProps={{ className: linkActive }}
          >
            <PenLine className="size-4" aria-hidden />
            <span className="hidden sm:inline">Assistant</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display font-semibold text-foreground">OpportunityMate AI</span> ·
          Built for students in the UAE and beyond.
        </p>
        <p>Always confirm dates and eligibility on the provider's website before applying.</p>
      </div>
    </footer>
  );
}
