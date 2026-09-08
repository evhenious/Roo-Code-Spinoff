/**
 * openMention Handler
 *
 * Handles the "openMention" message type - opens a mention.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { openMention } from "../../../mentions"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openMention", message)
  const { text } = validated

  openMention(ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd, text)
}

export const openMentionHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening mention: ${errorMessage}`)
  }
}
