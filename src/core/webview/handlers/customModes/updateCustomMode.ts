/**
 * updateCustomMode Handler
 *
 * Handles the "updateCustomMode" message type - updates a custom mode.
 */

import { ModeConfig } from "@roo-code/types"
import { defaultModeSlug } from "../../../../shared/modes"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("updateCustomMode", message)
  const { modeConfig } = validated

  if (modeConfig && typeof modeConfig.slug === "string") {
    try {
      // Check if this is a new mode or an update to an existing mode
      const existingModes = await ctx.provider.customModesManager.getCustomModes()
      const isNewMode = !existingModes.some((mode) => mode.slug === modeConfig.slug)

      await ctx.provider.customModesManager.updateCustomMode(
        modeConfig.slug || defaultModeSlug,
        modeConfig as ModeConfig,
      )
      // Update state after saving the mode
      const customModes = await ctx.provider.customModesManager.getCustomModes()
      await ctx.provider.contextProxy.setValue("customModes", customModes)
      await ctx.provider.contextProxy.setValue("mode", modeConfig.slug)
      await ctx.provider.postStateToWebview()
    } catch (error) {
      // Error already shown to user by updateCustomMode
      // Just prevent unhandled rejection and skip state updates
    }
  }
}

export const updateCustomModeHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating custom mode: ${errorMessage}`)
  }
}
