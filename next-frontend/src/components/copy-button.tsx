"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopy}
      className="w-full"
    >
      {copied ? (
        <>
          <Check className="size-4 text-success" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copiar API Key
        </>
      )}
    </Button>
  )
}
