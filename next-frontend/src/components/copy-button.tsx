"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCopy}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      {copied ? "Copiado!" : "Copiar"}
    </Button>
  );
}
