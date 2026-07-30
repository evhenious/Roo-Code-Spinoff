/**
 * getSystemPrompt Handler
 *
 * Handles the "getSystemPrompt" message type - gets system prompt for mode.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { generateSystemPrompt } from "../../generateSystemPrompt"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("getSystemPrompt", message)
  const { mode } = validated

  try {
    const systemPrompt = await generateSystemPrompt(ctx.provider, { ...message, mode })

    ctx.postMessage({
      type: "systemPrompt",
      text: systemPrompt,
      mode,
    })
  } catch (error) {
    ctx.log(`Error getting system prompt:  ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.get_system_prompt"))
  }
}

export const getSystemPromptHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error getting system prompt: ${errorMessage}`)
  }
}
