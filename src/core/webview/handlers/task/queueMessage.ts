/**
 * queueMessage Handler
 *
 * Handles the "queueMessage" message type - queues a message for the agent.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { resolveIncomingImages } from "../../utils/commonHelpers"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("queueMessage", message)
  const { text, images } = validated

  const currentTask = ctx.provider.getCurrentTask()
  if (currentTask && text) {
    const resolved = await resolveIncomingImages(ctx.provider, { text, images })
    currentTask.messageQueueService.addMessage(resolved.text, resolved.images)
  }
}

export const queueMessageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error queuing message: ${errorMessage}`)
  }
}
