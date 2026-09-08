/**
 * customInstructions Handler
 *
 * Handles the "customInstructions" message type - updates custom instructions.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for customInstructions messages.
 * Updates the custom instructions for the provider.
 */
export const customInstructionsHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("customInstructions", message)
  await ctx.provider.updateCustomInstructions(validated.text)
}
