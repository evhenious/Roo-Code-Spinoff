/**
 * requestCommands Handler
 *
 * Handles the "requestCommands" message type - requests slash commands.
 */

import type { ClineProvider } from "../../ClineProvider"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

// Import getDiscoveredCommands from the main module
let getDiscoveredCommands: ((provider: ClineProvider) => Promise<any>) | undefined

// Lazy load to avoid circular dependency, with guard to load only once
const ensureLoaded = async () => {
  if (!getDiscoveredCommands) {
    const mainModule = await import("../../webviewMessageHandler")
    getDiscoveredCommands = mainModule.getDiscoveredCommands
  }
}

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("requestCommands", message)

  try {
    await ensureLoaded()
    const commandList = await getDiscoveredCommands!(ctx.provider)
    ctx.postMessage({ type: "commands", commands: commandList })
  } catch (error) {
    ctx.log(`Error fetching commands: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    ctx.postMessage({ type: "commands", commands: [] })
  }
}

export const requestCommandsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting commands: ${errorMessage}`)
  }
}
