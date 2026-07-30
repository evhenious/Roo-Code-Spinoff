/**
 * terminalOperation Handler
 *
 * Handles the "terminalOperation" message type - handles terminal operations.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("terminalOperation", message)
  const { terminalOperation } = validated

  if (terminalOperation) {
    ctx.provider.getCurrentTask()?.handleTerminalOperation(terminalOperation as "continue" | "abort")
  }
}

export const terminalOperationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error in terminal operation: ${errorMessage}`)
  }
}
