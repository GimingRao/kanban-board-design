"use client"

import { Header } from "@/components/dashboard/header"

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header activeTab="skills" onTabChange={() => {}} />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
