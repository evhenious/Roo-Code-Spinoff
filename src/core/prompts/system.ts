import * as vscode from "vscode"

import { type CustomModePrompts, type ModeConfig, type PromptComponent } from "@roo-code/types"

import { defaultModeSlug, getGroupName, getModeBySlug, getModeSelection, Mode, modes } from "../../shared/modes"
import { isEmpty } from "../../utils/object"

import { McpHub } from "../../services/mcp/McpHub"
import { SkillsManager } from "../../services/skills/SkillsManager"

import {
  addCustomInstructions,
  getModesSection,
  getObjectiveSection,
  getRulesSection,
  getSharedToolUseSection,
  getSkillsSection,
  getSystemInfoSection,
  markdownFormattingSection,
} from "./sections"
import type { SystemPromptSettings } from "./types"

// Helper function to get prompt component, filtering out empty objects
export function getPromptComponent(
  customModePrompts: CustomModePrompts | undefined,
  mode: string,
): PromptComponent | undefined {
  const component = customModePrompts?.[mode]
  // Return undefined if component is empty
  if (isEmpty(component)) {
    return undefined
  }
  return component
}

async function generatePrompt(
  context: vscode.ExtensionContext,
  cwd: string,
  mode: Mode,
  mcpHub?: McpHub,
  promptComponent?: PromptComponent,
  customModeConfigs?: ModeConfig[],
  globalCustomInstructions?: string,
  language?: string,
  rooIgnoreInstructions?: string,
  settings?: SystemPromptSettings,
  skillsManager?: SkillsManager,
  useDeveloperRole: boolean = false,
): Promise<string> {
  if (!context) {
    throw new Error("Extension context is required for generating system prompt")
  }

  // Get the full mode config to ensure we have the role definition (used for groups, etc.)
  const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0]
  const { roleDefinition, baseInstructions, isCodeEditor } = getModeSelection(mode, promptComponent, customModeConfigs)

  // Check if MCP functionality should be included
  const hasMcpGroup = modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "mcp")
  const hasMcpServers = mcpHub && mcpHub.getServers().length > 0
  const shouldIncludeMcp = hasMcpGroup && !!hasMcpServers
  const hasCommandGroup = modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "command")

  // TODO cleanup ?
  // const codeIndexManager = CodeIndexManager.getInstance(context, cwd)

  const [modesSection, skillsSection] = await Promise.all([
    getModesSection(context, mode),
    getSkillsSection(skillsManager, mode as string),
  ])

  // SYSTEM prompt constructed here
  const basePrompt = `
# IDENTITY

${roleDefinition}
${getRulesSection(cwd, shouldIncludeMcp, hasCommandGroup, mode, useDeveloperRole)}
${getSharedToolUseSection(mode)}
${markdownFormattingSection()}
${skillsSection ? `\n${skillsSection}` : ""}
${getSystemInfoSection()}

# OBJECTIVE

${modeConfig.objective || getObjectiveSection()}
${modesSection}
${await addCustomInstructions(baseInstructions, globalCustomInstructions || "", cwd, mode, {
  rooIgnoreInstructions,
  settings,
})}
`

  return basePrompt
}

export const SYSTEM_PROMPT = async (
  context: vscode.ExtensionContext,
  cwd: string,
  mcpHub?: McpHub,
  mode: Mode = defaultModeSlug,
  customModePrompts?: CustomModePrompts,
  customModes?: ModeConfig[],
  globalCustomInstructions?: string,
  language?: string,
  rooIgnoreInstructions?: string,
  settings?: SystemPromptSettings,
  skillsManager?: SkillsManager,
  useDeveloperRole: boolean = false,
): Promise<string> => {
  if (!context) {
    throw new Error("Extension context is required for generating system prompt")
  }

  // Check if it's a custom mode
  const promptComponent = getPromptComponent(customModePrompts, mode)

  // Get full mode config from custom modes or fall back to built-in modes
  const currentMode = getModeBySlug(mode, customModes) || modes.find((m) => m.slug === mode) || modes[0]

  return generatePrompt(
    context,
    cwd,
    currentMode.slug,
    mcpHub,
    promptComponent,
    customModes,
    globalCustomInstructions,
    language,
    rooIgnoreInstructions,
    settings,
    skillsManager,
    useDeveloperRole,
  )
}
