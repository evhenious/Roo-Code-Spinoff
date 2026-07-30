/**
 * hasOpenedModeSelector Handler
 *
 * Handles the "hasOpenedModeSelector" message type - tracks mode selector state.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("hasOpenedModeSelector", message)
  const { bool } = validated

  await ctx.provider.contextProxy.setValue("hasOpenedModeSelector", bool ?? true)
  await ctx.provider.postStateToWebview()
}

export const hasOpenedModeSelectorHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating mode selector state: ${errorMessage}`)
  }
}
