/**
 * exportTaskWithId Handler
 *
 * Handles the "exportTaskWithId" message type - exports a task by ID.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("exportTaskWithId", message)
  const { text } = validated

  ctx.provider.exportTaskWithId(text!)
}

export const exportTaskWithIdHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error exporting task: ${errorMessage}`)
  }
}
