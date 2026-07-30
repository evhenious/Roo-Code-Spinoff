/**
 * flushRouterModels Handler
 *
 * Handles the "flushRouterModels" message type - flushes router models cache.
 */

import { flushModels } from "../../../../api/providers/fetchers/modelCache"
import { GetModelsOptions, toRouterName } from "../../../../shared/api"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("flushRouterModels", message)
  const { text } = validated

  const routerNameFlush = toRouterName(text)
  // Note: flushRouterModels is a generic flush without credentials
  // For providers that need credentials, use their specific handlers
  await flushModels({ provider: routerNameFlush } as GetModelsOptions, true)
}

export const flushRouterModelsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error flushing router models: ${errorMessage}`)
  }
}
