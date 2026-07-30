/**
 * deleteMultipleTasksWithIds Handler
 *
 * Handles the "deleteMultipleTasksWithIds" message type - batch deletes tasks.
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteMultipleTasksWithIds", message)
  const { ids } = validated

  if (Array.isArray(ids)) {
    // Process in batches of 20 (or another reasonable number)
    const batchSize = 20
    const results = []

    // Only log start and end of the operation
    console.log(`Batch deletion started: ${ids.length} tasks total`)

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)

      const batchPromises = batch.map(async (id) => {
        try {
          await ctx.provider.deleteTaskWithId(id)
          return { id, success: true }
        } catch (error) {
          // Keep error logging for debugging purposes
          console.log(`Failed to delete task ${id}: ${error instanceof Error ? error.message : String(error)}`)
          return { id, success: false }
        }
      })

      // Process each batch in parallel but wait for completion before starting the next batch
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Update the UI after each batch to show progress
      await ctx.provider.postStateToWebview()
    }

    // Log final results
    const successCount = results.filter((r) => r.success).length
    const failCount = results.length - successCount
    console.log(`Batch deletion completed: ${successCount}/${ids.length} tasks successful, ${failCount} tasks failed`)
  }
}

export const deleteMultipleTasksWithIdsHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting multiple tasks: ${errorMessage}`)
  }
}
