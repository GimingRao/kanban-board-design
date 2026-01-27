"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GitBranch } from "lucide-react"

interface Repo {
  id: string
  name: string
  fullName: string
}

const repos: Repo[] = [
  { id: "1", name: "frontend", fullName: "company/frontend" },
  { id: "2", name: "backend", fullName: "company/backend" },
  { id: "3", name: "mobile-app", fullName: "company/mobile-app" },
  { id: "4", name: "design-system", fullName: "company/design-system" },
]

interface RepoSelectorProps {
  selectedRepo: string
  onRepoChange: (repoId: string) => void
}

export function RepoSelector({ selectedRepo, onRepoChange }: RepoSelectorProps) {
  return (
    <Select value={selectedRepo} onValueChange={onRepoChange}>
      <SelectTrigger className="w-[220px] border-border bg-secondary text-foreground">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="选择仓库" />
        </div>
      </SelectTrigger>
      <SelectContent className="border-border bg-popover">
        {repos.map((repo) => (
          <SelectItem 
            key={repo.id} 
            value={repo.id}
            className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <span className="font-mono text-sm">{repo.fullName}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
