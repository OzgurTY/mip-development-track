"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available (insecure context) - silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Kopyalandı" : (label ?? "Kopyala")}
      className="press text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-accent-emerald" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
