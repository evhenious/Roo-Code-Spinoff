/**
 * condenseTaskContextRequest Handler
 *
 * Handles the "condenseTaskContextRequest" message type - requests context condensation.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("condenseTaskContextRequest", message)
  const { text } = validated

  ctx.provider.condenseTaskContext(text!)
}

export const condenseTaskContextRequestHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error condensing task context: ${errorMessage}`)
  }
}
