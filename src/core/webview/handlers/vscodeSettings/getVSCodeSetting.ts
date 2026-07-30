/**
 * getVSCodeSetting Handler
 *
 * Handles the "getVSCodeSetting" message type - gets VSCode setting.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("getVSCodeSetting", message)
  const { setting } = validated

  if (setting) {
    try {
      ctx.postMessage({
        type: "vsCodeSetting",
        setting,
        value: vscode.workspace.getConfiguration().get(setting),
      })
    } catch (error) {
      console.error(`Failed to get VSCode setting ${setting}:`, error)

      ctx.postMessage({
        type: "vsCodeSetting",
        setting,
        error: `Failed to get setting: ${error.message}`,
        value: undefined,
      })
    }
  }
}

export const getVSCodeSettingHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error getting VSCode setting: ${errorMessage}`)
  }
}
