/**
 * OpenAI Codex Handlers Index
 *
 * Exports all OpenAI Codex-related handlers.
 */

import * as vscode from "vscode"
import type { MessageHandler } from "../../types/handlerTypes"

export const openAiCodexSignInHandler: MessageHandler = async (ctx, message) => {
  try {
    const { openAiCodexOAuthManager } = await import("../../../../integrations/openai-codex/oauth")
    const authUrl = openAiCodexOAuthManager.startAuthorizationFlow()

    // Open the authorization URL in the browser
    await vscode.env.openExternal(vscode.Uri.parse(authUrl))

    // Wait for the callback in a separate promise (non-blocking)
    openAiCodexOAuthManager
      .waitForCallback()
      .then(async () => {
        vscode.window.showInformationMessage("Successfully signed in to OpenAI Codex")
        await ctx.provider.postStateToWebview()
      })
      .catch((error: unknown) => {
        ctx.log(`OpenAI Codex OAuth callback failed: ${error}`)
        if (!String(error).includes("timed out")) {
          vscode.window.showErrorMessage(
            `OpenAI Codex sign in failed: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      })
  } catch (error) {
    ctx.log(`OpenAI Codex OAuth failed: ${error}`)
    vscode.window.showErrorMessage("OpenAI Codex sign in failed.")
  }
}

export const openAiCodexSignOutHandler: MessageHandler = async (ctx, message) => {
  try {
    const { openAiCodexOAuthManager } = await import("../../../../integrations/openai-codex/oauth")
    await openAiCodexOAuthManager.clearCredentials()
    vscode.window.showInformationMessage("Signed out from OpenAI Codex")
    await ctx.provider.postStateToWebview()
  } catch (error) {
    ctx.log(`OpenAI Codex sign out failed: ${error}`)
    vscode.window.showErrorMessage("OpenAI Codex sign out failed.")
  }
}

export const requestOpenAiCodexRateLimitsHandler: MessageHandler = async (ctx, message) => {
  try {
    const { openAiCodexOAuthManager } = await import("../../../../integrations/openai-codex/oauth")
    const accessToken = await openAiCodexOAuthManager.getAccessToken()

    if (!accessToken) {
      ctx.postMessage({
        type: "openAiCodexRateLimits",
        error: "Not authenticated with OpenAI Codex",
      })
      return
    }

    const accountId = await openAiCodexOAuthManager.getAccountId()
    const { fetchOpenAiCodexRateLimitInfo } = await import("../../../../integrations/openai-codex/rate-limits")
    const rateLimits = await fetchOpenAiCodexRateLimitInfo(accessToken, { accountId })

    ctx.postMessage({
      type: "openAiCodexRateLimits",
      values: rateLimits,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error fetching OpenAI Codex rate limits: ${errorMessage}`)
    ctx.postMessage({
      type: "openAiCodexRateLimits",
      error: errorMessage,
    })
  }
}
