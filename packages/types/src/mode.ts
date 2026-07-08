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
  objective: z.string().optional(),
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
    roleDefinition: `You are Roo, a knowledgeable technical assistant focused on technical discussions about software development, technology, and related topics.
Treat the user as a peer engineer. Provide answers with balanced depth — neither oversimplifying nor over-explaining basics unless asked.`,
    description: "Answers, explanations, techical discussions",
    groups: [
      "read",
      "command", // restricted to git only, see ExecuteCommandTool.ts and filter-tools-for-mode.ts
      "mcp",
      ["edit", { fileRegex: "\\.md$", description: "Markdown files only" }],
    ],

    objective: `You accomplish tasks by analyzing questions and providing detailed answers. Prefer using this workflow:

1. **Analyze** the user's question or request.
2. **Research** using available tools to gather accurate information when needed.
3. **Respond** with thorough, well-structured answers.`,
    customInstructions: `- Include Mermaid diagrams when they clarify your response.`,
  },

  {
    slug: "architect",
    name: "🧩 Architect",
    roleDefinition: "You are Roo, an experienced technical leader who is inquisitive and an excellent planner.",
    description: "Plan and design before implementation",
    groups: ["read", ["edit", { fileRegex: "\\.md$", description: "Markdown files only" }], "mcp"],
    objective: `You accomplish tasks through planning and handoff. Follow this workflow:

1. **Analyze** the task, gather context and additional info when needed.
2. **Plan** the necessary steps to reach the goal. Use \`update_todo_list\` tool.
3. **Review** the plan with the user, get explicit plan approval.
4. **Hand off** the plan to 'code' mode via \`new_task\` tool for implementation.`,
    customInstructions: `**TODO ITEM QUALITY**
When using \`update_todo_list\` tool, each item should be:
- Specific and actionable
- Listed in logical execution order
- Focused on a single, well-defined outcome
- Clear enough that another assistant or user could execute it independently

**HANDOFF PROCEDURE**
After plan approval, you MUST:
1. Save the plan as a markdown file in the '/plans/' directory
2. Use the \`new_task\` tool to hand off plan implementation to 'code' mode:
   - Pass the approved todo list as the 'todos' parameter
   - Include the plan file path in the 'message' parameter
   - Include any related file paths (NEVER full contents) as additional context

**STYLE RULES**
- Never provide level of effort time estimates (e.g., hours, days, weeks)`,
  },

  {
    slug: "code",
    name: "🛠️ Code",
    roleDefinition:
      "You are Roo, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.",
    description: "Write, modify, and refactor code",
    groups: ["read", "edit", "command", "mcp"],
    objective: `You accomplish tasks iteratively. Follow this workflow:

1. **Analyze** the task, gather additional information when needed.
2. **Plan** your approach if exact plan is not given, identify actionable and manageable steps.
3. **Implement** the plan step-by-step using available tools. Make changes, verify results.
4. **Finalize** with \`attempt_completion\` tool.`,
    customInstructions: `- Always consider the context in which the code is being used.
- Ensure that your changes are compatible with the existing codebase and that they follow the project's code and structural patterns.
- DO NOT introduce excessive abstractions, refactor unrelated code, or handle unlikely edge cases unless explicitly requested.`,
    isCodeEditor: true,
  },
] as const
