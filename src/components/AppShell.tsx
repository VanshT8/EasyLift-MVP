"use client";

import { CalendarClock, Dumbbell, House, Megaphone, MessageSquareText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { GYM } from "@/lib/config";
import { useNow, useStoredState } from "@/lib/hooks";
import { AppUIProvider, useAppUI } from "./AppUI";
import { DemoBadge } from "./DemoBadge";
import { Logo, LogoMark } from "./Logo";
import { Skeleton, cx } from "./ui";

const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/equipment", label: "Equipment", icon: Dumbbell },
  { href: "/plan", label: "Plan", icon: CalendarClock },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Renders page content only once client state (localStorage + clock) is available. */
export function ReadyGate({ children }: { children: ReactNode }) {
  const state = useStoredState();
  const now = useNow();
  const ready = state !== null && now !== null && state.profile.onboarded;
  return ready ? children : <LoadingState />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const state = useStoredState();
  const router = useRouter();
  const needsWelcome = state !== null && !state.profile.onboarded;

  useEffect(() => {
    if (needsWelcome) router.replace("/");
  }, [needsWelcome, router]);

  return (
    <AppUIProvider>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-brand-strong px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <MobileHeader />
      <main id="main" className="min-h-dvh px-4 pb-28 pt-4 sm:px-6 lg:ml-64 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </AppUIProvider>
  );
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar() {
  const isActive = useActive();
  const { openReport, openFeedback } = useAppUI();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex">
      <Link href="/home" className="mb-8 rounded-lg px-2" aria-label="EasyLift home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand/15 text-ink ring-1 ring-inset ring-brand/40" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon className={cx("size-5", active && "text-brand-soft")} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Your gym</p>
          <p className="mt-1 text-sm font-semibold">{GYM.name}</p>
          <p className="mt-0.5 text-xs text-muted">Sample scenario · fictional counts</p>
          <DemoBadge className="mt-3" />
        </div>
        <button
          type="button"
          onClick={() => openReport()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Megaphone className="size-5" aria-hidden="true" />
          Report conditions
        </button>
        <button
          type="button"
          onClick={openFeedback}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          <MessageSquareText className="size-5" aria-hidden="true" />
          Give feedback
        </button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur lg:hidden">
      <Link href="/home" className="flex items-center gap-2 rounded-lg" aria-label="EasyLift home">
        <LogoMark className="h-6 w-auto" />
        <span className="font-bold tracking-tight">EasyLift</span>
      </Link>
      <DemoBadge />
    </header>
  );
}

function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-brand-soft" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
                <span className={cx("h-0.5 w-6 rounded-full", active ? "bg-brand-soft" : "bg-transparent")} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-16" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-48 lg:col-span-3" />
        <Skeleton className="h-48 lg:col-span-2" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
