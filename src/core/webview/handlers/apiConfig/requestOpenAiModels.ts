/**
 * requestOpenAiModels Handler
 *
 * Handles the "requestOpenAiModels" message type - requests OpenAI models.
 */

import { getOpenAiModels } from "../../../../api/providers/openai"
import type { MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("requestOpenAiModels", message)
  const { values } = validated

  if (values?.baseUrl && values?.apiKey) {
    const openAiModels = await getOpenAiModels(
      values.baseUrl,
      values.apiKey,
      values.openAiHeaders as Record<string, string> | undefined,
    )
    ctx.postMessage({ type: "openAiModels", openAiModels })
  }
}

export const requestOpenAiModelsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting OpenAI models: ${errorMessage}`)
  }
}
