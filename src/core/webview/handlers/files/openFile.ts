/**
 * openFile Handler
 *
 * Handles the "openFile" message type - opens a file.
 */

import * as path from "path"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { openFile } from "../../../../integrations/misc/open-file"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openFile", message)
  const { text, values } = validated

  let filePath: string = text!
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd, filePath)
  }
  openFile(filePath, values as { create?: boolean; content?: string; line?: number })
}

export const openFileHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening file: ${errorMessage}`)
  }
}
