/**
 * askResponse Handler
 *
 * Handles the "askResponse" message type - responds to an ask from the agent.
 */

import type { ClineAskResponse } from "@roo-code/types"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { resolveIncomingImages } from "../../utils/commonHelpers"

/**
 * Handler for askResponse messages.
 * Resolves images in the response and forwards to the current task.
 */
export const askResponseHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("askResponse", message)
  const resolved = await resolveIncomingImages(ctx.provider, { text: validated.text, images: validated.images })
  const askResponse = validated.askResponse as ClineAskResponse
  if (askResponse) {
    ctx.provider.getCurrentTask()?.handleWebviewAskResponse(askResponse, resolved.text, resolved.images)
  }
}
