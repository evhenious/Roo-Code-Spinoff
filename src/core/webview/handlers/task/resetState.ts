/**
 * resetState Handler
 *
 * Handles the "resetState" message type - resets the extension state.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for resetState messages.
 * Resets the extension state.
 */
export const resetStateHandler: MessageHandler = async (ctx, message) => {
  validateMessage("resetState", message)
  await ctx.provider.resetState()
}
