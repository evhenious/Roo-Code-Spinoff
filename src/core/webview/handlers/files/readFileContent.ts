/**
 * readFileContent Handler
 *
 * Handles the "readFileContent" message type - reads file content.
 */

import * as path from "path"
import * as fs from "fs/promises"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { isPathOutsideWorkspace } from "../../../../utils/pathUtils"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("readFileContent", message)
  const { text } = validated

  const relPath = text || ""
  if (!relPath) {
    ctx.postMessage({
      type: "fileContent",
      fileContent: { path: relPath, content: null, error: "No path provided" },
    })
    return
  }
  try {
    const cwd = ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd
    if (!cwd) {
      ctx.postMessage({
        type: "fileContent",
        fileContent: { path: relPath, content: null, error: "No workspace path available" },
      })
      return
    }
    const absPath = path.resolve(cwd, relPath)
    // Workspace-boundary validation: prevent path traversal attacks
    if (isPathOutsideWorkspace(absPath)) {
      ctx.postMessage({
        type: "fileContent",
        fileContent: { path: relPath, content: null, error: "Path is outside workspace" },
      })
      return
    }
    const content = await fs.readFile(absPath, "utf-8")
    ctx.postMessage({ type: "fileContent", fileContent: { path: relPath, content } })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    ctx.postMessage({
      type: "fileContent",
      fileContent: { path: relPath, content: null, error: errorMsg },
    })
  }
}

export const readFileContentHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error reading file content: ${errorMessage}`)
  }
}
