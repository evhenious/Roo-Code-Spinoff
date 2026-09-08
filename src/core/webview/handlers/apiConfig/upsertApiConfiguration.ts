/**
 * upsertApiConfiguration Handler
 *
 * Handles the "upsertApiConfiguration" message type - upserts an API configuration.
 */

import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("upsertApiConfiguration", message)
  const { text, apiConfiguration } = validated

  if (text && apiConfiguration) {
    await ctx.provider.upsertProviderProfile(text, apiConfiguration)
  }
}

export const upsertApiConfigurationHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error upserting API configuration: ${errorMessage}`)
  }
}
