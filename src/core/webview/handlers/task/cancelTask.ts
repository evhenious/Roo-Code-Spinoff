/**
 * cancelTask Handler
 *
 * Handles the "cancelTask" message type - cancels the current task.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for cancelTask messages.
 * Cancels the current task.
 */
export const cancelTaskHandler: MessageHandler = async (ctx, message) => {
  validateMessage("cancelTask", message)
  await ctx.provider.cancelTask()
}
