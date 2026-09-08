/**
 * requestOllamaModels Handler
 *
 * Handles the "requestOllamaModels" message type - requests Ollama models.
 */

import { flushModels, getModels } from "../../../../api/providers/fetchers/modelCache"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("requestOllamaModels", message)
  const { apiConfiguration: ollamaApiConfig } = await ctx.provider.getState()

  try {
    const ollamaOptions = {
      provider: "ollama" as const,
      baseUrl: ollamaApiConfig.ollamaBaseUrl,
      apiKey: ollamaApiConfig.ollamaApiKey,
    }
    // Flush cache and refresh to ensure fresh models.
    await flushModels(ollamaOptions, true)

    const ollamaModels = await getModels(ollamaOptions)

    if (Object.keys(ollamaModels).length > 0) {
      ctx.postMessage({ type: "ollamaModels", ollamaModels: ollamaModels })
    }
  } catch (error) {
    // Silently fail - user hasn't configured Ollama yet
    console.debug("Ollama models fetch failed:", error)
  }
}

export const requestOllamaModelsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting Ollama models: ${errorMessage}`)
  }
}
