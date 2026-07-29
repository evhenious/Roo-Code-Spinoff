/**
 * toggleToolAlwaysAllow Handler
 *
 * Handles the "toggleToolAlwaysAllow" message type - toggles the always allow setting for a tool.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for toggleToolAlwaysAllow messages.
 * Toggles the always allow setting for the specified tool.
 */
export const toggleToolAlwaysAllowHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("toggleToolAlwaysAllow", message)

  try {
    await ctx.provider
      .getMcpHub()
      ?.toggleToolAlwaysAllow(
        validated.serverName!,
        validated.source ?? "global",
        validated.toolName!,
        Boolean(validated.alwaysAllow),
      )
  } catch (error) {
    ctx.provider.log(
      `Failed to toggle auto-approve for tool ${validated.toolName}: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
    )
  }
}
