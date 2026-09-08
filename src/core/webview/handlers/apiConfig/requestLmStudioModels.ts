/**
 * requestLmStudioModels Handler
 *
 * Handles the "requestLmStudioModels" message type - requests LM Studio models.
 */

import { flushModels, getModels } from "../../../../api/providers/fetchers/modelCache"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("requestLmStudioModels", message) // no message exected, just type. it's fine
  const { apiConfiguration: lmStudioApiConfig } = await ctx.provider.getState()

  try {
    const lmStudioOptions = {
      provider: "lmstudio" as const,
      baseUrl: lmStudioApiConfig.lmStudioBaseUrl,
    }
    // Flush cache and refresh to ensure fresh models.
    await flushModels(lmStudioOptions, true)

    const lmStudioModels = await getModels(lmStudioOptions)

    if (Object.keys(lmStudioModels).length > 0) {
      ctx.postMessage({
        type: "lmStudioModels",
        lmStudioModels: lmStudioModels,
      })
    }
  } catch (error) {
    // Silently fail - user hasn't configured LM Studio yet.
    console.debug("LM Studio models fetch failed:", error)
  }
}

export const requestLmStudioModelsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting LM Studio models: ${errorMessage}`)
  }
}
