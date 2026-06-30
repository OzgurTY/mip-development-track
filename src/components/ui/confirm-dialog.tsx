"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling: red confirm button + warning icon. Defaults to true. */
  danger?: boolean;
};

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation. Drop-in replacement for window.confirm:
 *   if (!(await confirm({ title, description }))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm, <ConfirmProvider> içinde kullanılmalı");
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // Single settle path: buttons call it directly; Escape/backdrop route through
  // onOpenChange. Idempotent because the resolver is cleared on first call.
  const settle = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(result);
  }, []);

  const danger = options.danger ?? true;
  const title = options.title ?? "Emin misiniz?";
  const confirmLabel = options.confirmLabel ?? (danger ? "Sil" : "Onayla");
  const cancelLabel = options.cancelLabel ?? "Vazgeç";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) settle(false);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {danger ? (
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <TriangleAlert className="size-5" />
                </span>
              ) : null}
              <div className="space-y-1.5">
                <DialogTitle>{title}</DialogTitle>
                {options.description ? (
                  <DialogDescription>{options.description}</DialogDescription>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          {/* Cancel is first in the DOM so it receives initial focus (safer for
              destructive actions: Enter cancels rather than deletes). */}
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? "destructive" : "default"}
              onClick={() => settle(true)}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
