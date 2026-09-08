/**
 * openMarkdownPreview Handler
 *
 * Handles the "openMarkdownPreview" message type - opens markdown preview.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openMarkdownPreview", message)
  const { text } = validated

  if (text) {
    try {
      const tmpDir = os.tmpdir()
      const timestamp = Date.now()
      const tempFileName = `roo-preview-${timestamp}.md`
      const tempFilePath = path.join(tmpDir, tempFileName)

      await fs.writeFile(tempFilePath, text, "utf8")

      const doc = await vscode.workspace.openTextDocument(tempFilePath)
      await vscode.commands.executeCommand("markdown.showPreview", doc.uri)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      ctx.log(`Error opening markdown preview: ${errorMessage}`)
      vscode.window.showErrorMessage(`Failed to open markdown preview: ${errorMessage}`)
    }
  }
}

export const openMarkdownPreviewHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening markdown preview: ${errorMessage}`)
  }
}
