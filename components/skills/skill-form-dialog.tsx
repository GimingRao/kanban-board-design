"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Skill, SkillCategory, SkillFormData } from "@/lib/types/skill"
import { createSkill, updateSkill } from "@/lib/api/skills"
import { toast } from "sonner"

interface SkillFormDialogProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  categories: SkillCategory[]
}

export function SkillFormDialog({
  skill,
  open,
  onOpenChange,
  onSuccess,
  categories,
}: SkillFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<SkillFormData>({
    code: "",
    name: "",
    description: "",
    category_id: undefined,
    status: "active",
    tags: [],
    levels: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [levelName, setLevelName] = useState("")
  const [levelDesc, setLevelDesc] = useState("")
  const [levelPoints, setLevelPoints] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (skill) {
      setFormData({
        code: skill.code,
        name: skill.name,
        description: skill.description || "",
        category_id: skill.category_id || undefined,
        status: skill.status,
        tags: skill.tags || [],
        levels: skill.levels || [],
      })
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        category_id: undefined,
        status: "active",
        tags: [],
        levels: [],
      })
    }
    setErrors({})
  }, [skill, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = "技能编码不能为空"
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = "技能编码只能包含小写字母、数字和连字符"
    }

    if (!formData.name.trim()) {
      newErrors.name = "技能名称不能为空"
    }

    if (!formData.description?.trim()) {
      newErrors.description = "技能描述不能为空"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const result = skill
        ? await updateSkill(skill.id, formData)
        : await createSkill(formData)

      if (result.success) {
        onSuccess()
      } else if (result.error) {
        toast.error(skill ? "更新技能失败" : "创建技能失败", {
          description: result.error.message,
        })
      }
    } catch (error) {
      toast.error(skill ? "更新技能失败" : "创建技能失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    })
  }

  const handleAddLevel = () => {
    if (!levelName.trim()) return

    const newLevel = {
      id: levelName.toLowerCase().replace(/\s+/g, "-"),
      name: levelName,
      description: levelDesc || undefined,
      required_points: levelPoints ? parseInt(levelPoints) : undefined,
    }

    setFormData({
      ...formData,
      levels: [...(formData.levels || []), newLevel],
    })

    setLevelName("")
    setLevelDesc("")
    setLevelPoints("")
  }

  const handleRemoveLevel = (levelId: string) => {
    setFormData({
      ...formData,
      levels: formData.levels?.filter((l) => l.id !== levelId) || [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{skill ? "编辑技能" : "创建新技能"}</DialogTitle>
          <DialogDescription>
            {skill
              ? "修改技能信息和配置"
              : "填写技能信息以创建新的可复用技能模块"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">
                  技能编码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="my-awesome-skill"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className={cn(errors.code && "border-destructive")}
                  disabled={!!skill} // 编码创建后不可修改
                />
                {errors.code && (
                  <p className="text-sm text-destructive mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">
                  技能名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="我的超棒技能"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={cn(errors.name && "border-destructive")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">
                  技能描述 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="描述这个技能的功能和用途..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className={cn(errors.description && "border-destructive")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">所属分类</Label>
                <Select
                  value={formData.category_id?.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category_id: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">未激活</SelectItem>
                    <SelectItem value="deprecated">已废弃</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* 标签 */}
            <div className="space-y-3">
              <Label>标签</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="添加标签..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* 等级 */}
            <div className="space-y-3">
              <Label>技能等级</Label>
              <div className="space-y-2">
                <Input
                  placeholder="等级名称 (如: 基础)"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                />
                <Input
                  placeholder="等级描述 (可选)"
                  value={levelDesc}
                  onChange={(e) => setLevelDesc(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="所需积分 (可选)"
                  value={levelPoints}
                  onChange={(e) => setLevelPoints(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddLevel}
                  disabled={!levelName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加等级
                </Button>
              </div>
              {formData.levels && formData.levels.length > 0 && (
                <div className="space-y-2">
                  {formData.levels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium capitalize">{level.name}</div>
                        {level.description && (
                          <div className="text-sm text-muted-foreground">
                            {level.description}
                          </div>
                        )}
                        {level.required_points && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {level.required_points} 积分
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLevel(level.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {skill ? "保存更改" : "创建技能"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
