/**
 * searchFiles Handler
 *
 * Handles the "searchFiles" message type - searches files in the workspace.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import { searchWorkspaceFiles } from "../../../../services/search/file-search"
import { RooIgnoreController } from "../../../../core/ignore/RooIgnoreController"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { getCurrentCwd } from "../../utils/commonHelpers"

/**
 * Handler for searchFiles messages.
 * Searches files in the workspace with RooIgnore filtering.
 */
export const searchFilesHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("searchFiles", message)

  const workspacePath = getCurrentCwd(ctx.provider)

  if (!workspacePath) {
    // Handle case where workspace path is not available
    await ctx.provider.postMessageToWebview({
      type: "fileSearchResults",
      results: [],
      requestId: validated.requestId,
      error: "No workspace path available",
    })
    return
  }

  try {
    // Call file search service with query from message
    const results = await searchWorkspaceFiles(validated.query || "", workspacePath, 20)

    // Get the RooIgnoreController from the current task, or create a new one
    const currentTask = ctx.provider.getCurrentTask()
    let rooIgnoreController = currentTask?.rooIgnoreController
    let tempController: RooIgnoreController | undefined

    // If no current task or no controller, create a temporary one
    if (!rooIgnoreController) {
      tempController = new RooIgnoreController(workspacePath)
      await tempController.initialize()
      rooIgnoreController = tempController
    }

    try {
      // Get showRooIgnoredFiles setting from state
      const { showRooIgnoredFiles = false } = (await ctx.provider.getState()) ?? {}

      // Filter results using RooIgnoreController if showRooIgnoredFiles is false
      let filteredResults = results
      if (!showRooIgnoredFiles && rooIgnoreController) {
        const allowedPaths = rooIgnoreController.filterPaths(results.map((r) => r.path))
        filteredResults = results.filter((r) => allowedPaths.includes(r.path))
      }

      // Send results back to webview
      await ctx.provider.postMessageToWebview({
        type: "fileSearchResults",
        results: filteredResults,
        requestId: validated.requestId,
      })
    } finally {
      // Dispose temporary controller to prevent resource leak
      tempController?.dispose()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Send error response to webview
    await ctx.provider.postMessageToWebview({
      type: "fileSearchResults",
      results: [],
      error: errorMessage,
      requestId: validated.requestId,
    })
  }
}
