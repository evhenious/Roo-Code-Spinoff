/**
 * UI Handlers Index
 *
 * Exports all UI-related handlers.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { selectImages } from "../../../../integrations/misc/process-images"

export const selectImagesHandler: MessageHandler = async (ctx, message) => {
  const images = await selectImages()
  ctx.postMessage({
    type: "selectedImages",
    images,
    context: message.context,
    messageTs: message.messageTs,
  })
}

export const openKeyboardShortcutsHandler: MessageHandler = async (ctx, message) => {
  // Open VSCode keyboard shortcuts settings and optionally filter to show the Roo Code commands
  const searchQuery = message.text || ""
  if (searchQuery) {
    // Open with a search query pre-filled
    await vscode.commands.executeCommand("workbench.action.openGlobalKeybindings", searchQuery)
  } else {
    // Just open the keyboard shortcuts settings
    await vscode.commands.executeCommand("workbench.action.openGlobalKeybindings")
  }
}
