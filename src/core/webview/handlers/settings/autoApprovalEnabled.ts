/**
 * autoApprovalEnabled Handler
 *
 * Handles the "autoApprovalEnabled" message type - toggles auto approval.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("autoApprovalEnabled", message)
  const { bool } = validated

  await ctx.provider.contextProxy.setValue("autoApprovalEnabled", bool ?? false)
  await ctx.provider.postStateToWebview()
}

export const autoApprovalEnabledHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating auto approval setting: ${errorMessage}`)
  }
}
