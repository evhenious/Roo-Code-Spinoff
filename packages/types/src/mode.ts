import { z } from "zod"

import { deprecatedToolGroups, toolGroupsSchema } from "./tool.js"

/**
 * GroupOptions
 */

export const groupOptionsSchema = z.object({
  fileRegex: z
    .string()
    .optional()
    .refine(
      (pattern) => {
        if (!pattern) {
          return true // Optional, so empty is valid.
        }

        try {
          new RegExp(pattern)
          return true
        } catch {
          return false
        }
      },
      { message: "Invalid regular expression pattern" },
    ),
  description: z.string().optional(),
})

export type GroupOptions = z.infer<typeof groupOptionsSchema>

/**
 * GroupEntry
 */

export const groupEntrySchema = z.union([toolGroupsSchema, z.tuple([toolGroupsSchema, groupOptionsSchema])])

export type GroupEntry = z.infer<typeof groupEntrySchema>

/**
 * ModeConfig
 */

/**
 * Checks if a group entry references a deprecated tool group.
 * Handles both string entries ("browser") and tuple entries (["browser", { ... }]).
 */
function isDeprecatedGroupEntry(entry: unknown): boolean {
  if (typeof entry === "string") {
    return deprecatedToolGroups.includes(entry)
  }
  if (Array.isArray(entry) && entry.length >= 1 && typeof entry[0] === "string") {
    return deprecatedToolGroups.includes(entry[0])
  }
  return false
}

/**
 * Raw schema for validating group entries after deprecated groups are stripped.
 */
const rawGroupEntryArraySchema = z.array(groupEntrySchema).refine(
  (groups) => {
    const seen = new Set()

    return groups.every((group) => {
      // For tuples, check the group name (first element).
      const groupName = Array.isArray(group) ? group[0] : group

      if (seen.has(groupName)) {
        return false
      }

      seen.add(groupName)
      return true
    })
  },
  { message: "Duplicate groups are not allowed" },
)

/**
 * Schema for mode group entries. Preprocesses the input to strip deprecated
 * tool groups (e.g., "browser") before validation, ensuring backward compatibility
 * with older user configs.
 *
 * The type assertion to `z.ZodType<GroupEntry[], z.ZodTypeDef, GroupEntry[]>` is
 * required because `z.preprocess` erases the input type to `unknown`, which
 * propagates through `modeConfigSchema → rooCodeSettingsSchema → createRunSchema`
 * and breaks `zodResolver` generic inference in downstream consumers (e.g., web-evals).
 */
export const groupEntryArraySchema = z.preprocess((val) => {
  if (!Array.isArray(val)) return val
  return val.filter((entry) => !isDeprecatedGroupEntry(entry))
}, rawGroupEntryArraySchema) as z.ZodType<GroupEntry[], z.ZodTypeDef, GroupEntry[]>

export const modeConfigSchema = z.object({
  slug: z.string().regex(/^[a-zA-Z0-9-]+$/, "Slug must contain only letters numbers and dashes"),
  name: z.string().min(1, "Name is required"),
  roleDefinition: z.string().min(1, "Role definition is required"),
  description: z.string().optional(),
  customInstructions: z.string().optional(),
  groups: groupEntryArraySchema,
  source: z.enum(["global", "project"]).optional(),
  hidden: z.boolean().optional(), // whether to add mode to system prompt or not
  isCodeEditor: z.boolean().optional(),
})

export type ModeConfig = z.infer<typeof modeConfigSchema>

/**
 * CustomModesSettings
 */

export const customModesSettingsSchema = z.object({
  customModes: z.array(modeConfigSchema).refine(
    (modes) => {
      const slugs = new Set()

      return modes.every((mode) => {
        if (slugs.has(mode.slug)) {
          return false
        }

        slugs.add(mode.slug)
        return true
      })
    },
    {
      message: "Duplicate mode slugs are not allowed",
    },
  ),
})

export type CustomModesSettings = z.infer<typeof customModesSettingsSchema>

/**
 * PromptComponent
 */

export const promptComponentSchema = modeConfigSchema
  .pick({
    roleDefinition: true,
    description: true,
    customInstructions: true,
  })
  .partial()

export type PromptComponent = z.infer<typeof promptComponentSchema>

/**
 * CustomModePrompts
 */

export const customModePromptsSchema = z.record(z.string(), promptComponentSchema.optional())

export type CustomModePrompts = z.infer<typeof customModePromptsSchema>

/**
 * CustomSupportPrompts
 */

export const customSupportPromptsSchema = z.record(z.string(), z.string().optional())

export type CustomSupportPrompts = z.infer<typeof customSupportPromptsSchema>

/**
 * DEFAULT_MODES
 */

export const DEFAULT_MODES: readonly ModeConfig[] = [
  {
    slug: "ask",
    name: "❓ Ask",
    roleDefinition:
      "You are Roo, a knowledgeable technical assistant focused on answering questions and providing information about software development, technology, and related topics.",
    description: "Answers, explanations, techical discussions",
    groups: ["read", "mcp"],
    customInstructions:
      "You can analyze code, explain concepts, and access external resources. Always answer the user's questions thoroughly, and do not switch to implementing code unless explicitly requested by the user. Include Mermaid diagrams when they clarify your response.",
  },
  {
    slug: "architect",
    name: "🏗️ Architect",
    roleDefinition: "You are Roo, an experienced technical leader who is inquisitive and an excellent planner.",
    description: "Plan and design before implementation",
    groups: ["read", ["edit", { fileRegex: "\\.md$", description: "Markdown files only" }], "mcp"],
    customInstructions: `1. Gather context about the task using available tools and by asking the user clarifying questions. Think of this as a brainstorming session.
2. Break the task into clear, actionable steps and create a todo list using the \`update_todo_list\` tool. Each item should be:
   - Specific and actionable
   - Listed in logical execution order
   - Focused on a single, well-defined outcome
   - Clear enough that another assistant or user could execute it independently
3. Review the plan with the user and refine it based on their feedback. Ask user for explicit plan approval before moving to the next step.
4. When the plan is explicitly approved, save the plan as a markdown file in the '/plans/' directory, then use the \`new_task\` tool to hand off implementation to 'code' mode. Pass the approved todo list as the 'todos' parameter and include the plan file path in the 'message' parameter.

**IMPORTANT**
- Never provide level of effort time estimates (e.g., hours, days, weeks) for tasks.`,
  },
  {
    slug: "code",
    name: "💻 Code",
    roleDefinition:
      "You are Roo, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.",
    description: "Write, modify, and refactor code",
    groups: ["read", "edit", "command", "mcp"],
    customInstructions: `Always consider the context in which the code is being used. Ensure that your changes are compatible with the existing codebase and that they follow the project's code and structural patterns.
DO NOT introduce excessive abstractions, refactor unrelated code, or handle unlikely edge cases unless explicitly requested.`,
    isCodeEditor: true,
  },
] as const
