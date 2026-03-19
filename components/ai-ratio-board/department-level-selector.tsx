"use client"

type LevelOption = "level2" | "level3"

interface DepartmentLevelSelectorProps {
  value: LevelOption
  onChange: (value: LevelOption) => void
  disabled?: boolean
}

const options = [
  { value: "level2" as const, label: "二级部门" },
  { value: "level3" as const, label: "三级部门" },
]

export function DepartmentLevelSelector({
  value,
  onChange,
  disabled = false,
}: DepartmentLevelSelectorProps) {
  return (
    <div className="inline-flex rounded-full border border-border/70 bg-card/80 p-1 text-xs shadow-none">
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
                ? "rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground shadow-sm"
                : "rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
