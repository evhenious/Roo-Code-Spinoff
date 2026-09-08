/**
 * mode Handler
 *
 * Handles the "mode" message type - switches to a different mode.
 */

import type { Mode } from "../../../../shared/modes"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for mode messages.
 * Switches to the specified mode.
 */
export const modeHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("mode", message)
  await ctx.provider.handleModeSwitch(validated.text as Mode)
}
