"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createMcpService, updateMcpService } from "@/lib/api/mcp"
import type { McpService, McpServiceType } from "@/lib/types/mcp"
import { Loader2, Plus, X } from "lucide-react"

// Form validation schema
const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  service_type: z.enum(["stdio", "sse", "websocket"]),
  command: z.string().optional(),
  args: z.string().optional(),
  url: z.string().optional(),
  enabled: z.boolean().default(false),
  timeout: z.number().min(1, "Timeout must be at least 1 second").max(300, "Timeout must be less than 300 seconds").default(30),
  tags: z.string().optional(),
  provider: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface ServiceFormProps {
  service?: McpService | null
  onSuccess: () => void
  onCancel: () => void
}

export function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(service?.tags || [])

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      service_type: service?.service_type || "stdio",
      command: service?.command || "",
      args: service?.args?.join(" ") || "",
      url: service?.url || "",
      enabled: service?.enabled ?? false,
      timeout: service?.timeout || 30,
      tags: service?.tags?.join(", ") || "",
      provider: service?.provider || "",
    },
  })

  const serviceType = form.watch("service_type")

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true)
    try {
      const data = {
        name: values.name,
        description: values.description,
        service_type: values.service_type as McpServiceType,
        command: values.service_type === "stdio" ? values.command : undefined,
        args: values.service_type === "stdio" && values.args ? values.args.split(" ").filter(Boolean) : undefined,
        url: values.service_type !== "stdio" ? values.url : undefined,
        enabled: values.enabled,
        timeout: values.timeout,
        tags: tags.length > 0 ? tags : undefined,
        provider: values.provider,
      }

      let result
      if (service) {
        result = await updateMcpService(service.id, data)
      } else {
        result = await createMcpService(data)
      }

      if (result.success) {
        toast.success(service ? "Service updated successfully" : "Service created successfully")
        onSuccess()
      } else if (result.error) {
        toast.error("Failed to save service", {
          description: result.error.message,
        })
      }
    } catch (error) {
      toast.error("Failed to save service", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., filesystem, github-tools" {...field} />
              </FormControl>
              <FormDescription>
                A unique name for this MCP service
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this service does..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description of the service functionality
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service Type */}
        <FormField
          control={form.control}
          name="service_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="stdio">STDIO (Standard Input/Output)</SelectItem>
                  <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The communication protocol for this MCP service
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* STDIO-specific fields */}
        {serviceType === "stdio" && (
          <>
            <FormField
              control={form.control}
              name="command"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., npx, python, /path/to/binary" {...field} />
                  </FormControl>
                  <FormDescription>
                    The executable command to run
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="args"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arguments</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., --arg1 value1 --arg2 value2" {...field} />
                  </FormControl>
                  <FormDescription>
                    Space-separated command arguments
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* SSE/WebSocket-specific fields */}
        {serviceType !== "stdio" && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service URL</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., https://api.example.com/mcp" {...field} />
                </FormControl>
                <FormDescription>
                  The URL endpoint for the {serviceType.toUpperCase()} service
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Timeout */}
        <FormField
          control={form.control}
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                />
              </FormControl>
              <FormDescription>
                Request timeout duration (1-300 seconds)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Provider */}
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Acme Corp" {...field} />
              </FormControl>
              <FormDescription>
                Optional provider or organization name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
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
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Enabled */}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Service</FormLabel>
                <FormDescription>
                  When enabled, this service will be available for use
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {service ? "Update Service" : "Create Service"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
