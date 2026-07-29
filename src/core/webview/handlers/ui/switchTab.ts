/**
 * switchTab Handler
 *
 * Handles the "switchTab" message type - switches tabs in the webview.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for switchTab messages.
 * Switches to the specified tab in the webview.
 */
export const switchTabHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("switchTab", message)
  if (validated.tab) {
    await ctx.provider.postMessageToWebview({
      type: "action",
      action: "switchTab",
      tab: validated.tab,
      values: validated.values,
    })
  }
}
