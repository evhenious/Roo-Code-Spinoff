/**
 * toggleApiConfigPin Handler
 *
 * Handles the "toggleApiConfigPin" message type - toggles API config pin.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("toggleApiConfigPin", message)
  const { text } = validated

  if (text) {
    const currentPinned = (await ctx.provider.contextProxy.getValue("pinnedApiConfigs")) ?? {}
    const updatedPinned: Record<string, boolean> = { ...currentPinned }

    if (currentPinned[text]) {
      delete updatedPinned[text]
    } else {
      updatedPinned[text] = true
    }

    await ctx.provider.contextProxy.setValue("pinnedApiConfigs", updatedPinned)
    await ctx.provider.postStateToWebview()
  }
}

export const toggleApiConfigPinHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error toggling API config pin: ${errorMessage}`)
  }
}
