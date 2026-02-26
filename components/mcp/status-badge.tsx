"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Power, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"

export type ServiceStatus = "online" | "offline" | "maintenance" | "error"

interface StatusBadgeProps {
  enabled: boolean
  status?: ServiceStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({
  enabled,
  status = enabled ? "online" : "offline",
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (!enabled) {
      return {
        label: "Disabled",
        className: "text-muted-foreground border-muted-foreground/50",
        icon: PowerOff,
      }
    }

    switch (status) {
      case "online":
        return {
          label: "Online",
          className: "text-green-500 border-green-500/50 bg-green-500/10",
          icon: CheckCircle2,
        }
      case "offline":
        return {
          label: "Offline",
          className: "text-muted-foreground border-muted-foreground/50",
          icon: XCircle,
        }
      case "maintenance":
        return {
          label: "Maintenance",
          className: "text-yellow-600 border-yellow-600/50 bg-yellow-600/10",
          icon: AlertCircle,
        }
      case "error":
        return {
          label: "Error",
          className: "text-red-500 border-red-500/50 bg-red-500/10",
          icon: XCircle,
        }
      default:
        return {
          label: "Unknown",
          className: "text-muted-foreground",
          icon: PowerOff,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 transition-colors",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}

// Simplified version for compact display
export function CompactStatusBadge({
  enabled,
  className,
}: {
  enabled: boolean
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs",
        enabled ? "text-green-500 border-green-500/50" : "text-muted-foreground",
        className
      )}
    >
      {enabled ? (
        <>
          <Power className="h-2.5 w-2.5 fill-current" />
          Enabled
        </>
      ) : (
        <>
          <PowerOff className="h-2.5 w-2.5" />
          Disabled
        </>
      )}
    </Badge>
  )
}
