/**
 * removeQueuedMessage Handler
 *
 * Handles the "removeQueuedMessage" message type - removes a queued message.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("removeQueuedMessage", message)
  const { text } = validated

  ctx.provider.getCurrentTask()?.messageQueueService.removeMessage(text ?? "")
}

export const removeQueuedMessageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error removing queued message: ${errorMessage}`)
  }
}
