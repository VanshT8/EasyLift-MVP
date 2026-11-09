"use client";

import { ReadyGate } from "@/components/AppShell";
import { Download, MessageSquareText, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useAppUI } from "@/components/AppUI";
import { Modal } from "@/components/Modal";
import { Button, Card, CardTitle, PageHeader } from "@/components/ui";
import { resetState, setName } from "@/lib/actions";
import { GYM } from "@/lib/config";
import { useAppData } from "@/lib/hooks";
import { toDateKey } from "@/lib/time";

export default function SettingsPage() {
  return (
    <ReadyGate>
      <SettingsView />
    </ReadyGate>
  );
}

function SettingsView() {
  const { state, now } = useAppData();
  const { toast, openFeedback } = useAppUI();
  const router = useRouter();
  const [draft, setDraft] = useState(state.profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const nameId = useId();

  const exportFeedback = () => {
    const payload = {
      app: "EasyLift demo",
      gym: GYM.name,
      exportedAt: new Date(now).toISOString(),
      note: "Feedback stored in this browser only.",
      feedback: state.feedback.map((f) => ({ ...f, createdAt: new Date(f.createdAt).toISOString() })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `easylift-feedback-${toDateKey(new Date(now))}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${state.feedback.length} feedback ${state.feedback.length === 1 ? "entry" : "entries"}`);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Everything here is stored in this browser only." />
      <div className="space-y-4">
        <Card aria-labelledby="profile-title">
          <CardTitle id="profile-title">Profile</CardTitle>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setName(draft);
              setDraft(draft.trim() || "Alex");
              toast("Name updated");
            }}
          >
            <div className="flex-1">
              <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium">
                First name
              </label>
              <input
                id={nameId}
                value={draft}
                maxLength={40}
                autoComplete="given-name"
                onChange={(e) => setDraft(e.target.value)}
                className="h-11 w-full rounded-xl border border-line-strong bg-surface-2 px-3 text-sm"
              />
            </div>
            <Button type="submit" disabled={draft.trim() === state.profile.name}>
              Save name
            </Button>
          </form>
        </Card>

        <Card aria-labelledby="feedback-title">
          <CardTitle id="feedback-title">Feedback</CardTitle>
          <p className="text-sm text-muted">
            {state.feedback.length === 0
              ? "No feedback saved on this device yet."
              : `${state.feedback.length} feedback ${state.feedback.length === 1 ? "entry" : "entries"} saved on this device.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openFeedback}>
              <MessageSquareText className="size-4" aria-hidden="true" />
              Give feedback
            </Button>
            <Button variant="secondary" onClick={exportFeedback} disabled={state.feedback.length === 0}>
              <Download className="size-4" aria-hidden="true" />
              Export as JSON
            </Button>
          </div>
        </Card>

        <Card aria-labelledby="data-title">
          <CardTitle id="data-title">Demo data</CardTitle>
          <dl className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              ["Saved plans", state.plans.length],
              ["Reports", state.reports.length],
              ["Feedback", state.feedback.length],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl bg-surface-2 p-3">
                <dt className="text-xs text-subtle">{label}</dt>
                <dd className="text-lg font-semibold">{n}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">
            {GYM.name} is a sample scenario: availability and forecasts are simulated. Data you add is not shared between
            browsers or testers.
          </p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset demo data
          </Button>
        </Card>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data?"
        description="This deletes your name, preferences, saved plans, reports, and feedback from this browser. It can't be undone."
      >
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              setConfirmReset(false);
              resetState();
              router.replace("/");
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
