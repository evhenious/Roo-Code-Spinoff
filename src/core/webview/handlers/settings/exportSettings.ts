/**
 * exportSettings Handler
 *
 * Handles the "exportSettings" message type - exports settings to file.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { exportSettings } from "../../../config/importExport"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("exportSettings", message)

  await exportSettings({
    providerSettingsManager: ctx.provider.providerSettingsManager,
    contextProxy: ctx.provider.contextProxy,
  })
}

export const exportSettingsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error exporting settings: ${errorMessage}`)
  }
}
