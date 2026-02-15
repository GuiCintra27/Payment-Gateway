"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

type PendingAutoRefreshProps = {
  enabled: boolean
  intervalMs?: number
}

export function PendingAutoRefresh({
  enabled,
  intervalMs = 3000,
}: PendingAutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const intervalID = window.setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => {
      window.clearInterval(intervalID)
    }
  }, [enabled, intervalMs, router])

  return null
}
