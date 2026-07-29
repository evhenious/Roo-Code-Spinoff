/**
 * openMcpSettings Handler
 *
 * Handles the "openMcpSettings" message type - opens the MCP settings file.
 */

import { openFile } from "../../../../integrations/misc/open-file"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for openMcpSettings messages.
 * Opens the MCP settings file in the editor.
 */
export const openMcpSettingsHandler: MessageHandler = async (ctx, message) => {
  validateMessage("openMcpSettings", message)
  const mcpSettingsFilePath = await ctx.provider.getMcpHub()?.getMcpSettingsFilePath()
  if (mcpSettingsFilePath) {
    openFile(mcpSettingsFilePath)
  }
}
