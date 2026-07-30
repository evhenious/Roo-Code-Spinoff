/**
 * debugSetting Handler
 *
 * Handles the "debugSetting" message type - toggles debug mode.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { Package } from "../../../../shared/package"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("debugSetting", message)
  const { bool } = validated

  await vscode.workspace
    .getConfiguration(Package.name)
    .update("debug", bool ?? false, vscode.ConfigurationTarget.Global)
  await ctx.provider.postStateToWebview()
}

export const debugSettingHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating debug setting: ${errorMessage}`)
  }
}
