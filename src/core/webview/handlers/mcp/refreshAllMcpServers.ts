/**
 * refreshAllMcpServers Handler
 *
 * Handles the "refreshAllMcpServers" message type - refreshes all MCP server connections.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for refreshAllMcpServer messages.
 * Refreshes all MCP server connections.
 */
export const refreshAllMcpServersHandler: MessageHandler = async (ctx, message) => {
  validateMessage("refreshAllMcpServers", message)
  const mcpHub = ctx.provider.getMcpHub()
  if (mcpHub) {
    await mcpHub.refreshAllConnections()
  }
}
