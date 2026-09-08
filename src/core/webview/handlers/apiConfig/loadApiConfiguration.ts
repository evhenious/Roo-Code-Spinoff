/**
 * loadApiConfiguration Handler
 *
 * Handles the "loadApiConfiguration" message type - loads an API configuration by name.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("loadApiConfiguration", message)
  const { text } = validated

  if (text) {
    try {
      await ctx.provider.activateProviderProfile({ name: text })
    } catch (error) {
      ctx.log(`Error load api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
      vscode.window.showErrorMessage(t("common:errors.load_api_config"))
    }
  }
}

export const loadApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error loading API configuration: ${errorMessage}`)
  }
}
