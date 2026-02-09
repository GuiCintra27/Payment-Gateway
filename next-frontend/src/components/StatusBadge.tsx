import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

export type InvoiceStatus = "approved" | "pending" | "rejected"

interface StatusBadgeProps {
  status: InvoiceStatus
  showIcon?: boolean
}

const statusConfig = {
  approved: {
    text: "Aprovado",
    icon: CheckCircle2,
    style: {
      borderColor: "var(--success-border)",
      backgroundColor: "var(--success-bg)",
      color: "var(--success-text)",
    },
  },
  pending: {
    text: "Pendente",
    icon: Clock,
    style: {
      borderColor: "var(--warning-border)",
      backgroundColor: "var(--warning-bg)",
      color: "var(--warning-text)",
    },
  },
  rejected: {
    text: "Rejeitado",
    icon: XCircle,
    style: {
      borderColor: "var(--danger-border)",
      backgroundColor: "var(--danger-bg)",
      color: "var(--danger-text)",
    },
  },
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className="uppercase tracking-[0.18em] text-[10px] font-semibold"
      style={config.style}
    >
      {showIcon && <Icon className="size-3" />}
      {config.text}
    </Badge>
  )
}
