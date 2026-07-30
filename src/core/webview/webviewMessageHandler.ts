import type { ClineProvider } from "./ClineProvider"
import type { WebviewMessage, Command as SlashCommand } from "@roo-code/types"
import { handlerRegistry } from "./handlers"
import type { HandlerContext } from "./types/handlerTypes"
import { defaultModeSlug } from "../../shared/modes"

/**
 * Creates a handler context from the provider.
 */
function createContext(provider: ClineProvider): HandlerContext {
  return {
    provider,
    getState: async (key) => provider.contextProxy.getValue(key),
    getCurrentCwd: () => provider.getCurrentTask()?.cwd || provider.cwd,
    getCurrentMode: async () => {
      const task = provider.getCurrentTask()
      if (task) {
        try {
          return await task.getTaskMode()
        } catch (error) {
          provider.log(
            `Error resolving current task mode: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
          )
        }
      }
      const state = await provider.getState()
      if (typeof state.mode === "string" && state.mode.length > 0) {
        return state.mode
      }
      const { defaultModeSlug } = await import("../../shared/modes")
      return defaultModeSlug
    },
    postMessage: (message) => provider.postMessageToWebview(message),
    log: (message) => provider.log(message),
  }
}

/**
 * Main message handler - thin entry point.
 * Delegates to the handler registry for message dispatch.
 */
export const webviewMessageHandler = async (provider: ClineProvider, message: WebviewMessage) => {
  const handler = handlerRegistry[message.type]

  if (!handler) {
    provider.log(`Unhandled message type: ${message.type}`)
    return
  }

  const context = createContext(provider)
  await handler(context, message)
}

/**
 * Get discovered commands from workspace and skills.
 * Exported for use by requestCommands handler.
 */
export const getDiscoveredCommands = async (provider: ClineProvider): Promise<SlashCommand[]> => {
  const { getCommands } = await import("../../services/command/commands")
  const cwd = provider.getCurrentTask()?.cwd || provider.cwd
  const commands = await getCommands(cwd)

  const commandList: SlashCommand[] = commands.map((command) => ({
    name: command.name,
    source: command.source,
    filePath: command.filePath,
    description: command.description,
    argumentHint: command.argumentHint,
  }))

  const existingCommandNames = new Set(commandList.map((command) => command.name))
  const skillsManager = provider.getSkillsManager()

  if (!skillsManager) {
    return commandList
  }

  const currentMode = await getCurrentMode(provider)
  const availableSkills = skillsManager.getSkillsForMode(currentMode)

  for (const skill of availableSkills) {
    if (existingCommandNames.has(skill.name)) {
      continue
    }

    existingCommandNames.add(skill.name)
    commandList.push({
      name: skill.name,
      source: skill.source,
      filePath: skill.path,
      description: skill.description,
    })
  }

  return commandList
}

/**
 * Get current mode from provider (used by getDiscoveredCommands).
 */
const getCurrentMode = async (provider: ClineProvider): Promise<string> => {
  const currentTask = provider.getCurrentTask()

  if (currentTask) {
    try {
      return await currentTask.getTaskMode()
    } catch (error) {
      provider.log(
        `Error resolving current task mode for command discovery: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
      )
    }
  }

  try {
    const state = await provider.getState()
    if (typeof state.mode === "string" && state.mode.length > 0) {
      return state.mode
    }
  } catch (error) {
    provider.log(
      `Error resolving global mode for command discovery: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
    )
  }

  return defaultModeSlug
}
