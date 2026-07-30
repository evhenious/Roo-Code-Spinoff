/**
 * loadApiConfigurationById Handler
 *
 * Handles the "loadApiConfigurationById" message type - loads an API configuration by ID.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("loadApiConfigurationById", message)
  const { text } = validated

  if (text) {
    try {
      await ctx.provider.activateProviderProfile({ id: text })
    } catch (error) {
      ctx.log(`Error load api configuration by ID: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
      vscode.window.showErrorMessage(t("common:errors.load_api_config"))
    }
  }
}

export const loadApiConfigurationByIdHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error loading API configuration by ID: ${errorMessage}`)
  }
}
