"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GitBranch } from "lucide-react"

export interface RepoOption {
  id: string
  label: string
}

interface RepoSelectorProps {
  selectedRepo: string
  onRepoChange: (repoId: string) => void
  repos: RepoOption[]
  loading?: boolean
}

export function RepoSelector({
  selectedRepo,
  onRepoChange,
  repos,
  loading,
}: RepoSelectorProps) {
  return (
    <Select value={selectedRepo} onValueChange={onRepoChange} disabled={loading}>
      <SelectTrigger className="w-[220px] max-w-[42vw] border-border bg-secondary text-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue
            placeholder="选择仓库"
            className="block truncate font-mono text-sm"
          />
        </div>
      </SelectTrigger>
      <SelectContent className="max-w-[80vw] border-border bg-popover">
        {repos.map((repo) => (
          <SelectItem
            key={repo.id}
            value={repo.id}
            className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <span className="block max-w-[70vw] truncate font-mono text-sm">
              {repo.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
