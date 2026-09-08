/**
 * saveApiConfiguration Handler
 *
 * Handles the "saveApiConfiguration" message type - saves an API configuration.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const { text, apiConfiguration } = validateMessage("saveApiConfiguration", message)

  if (text && apiConfiguration) {
    try {
      await ctx.provider.providerSettingsManager.saveConfig(text, apiConfiguration)
      const listApiConfig = await ctx.provider.providerSettingsManager.listConfig()
      await ctx.provider.contextProxy.setValue("listApiConfigMeta", listApiConfig)
    } catch (error) {
      ctx.log(`Error save api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
      vscode.window.showErrorMessage(t("common:errors.save_api_config"))
    }
  }
}

export const saveApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error saving API configuration: ${errorMessage}`)
  }
}
