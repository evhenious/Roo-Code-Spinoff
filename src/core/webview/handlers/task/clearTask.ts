/**
 * clearTask Handler
 *
 * Handles the "clearTask" message type - clears the current task and resets the UI.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for clearTask messages.
 * Clears the current task and posts state to webview.
 */
export const clearTaskHandler: MessageHandler = async (ctx, message) => {
  validateMessage("clearTask", message)
  await ctx.provider.clearTask()
  await ctx.provider.postStateToWebview()
}
