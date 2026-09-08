/**
 * lockApiConfigAcrossModes Handler
 *
 * Handles the "lockApiConfigAcrossModes" message type - locks API config across modes.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("lockApiConfigAcrossModes", message)
  const { bool } = validated

  const enabled = bool ?? false
  await ctx.provider.context.workspaceState.update("lockApiConfigAcrossModes", enabled)

  await ctx.provider.postStateToWebview()
}

export const lockApiConfigAcrossModesHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating lock API config setting: ${errorMessage}`)
  }
}
