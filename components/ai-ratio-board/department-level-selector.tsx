"use client"

import { Button } from "@/components/ui/button"

type LevelOption = "all" | "level2" | "level3"

interface DepartmentLevelSelectorProps {
  value: LevelOption
  onChange: (value: LevelOption) => void
  disabled?: boolean
}

const options = [
  { value: "all" as const, label: "所有部门" },
  { value: "level2" as const, label: "二级部门" },
  { value: "level3" as const, label: "三级部门" },
]

export function DepartmentLevelSelector({
  value,
  onChange,
  disabled = false,
}: DepartmentLevelSelectorProps) {
  return (
    <div className="inline-flex rounded-md border border-border bg-secondary p-1 text-xs">
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? "rounded px-3 py-1.5 font-medium text-foreground"
                : "rounded px-3 py-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
