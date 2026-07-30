/**
 * requestRouterModels Handler
 *
 * Handles the "requestRouterModels" message type - requests models from routers.
 */

import type { ModelRecord } from "@roo-code/types"
import { flushModels, getModels } from "../../../../api/providers/fetchers/modelCache"
import type { RouterName } from "../../../../shared/api"
import { toRouterName } from "../../../../shared/api"
import type { MessageHandler } from "../../types/handlerTypes"

const rawHandler: MessageHandler = async (ctx, message) => {
  const { apiConfiguration } = await ctx.provider.getState()

  // Optional single provider filter from webview
  const requestedProvider = message?.values?.provider
  const providerFilter = requestedProvider ? toRouterName(requestedProvider) : undefined

  // Optional refresh flag to flush cache before fetching (useful for providers requiring credentials)
  const shouldRefresh = message?.values?.refresh === true

  const routerModels: Record<RouterName, ModelRecord> = providerFilter
    ? ({} as Record<RouterName, ModelRecord>)
    : {
        openrouter: {},
        "vercel-ai-gateway": {},
        litellm: {},
        requesty: {},
        ollama: {},
        lmstudio: {},
        poe: {},
      }

  const safeGetModels = async (options: any): Promise<ModelRecord> => {
    try {
      return await getModels(options)
    } catch (error) {
      console.error(
        `Failed to fetch models in webviewMessageHandler requestRouterModels for ${options.provider}:`,
        error,
      )
      throw error // Re-throw to be caught by Promise.allSettled.
    }
  }

  // Base candidates (only those handled by this aggregate fetcher)
  const candidates: { key: RouterName; options: any }[] = [
    { key: "openrouter", options: { provider: "openrouter" } },
    {
      key: "requesty",
      options: {
        provider: "requesty",
        apiKey: apiConfiguration.requestyApiKey,
        baseUrl: apiConfiguration.requestyBaseUrl,
      },
    },
    { key: "vercel-ai-gateway", options: { provider: "vercel-ai-gateway" } },
  ]

  // LiteLLM is conditional on baseUrl+apiKey
  const litellmApiKey = apiConfiguration.litellmApiKey || message?.values?.litellmApiKey
  const litellmBaseUrl = apiConfiguration.litellmBaseUrl || message?.values?.litellmBaseUrl

  if (litellmApiKey && litellmBaseUrl) {
    // If explicit credentials are provided in message.values (from Refresh Models button),
    // flush the cache first to ensure we fetch fresh data with the new credentials
    if (message?.values?.litellmApiKey || message?.values?.litellmBaseUrl) {
      await flushModels({ provider: "litellm", apiKey: litellmApiKey, baseUrl: litellmBaseUrl }, true)
    }

    candidates.push({
      key: "litellm",
      options: { provider: "litellm", apiKey: litellmApiKey, baseUrl: litellmBaseUrl },
    })
  }

  // Poe is conditional on apiKey
  const poeApiKey = apiConfiguration.poeApiKey || message?.values?.poeApiKey
  const poeBaseUrl = apiConfiguration.poeBaseUrl || message?.values?.poeBaseUrl

  if (poeApiKey) {
    if (message?.values?.poeApiKey || message?.values?.poeBaseUrl) {
      await flushModels({ provider: "poe", apiKey: poeApiKey, baseUrl: poeBaseUrl }, true)
    }

    candidates.push({
      key: "poe",
      options: { provider: "poe", apiKey: poeApiKey, baseUrl: poeBaseUrl },
    })
  }

  // Apply single provider filter if specified
  const modelFetchPromises = providerFilter ? candidates.filter(({ key }) => key === providerFilter) : candidates

  // If refresh flag is set and we have a specific provider, flush its cache first
  if (shouldRefresh && providerFilter && modelFetchPromises.length > 0) {
    const targetCandidate = modelFetchPromises[0]
    await flushModels(targetCandidate.options, true)
  }

  const results = await Promise.allSettled(
    modelFetchPromises.map(async ({ key, options }) => {
      const models = await safeGetModels(options)
      return { key, models } // The key is `ProviderName` here.
    }),
  )

  results.forEach((result, index) => {
    const routerName = modelFetchPromises[index].key

    if (result.status === "fulfilled") {
      routerModels[routerName] = result.value.models

      // Ollama and LM Studio settings pages still need these events. They are not fetched here.
    } else {
      // Handle rejection: Post a specific error message for this provider.
      const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason)
      console.error(`Error fetching models for ${routerName}:`, result.reason)

      routerModels[routerName] = {} // Ensure it's an empty object in the main routerModels message.

      ctx.postMessage({
        type: "singleRouterModelFetchResponse",
        success: false,
        error: errorMessage,
        values: { provider: routerName },
      })
    }
  })

  ctx.postMessage({
    type: "routerModels",
    routerModels,
    values: providerFilter ? { provider: requestedProvider } : undefined,
  })
}

export const requestRouterModelsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting router models: ${errorMessage}`)
  }
}
