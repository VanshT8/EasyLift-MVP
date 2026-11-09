"use client";

import { CircleCheck } from "lucide-react";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { EquipmentId } from "@/lib/types";
import { FeedbackModal } from "./FeedbackModal";
import { ReportModal } from "./ReportModal";

interface Toast {
  id: number;
  message: string;
}

interface AppUI {
  openReport: (target?: "crowd" | EquipmentId) => void;
  openFeedback: () => void;
  toast: (message: string) => void;
}

const AppUIContext = createContext<AppUI | null>(null);

export function useAppUI(): AppUI {
  const ctx = useContext(AppUIContext);
  if (!ctx) throw new Error("useAppUI must be used inside <AppUIProvider>");
  return ctx;
}

export function AppUIProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<{ open: boolean; target: "crowd" | EquipmentId }>({ open: false, target: "crowd" });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo<AppUI>(
    () => ({
      openReport: (target = "crowd") => setReport({ open: true, target }),
      openFeedback: () => setFeedbackOpen(true),
      toast,
    }),
    [toast],
  );

  return (
    <AppUIContext.Provider value={value}>
      {children}
      <ReportModal
        // Remount per open so the form starts from the requested target.
        key={`${report.target}-${report.open}`}
        open={report.open}
        initialTarget={report.target}
        onClose={() => setReport((r) => ({ ...r, open: false }))}
        onSubmitted={toast}
      />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmitted={toast} />
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-64"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex items-center gap-2 rounded-xl border border-good/30 bg-surface-3 px-4 py-3 text-sm font-medium shadow-xl shadow-black/40"
          >
            <CircleCheck className="size-4 shrink-0 text-good-ink" aria-hidden="true" />
            {t.message}
          </div>
        ))}
      </div>
    </AppUIContext.Provider>
  );
}
