/**
 * getListApiConfiguration Handler
 *
 * Handles the "getListApiConfiguration" message type - lists all API configurations.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("getListApiConfiguration", message)

  try {
    const listApiConfig = await ctx.provider.providerSettingsManager.listConfig()
    await ctx.provider.contextProxy.setValue("listApiConfigMeta", listApiConfig)
    ctx.postMessage({ type: "listApiConfig", listApiConfig })
  } catch (error) {
    ctx.log(`Error get list api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.list_api_config"))
  }
}

export const getListApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error listing API configurations: ${errorMessage}`)
  }
}
