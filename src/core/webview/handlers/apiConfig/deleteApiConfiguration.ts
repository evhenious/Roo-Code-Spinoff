/**
 * deleteApiConfiguration Handler
 *
 * Handles the "deleteApiConfiguration" message type - deletes an API configuration.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteApiConfiguration", message)
  const { text } = validated

  if (text) {
    const answer = await vscode.window.showInformationMessage(
      t("common:confirmation.delete_config_profile"),
      { modal: true },
      t("common:answers.yes"),
    )

    if (answer !== t("common:answers.yes")) {
      return
    }

    const oldName = text

    const newName = (await ctx.provider.providerSettingsManager.listConfig()).filter((c) => c.name !== oldName)[0]?.name

    if (!newName) {
      vscode.window.showErrorMessage(t("common:errors.delete_api_config"))
      return
    }

    try {
      await ctx.provider.providerSettingsManager.deleteConfig(oldName)
      await ctx.provider.activateProviderProfile({ name: newName })
    } catch (error) {
      ctx.log(`Error delete api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)

      vscode.window.showErrorMessage(t("common:errors.delete_api_config"))
    }
  }
}

export const deleteApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting API configuration: ${errorMessage}`)
  }
}
