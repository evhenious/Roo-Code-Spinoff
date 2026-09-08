/**
 * openExternal Handler
 *
 * Handles the "openExternal" message type - opens an external URL.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openExternal", message)
  const { url } = validated

  if (url) {
    vscode.env.openExternal(vscode.Uri.parse(url))
  }
}

export const openExternalHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening external URL: ${errorMessage}`)
  }
}
