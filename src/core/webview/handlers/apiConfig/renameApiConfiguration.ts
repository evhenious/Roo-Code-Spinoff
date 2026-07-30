/**
 * renameApiConfiguration Handler
 *
 * Handles the "renameApiConfiguration" message type - renames an API configuration.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("renameApiConfiguration", message)
  const { values, apiConfiguration } = validated

  if (values && apiConfiguration) {
    try {
      const { oldName, newName } = values

      if (oldName === newName) {
        return
      }

      // Load the old configuration to get its ID.
      const { id } = await ctx.provider.providerSettingsManager.getProfile({ name: oldName })

      // Create a new configuration with the new name and old ID.
      await ctx.provider.providerSettingsManager.saveConfig(newName, { ...apiConfiguration, id })

      // Delete the old configuration.
      await ctx.provider.providerSettingsManager.deleteConfig(oldName)

      // Re-activate to update the global settings related to the
      // currently activated provider profile.
      await ctx.provider.activateProviderProfile({ name: newName })
    } catch (error) {
      ctx.log(`Error rename api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)

      vscode.window.showErrorMessage(t("common:errors.rename_api_config"))
    }
  }
}

export const renameApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error renaming API configuration: ${errorMessage}`)
  }
}
