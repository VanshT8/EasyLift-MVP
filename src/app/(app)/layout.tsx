import { AppShell } from "@/components/AppShell";

// Page content depends on this browser's localStorage and clock, so it renders after
// hydration (behind a skeleton) rather than in the prerendered shell.
export const instant = false;

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
