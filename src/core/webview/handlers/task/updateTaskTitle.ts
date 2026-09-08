/**
 * updateTaskTitle Handler
 *
 * Handles the "updateTaskTitle" message type - updates the title of a task.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for updateTaskTitle messages.
 * Updates the title of a task in the task history store.
 */
export const updateTaskTitleHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("updateTaskTitle", message)
  const { taskId, title } = validated

  if (!taskId || !title) {
    console.error("[updateTaskTitle] Missing taskId or title")
    return
  }

  const historyItem = ctx.provider.taskHistoryStore.get(taskId)
  if (!historyItem) {
    console.error(`[updateTaskTitle] Task not found: ${taskId}`)
    return
  }

  await ctx.provider.updateTaskHistory({ ...historyItem, title })
}
