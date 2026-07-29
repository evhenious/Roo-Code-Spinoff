/**
 * newTask Handler
 *
 * Handles the "newTask" message type - creates a new task from the webview.
 * This serves as a template for all other handlers.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { resolveIncomingImages } from "../../utils/commonHelpers"

/**
 * Raw handler for newTask messages.
 * Validates the message, resolves images, creates a new task, and notifies the UI.
 */
const rawHandler: MessageHandler = async (ctx, message) => {
  // Validate the message against the newTask schema
  const validated = validateMessage("newTask", message)

  const { text, images, taskId, taskConfiguration } = validated

  // Resolve image mentions in the text
  const resolved = await resolveIncomingImages(ctx.provider, { text, images })

  // Create the new task
  await ctx.provider.createTask(resolved.text, resolved.images, undefined, { taskId }, taskConfiguration)

  // Notify the UI to reset
  await ctx.postMessage({ type: "invoke", invoke: "newChat" })
}

/**
 * Handler for newTask messages.
 * On error, resets the UI and shows an error message to the user.
 */
export const newTaskHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    // Reset the UI on error
    await ctx.postMessage({ type: "invoke", invoke: "newChat" })

    // Show error to user
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(t("common:errors.failed_to_create_task", { error: errorMessage }))
  }
}
