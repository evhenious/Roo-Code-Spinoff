/**
 * checkRulesDirectory Handler
 *
 * Handles the "checkRulesDirectory" message type - checks rules directory for a custom mode.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("checkRulesDirectory", message)
  const { slug } = validated

  if (slug) {
    const hasContent = await ctx.provider.customModesManager.checkRulesDirectoryHasContent(slug)

    ctx.postMessage({
      type: "checkRulesDirectoryResult",
      slug,
      hasContent: hasContent,
    })
  }
}

export const checkRulesDirectoryHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error checking rules directory: ${errorMessage}`)
  }
}
