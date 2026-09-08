/**
 * openCustomModesSettings Handler
 *
 * Handles the "openCustomModesSettings" message type - opens the custom modes settings file.
 */

import { openFile } from "../../../../integrations/misc/open-file"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for openCustomModesSettings messages.
 * Opens the custom modes settings file in the editor.
 */
export const openCustomModesSettingsHandler: MessageHandler = async (ctx, message) => {
  validateMessage("openCustomModesSettings", message)
  const customModesFilePath = await ctx.provider.customModesManager.getCustomModesFilePath()
  if (customModesFilePath) {
    openFile(customModesFilePath)
  }
}
