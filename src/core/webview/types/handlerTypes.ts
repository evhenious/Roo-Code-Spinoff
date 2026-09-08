/**
 * Handler Types
 *
 * Core type definitions for the webview message handler refactoring.
 * These types define the contract between handlers and the provider.
 */

import type { GlobalState, WebviewMessage, ExtensionMessage } from "@roo-code/types"
import type { ClineProvider } from "../ClineProvider"

/**
 * Context object passed to all handlers.
 * Provides controlled access to provider functionality without exposing
 * the full ClineProvider interface.
 */
export interface HandlerContext {
  /** Reference to the provider for operations that need direct access */
  provider: ClineProvider

  /** Get a value from global state via contextProxy */
  getState: <K extends keyof GlobalState>(key: K) => Promise<GlobalState[K]>

  /** Get the current working directory for the active task */
  getCurrentCwd: () => string

  /** Get the current mode (from active task or global state) */
  getCurrentMode: () => Promise<string>

  /** Post a message to the webview */
  postMessage: (message: ExtensionMessage) => void

  /** Log a message to the provider's log */
  log: (message: string) => void
}

/**
 * Message handler function type.
 * Takes a context and message, returns a promise.
 */
export type MessageHandler = (context: HandlerContext, message: WebviewMessage) => Promise<void>

/**
 * Registry mapping message types to handlers.
 * Keys are message.type values, values are handler functions.
 */
export type HandlerRegistry = Record<string, MessageHandler>

/**
 * Wraps a handler with error handling.
 * Catches errors, logs them, and re-throws for the caller to handle.
 *
 * @param handler - The handler function to wrap
 * @returns A wrapped handler with error handling
 */
export function withErrorHandling(
  handler: (context: HandlerContext, message: WebviewMessage) => Promise<void>,
): MessageHandler {
  return async (context: HandlerContext, message: WebviewMessage) => {
    try {
      await handler(context, message)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      context.log(`Handler error for ${message.type}: ${errorMessage}`)
      throw error
    }
  }
}
