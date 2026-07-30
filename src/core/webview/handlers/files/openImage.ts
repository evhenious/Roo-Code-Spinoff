/**
 * openImage Handler
 *
 * Handles the "openImage" message type - opens an image.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { openImage } from "../../../../integrations/misc/image-handler"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openImage", message)
  const { text, values } = validated

  openImage(text!, { values })
}

export const openImageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening image: ${errorMessage}`)
  }
}
