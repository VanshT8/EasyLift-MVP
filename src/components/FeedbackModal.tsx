"use client";

import { CircleCheck } from "lucide-react";
import { useId, useState } from "react";
import { addFeedback } from "@/lib/actions";
import type { FeedbackAnswer } from "@/lib/types";
import { Modal } from "./Modal";
import { Button, cx } from "./ui";

const ANSWERS: { value: FeedbackAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export function FeedbackModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Quick feedback" description="Saved on this device only.">
      <FeedbackForm onClose={onClose} onSubmitted={onSubmitted} />
    </Modal>
  );
}

function FeedbackForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (message: string) => void }) {
  const [answer, setAnswer] = useState<FeedbackAnswer | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const commentId = useId();

  if (done) {
    return (
      <div className="text-center" role="status">
        <CircleCheck className="mx-auto mb-3 size-10 text-good-ink" aria-hidden="true" />
        <p className="font-semibold">Thanks for the feedback!</p>
        <p className="mt-1 text-sm text-muted">
          It&apos;s stored in this browser only. You can export it as JSON from Settings.
        </p>
        <Button className="mt-5 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!answer) return setError("Pick Yes, Maybe, or No.");
        addFeedback(answer, comment);
        setDone(true);
        onSubmitted("Feedback saved on this device");
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Would you use EasyLift?</legend>
        <div className="grid grid-cols-3 gap-2">
          {ANSWERS.map((a) => (
            <label
              key={a.value}
              className={cx(
                "flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-soft",
                answer === a.value ? "border-brand bg-brand/15 text-ink" : "border-line-strong bg-surface-2 text-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="would-use"
                value={a.value}
                checked={answer === a.value}
                onChange={() => {
                  setAnswer(a.value);
                  setError(null);
                }}
                className="sr-only"
              />
              {a.label}
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad-ink">
            {error}
          </p>
        )}
      </fieldset>
      <div>
        <label htmlFor={commentId} className="mb-1.5 block text-sm font-medium">
          Anything else? <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id={commentId}
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What would make this useful at your gym?"
          className="w-full rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-sm placeholder:text-subtle"
        />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Send feedback
        </Button>
      </div>
    </form>
  );
}
