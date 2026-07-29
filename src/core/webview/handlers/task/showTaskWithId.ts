/**
 * showTaskWithId Handler
 *
 * Handles the "showTaskWithId" message type - shows a task by its ID.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for showTaskWithId messages.
 * Shows a task by its ID.
 */
export const showTaskWithIdHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("showTaskWithId", message)
  ctx.provider.showTaskWithId(validated.text!)
}
