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
    variant: "success" as const,
    icon: CheckCircle2,
  },
  pending: {
    text: "Pendente",
    variant: "warning" as const,
    icon: Clock,
  },
  rejected: {
    text: "Rejeitado",
    variant: "destructive" as const,
    icon: XCircle,
  },
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className="uppercase tracking-[0.18em] text-[10px] font-semibold"
    >
      {showIcon && <Icon className="size-3" />}
      {config.text}
    </Badge>
  )
}
