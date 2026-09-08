/**
 * deleteTaskWithId Handler
 *
 * Handles the "deleteTaskWithId" message type - deletes a task by ID.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteTaskWithId", message)
  const { text } = validated

  ctx.provider.deleteTaskWithId(text!)
}

export const deleteTaskWithIdHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting task: ${errorMessage}`)
  }
}
