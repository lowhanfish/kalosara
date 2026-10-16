"use client";
import { useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
export function Dialog({
  title,
  triggerLabel,
  children,
  triggerClassName,
}: {
  title: string;
  triggerLabel: string;
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  return (
    <>
      <Button
        ref={trigger}
        variant="outline"
        className={triggerClassName}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-border bg-white p-6 shadow-xl"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const nodes = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
            ),
          ).filter((node) => node.getClientRects().length > 0);
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => trigger.current?.focus()}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a[href]"))
            dialog.current?.close();
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup dialog"
            onClick={() => dialog.current?.close()}
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        {children}
      </dialog>
    </>
  );
}
