/**
 * editQueuedMessage Handler
 *
 * Handles the "editQueuedMessage" message type - edits a queued message.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import type { EditQueuedMessagePayload } from "@roo-code/types"

const rawHandler: MessageHandler = async (ctx, message) => {
  const currentTask = ctx.provider.getCurrentTask()
  if (currentTask && message.payload) {
    const { id, text, images } = message.payload as EditQueuedMessagePayload
    currentTask.messageQueueService.updateMessage(id, text, images)
  }
}

export const editQueuedMessageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error editing queued message: ${errorMessage}`)
  }
}
