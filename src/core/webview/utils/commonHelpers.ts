/**
 * Common Helpers
 *
 * Extracted utility functions that are commonly used across handlers.
 * These replace inline utility functions that were previously recreated
 * on every call inside webviewMessageHandler.
 */

import * as vscode from "vscode"
import { t } from "../../../i18n"
import type { ClineProvider } from "../ClineProvider"
import { resolveImageMentions } from "../../mentions/resolveImageMentions"

/**
 * Get the current task or show an error and throw.
 *
 * @param provider - The ClineProvider instance
 * @returns The current task
 * @throws Error if no current task exists
 */
export function requireCurrentTask(
  provider: ClineProvider,
): NonNullable<Awaited<ReturnType<typeof provider.getCurrentTask>>> {
  const task = provider.getCurrentTask()
  if (!task) {
    vscode.window.showErrorMessage(t("common:errors.no_active_task"))
    throw new Error("No current task")
  }
  return task
}

/**
 * Validate that a message has required text content.
 *
 * @param message - The message to validate
 * @returns The text content
 * @throws Error if text is missing or empty
 */
export function requireText(message: { text?: string }): string {
  if (!message.text) {
    throw new Error("Message text is required")
  }
  return message.text
}

/**
 * Show an error message to the user and log it.
 *
 * @param provider - The ClineProvider instance
 * @param context - A description of the operation that failed
 * @param error - The error that occurred
 */
export function showError(provider: ClineProvider, context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  provider.log(`${context}: ${errorMessage}`)
  vscode.window.showErrorMessage(errorMessage)
}

/**
 * Format an error message from an unknown error type.
 *
 * @param error - The error to format
 * @returns A string representation of the error
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Get the current working directory from the provider.
 * Checks the current task's cwd first, falls back to provider.cwd.
 *
 * @param provider - The ClineProvider instance
 * @returns The current working directory
 */
export function getCurrentCwd(provider: ClineProvider): string {
  const currentTask = provider.getCurrentTask()
  return currentTask?.cwd || provider.cwd
}

/**
 * Get the current mode from the provider.
 * Checks the current task's mode first, falls back to global state.
 *
 * @param provider - The ClineProvider instance
 * @returns The current mode slug
 */
export async function getCurrentMode(provider: ClineProvider): Promise<string> {
  const { defaultModeSlug } = await import("../../../shared/modes")

  const currentTask = provider.getCurrentTask()

  if (currentTask) {
    try {
      return await currentTask.getTaskMode()
    } catch (error) {
      provider.log(`Error resolving current task mode: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    }
  }

  try {
    const state = await provider.getState()
    if (typeof state.mode === "string" && state.mode.length > 0) {
      return state.mode
    }
  } catch (error) {
    provider.log(`Error resolving global mode: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
  }

  return defaultModeSlug
}

/**
 * Show a success message to the user.
 *
 * @param message - The success message to show
 */
export function showSuccess(message: string): void {
  vscode.window.showInformationMessage(message)
}

/**
 * Show a warning message to the user.
 *
 * @param message - The warning message to show
 */
export function showWarning(message: string): void {
  vscode.window.showWarningMessage(message)
}

/**
 * Check if a value is a valid number.
 *
 * @param value - The value to check
 * @returns True if the value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value)
}

/**
 * Filter an array of strings, removing empty and whitespace-only entries.
 *
 * @param commands - The array of strings to filter
 * @returns The filtered array
 */
export function filterValidCommands(commands: unknown): string[] {
  if (!Array.isArray(commands)) {
    return []
  }
  return commands.filter((cmd): cmd is string => typeof cmd === "string" && cmd.trim().length > 0)
}

/**
 * Resolves image file mentions in incoming messages.
 * Matches read_file behavior: respects size limits and model capabilities.
 *
 * @param provider - The ClineProvider instance
 * @param payload - The text and images to resolve
 * @returns The resolved text and images
 */
export async function resolveIncomingImages(
  provider: ClineProvider,
  payload: { text?: string; images?: string[] },
): Promise<{ text: string; images: string[] }> {
  const text = payload.text ?? ""
  const images = payload.images
  const currentTask = provider.getCurrentTask()
  const state = await provider.getState()
  const resolved = await resolveImageMentions({
    text,
    images,
    cwd: getCurrentCwd(provider),
    rooIgnoreController: currentTask?.rooIgnoreController,
    maxImageFileSize: state.maxImageFileSize,
    maxTotalImageSize: state.maxTotalImageSize,
  })
  return resolved
}
