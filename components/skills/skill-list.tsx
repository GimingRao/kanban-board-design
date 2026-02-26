"use client"

import { cn } from "@/lib/utils"
import type { Skill } from "@/lib/types/skill"
import { SkillCard } from "./skill-card-enhanced"

interface SkillListProps {
  skills: Skill[]
  onViewDetails: (skill: Skill) => void
  onEdit?: (skill: Skill) => void
  onDelete?: (skill: Skill) => void
  viewMode?: "grid" | "list"
  className?: string
}

export function SkillList({
  skills,
  onViewDetails,
  onEdit,
  onDelete,
  viewMode = "grid",
  className,
}: SkillListProps) {
  if (skills.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col gap-3",
        className
      )}
    >
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          viewMode={viewMode}
        />
      ))}
    </div>
  )
}
