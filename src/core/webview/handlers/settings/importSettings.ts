/**
 * importSettings Handler
 *
 * Handles the "importSettings" message type - imports settings from file.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { importSettingsWithFeedback } from "../../../config/importExport"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("importSettings", message)

  await importSettingsWithFeedback({
    providerSettingsManager: ctx.provider.providerSettingsManager,
    contextProxy: ctx.provider.contextProxy,
    customModesManager: ctx.provider.customModesManager,
    provider: ctx.provider,
  })
}

export const importSettingsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error importing settings: ${errorMessage}`)
  }
}
