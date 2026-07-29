/**
 * restartMcpServer Handler
 *
 * Handles the "restartMcpServer" message type - restarts an MCP server.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for restartMcpServer messages.
 * Restarts the specified MCP server connection.
 */
export const restartMcpServerHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("restartMcpServer", message)

  try {
    await ctx.provider.getMcpHub()?.restartConnection(validated.text!, validated.source ?? "global")
  } catch (error) {
    ctx.provider.log(
      `Failed to retry connection for ${validated.text}: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
    )
  }
}
