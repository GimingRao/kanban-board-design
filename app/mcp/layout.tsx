import React from "react"

export default function McpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full bg-background">
      {children}
    </div>
  )
}
