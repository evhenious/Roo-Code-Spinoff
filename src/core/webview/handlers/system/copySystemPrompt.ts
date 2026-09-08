/**
 * copySystemPrompt Handler
 *
 * Handles the "copySystemPrompt" message type - copies system prompt to clipboard.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { generateSystemPrompt } from "../../generateSystemPrompt"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("copySystemPrompt", message)

  try {
    const systemPrompt = await generateSystemPrompt(ctx.provider, message)

    await vscode.env.clipboard.writeText(systemPrompt)
    await vscode.window.showInformationMessage(t("common:info.clipboard_copy"))
  } catch (error) {
    ctx.log(`Error getting system prompt:  ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.get_system_prompt"))
  }
}

export const copySystemPromptHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error copying system prompt: ${errorMessage}`)
  }
}
