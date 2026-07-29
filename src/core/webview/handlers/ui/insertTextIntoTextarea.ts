/**
 * insertTextIntoTextarea Handler
 *
 * Handles the "insertTextIntoTextarea" message type - inserts text into the chat textarea.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for insertTextIntoTextarea messages.
 * Inserts text into the chat textarea in the webview.
 */
export const insertTextIntoTextareaHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("insertTextIntoTextarea", message)
  if (validated.text) {
    await ctx.provider.postMessageToWebview({
      type: "insertTextIntoTextarea",
      text: validated.text,
    })
  }
}
