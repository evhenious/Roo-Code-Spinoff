/**
 * getTaskWithAggregatedCosts Handler
 *
 * Handles the "getTaskWithAggregatedCosts" message type - gets task with cost aggregation.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("getTaskWithAggregatedCosts", message)
  const { text } = validated

  const taskId = text
  if (!taskId) {
    throw new Error("Task ID is required")
  }
  const result = await ctx.provider.getTaskWithAggregatedCosts(taskId)
  await ctx.postMessage({
    type: "taskWithAggregatedCosts",
    // IMPORTANT: ChatView stores aggregatedCostsMap keyed by message.text (taskId)
    // so we must include it here.
    text: taskId,
    historyItem: result.historyItem,
    aggregatedCosts: result.aggregatedCosts,
  })
}

export const getTaskWithAggregatedCostsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    console.error("Error getting task with aggregated costs:", error)
    await ctx.postMessage({
      type: "taskWithAggregatedCosts",
      // Include taskId when available for correlation in UI logs.
      text: message.text,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
