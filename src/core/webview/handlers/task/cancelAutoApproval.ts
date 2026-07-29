/**
 * cancelAutoApproval Handler
 *
 * Handles the "cancelAutoApproval" message type - cancels any pending auto-approval timeout.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for cancelAutoApproval messages.
 * Cancels any pending auto-approval timeout for the current task.
 */
export const cancelAutoApprovalHandler: MessageHandler = async (ctx, message) => {
  validateMessage("cancelAutoApproval", message)
  ctx.provider.getCurrentTask()?.cancelAutoApprovalTimeout()
}
