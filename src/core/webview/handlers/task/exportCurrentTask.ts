/**
 * exportCurrentTask Handler
 *
 * Handles the "exportCurrentTask" message type - exports the current task.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for exportCurrentTask messages.
 * Exports the current task if one exists.
 */
export const exportCurrentTaskHandler: MessageHandler = async (ctx, message) => {
  validateMessage("exportCurrentTask", message)
  const currentTaskId = ctx.provider.getCurrentTask()?.taskId
  if (currentTaskId) {
    ctx.provider.exportTaskWithId(currentTaskId)
  }
}
