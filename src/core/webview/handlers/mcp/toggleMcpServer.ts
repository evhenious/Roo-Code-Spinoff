/**
 * toggleMcpServer Handler
 *
 * Handles the "toggleMcpServer" message type - toggles an MCP server on/off.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for toggleMcpServer messages.
 * Toggles the specified MCP server disabled state.
 */
export const toggleMcpServerHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("toggleMcpServer", message)

  try {
    await ctx.provider
      .getMcpHub()
      ?.toggleServerDisabled(validated.serverName!, validated.disabled!, validated.source ?? "global")
  } catch (error) {
    ctx.provider.log(
      `Failed to toggle MCP server ${validated.serverName}: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
    )
  }
}
