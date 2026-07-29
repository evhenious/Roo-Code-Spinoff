/**
 * toggleToolEnabledForPrompt Handler
 *
 * Handles the "toggleToolEnabledForPrompt" message type - toggles the enabled for prompt setting for a tool.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for toggleToolEnabledForPrompt messages.
 * Toggles the enabled for prompt setting for the specified tool.
 */
export const toggleToolEnabledForPromptHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("toggleToolEnabledForPrompt", message)

  try {
    await ctx.provider
      .getMcpHub()
      ?.toggleToolEnabledForPrompt(
        validated.serverName!,
        validated.source ?? "global",
        validated.toolName!,
        Boolean(validated.isEnabled),
      )
  } catch (error) {
    ctx.provider.log(
      `Failed to toggle enabled for prompt for tool ${validated.toolName}: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
    )
  }
}
