/**
 * updateVSCodeSetting Handler
 *
 * Handles the "updateVSCodeSetting" message type - updates VSCode setting.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const ALLOWED_VSCODE_SETTINGS = new Set(["terminal.integrated.inheritEnv"])

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("updateVSCodeSetting", message)
  const { setting, value } = validated

  if (setting !== undefined && value !== undefined) {
    if (ALLOWED_VSCODE_SETTINGS.has(setting)) {
      await vscode.workspace.getConfiguration().update(setting, value, true)
    } else {
      vscode.window.showErrorMessage(`Cannot update restricted VSCode setting: ${setting}`)
    }
  }
}

export const updateVSCodeSettingHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating VSCode setting: ${errorMessage}`)
  }
}
