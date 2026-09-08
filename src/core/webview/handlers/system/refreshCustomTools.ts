/**
 * refreshCustomTools Handler
 *
 * Handles the "refreshCustomTools" message type - refreshes custom tools.
 */

import * as path from "path"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { customToolRegistry } from "@roo-code/core"
import { getRooDirectoriesForCwd } from "../../../../services/roo-config/index.js"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("refreshCustomTools", message)

  try {
    const toolDirs = getRooDirectoriesForCwd(ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd).map((dir) =>
      path.join(dir, "tools"),
    )
    await customToolRegistry.loadFromDirectories(toolDirs)

    ctx.postMessage({
      type: "customToolsResult",
      tools: customToolRegistry.getAllSerialized(),
    })
  } catch (error) {
    ctx.postMessage({
      type: "customToolsResult",
      tools: [],
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const refreshCustomToolsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error refreshing custom tools: ${errorMessage}`)
  }
}
