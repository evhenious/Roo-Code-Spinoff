/**
 * deleteMcpServer Handler
 *
 * Handles the "deleteMcpServer" message type - deletes an MCP server.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for deleteMcpServer messages.
 * Deletes the specified MCP server and refreshes the webview state.
 */
export const deleteMcpServerHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteMcpServer", message)

  if (!validated.serverName) {
    return
  }

  try {
    ctx.provider.log(`Attempting to delete MCP server: ${validated.serverName}`)
    await ctx.provider.getMcpHub()?.deleteServer(validated.serverName, validated.source ?? "global")
    ctx.provider.log(`Successfully deleted MCP server: ${validated.serverName}`)

    // Refresh the webview state
    await ctx.provider.postStateToWebview()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.provider.log(`Failed to delete MCP server: ${errorMessage}`)
    // Error messages are already handled by McpHub.deleteServer
  }
}
