/**
 * webviewDidLaunch Handler
 *
 * Handles the "webviewDidLaunch" message type - webview launch initialization.
 */

import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { checkExistKey } from "../../../../shared/checkExistApiConfig"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("webviewDidLaunch", message)

  // Load custom modes first
  const customModes = await ctx.provider.customModesManager.getCustomModes()
  await ctx.provider.contextProxy.setValue("customModes", customModes)

  ctx.provider.postStateToWebview()
  ctx.provider.workspaceTracker?.initializeFilePaths() // Don't await.

  // Get theme and post to webview
  const { getTheme } = await import("../../../../integrations/theme/getTheme")
  getTheme().then((theme) => ctx.postMessage({ type: "theme", text: JSON.stringify(theme) }))

  // If MCP Hub is already initialized, update the webview with
  // current server list.
  const mcpHub = ctx.provider.getMcpHub()

  if (mcpHub) {
    ctx.postMessage({ type: "mcpServers", mcpServers: mcpHub.getAllServers() })
  }

  ctx.provider.providerSettingsManager
    .listConfig()
    .then(async (listApiConfig) => {
      if (!listApiConfig) {
        return
      }

      if (listApiConfig.length === 1) {
        // Check if first time init then sync with exist config.
        if (!checkExistKey(listApiConfig[0])) {
          const { apiConfiguration } = await ctx.provider.getState()

          // Only save if the current configuration has meaningful settings
          // (e.g., API keys). This prevents saving a default "anthropic"
          // fallback when no real config exists, which can happen during
          // CLI initialization before provider settings are applied.
          if (checkExistKey(apiConfiguration)) {
            await ctx.provider.providerSettingsManager.saveConfig(listApiConfig[0].name ?? "default", apiConfiguration)

            listApiConfig[0].apiProvider = apiConfiguration.apiProvider
          }
        }
      }

      const currentConfigName = await ctx.provider.contextProxy.getValue("currentApiConfigName")

      if (currentConfigName) {
        if (!(await ctx.provider.providerSettingsManager.hasConfig(currentConfigName))) {
          // Current config name not valid, get first config in list.
          const name = listApiConfig[0]?.name
          await ctx.provider.contextProxy.setValue("currentApiConfigName", name)

          if (name) {
            await ctx.provider.activateProviderProfile({ name })
            return
          }
        }
      }

      await Promise.all([
        await ctx.provider.contextProxy.setValue("listApiConfigMeta", listApiConfig),
        await ctx.postMessage({ type: "listApiConfig", listApiConfig }),
      ])
    })
    .catch((error) =>
      ctx.log(`Error list api configuration: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`),
    )

  ctx.provider.isViewLaunched = true
}

export const webviewDidLaunchHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error during webview launch: ${errorMessage}`)
  }
}
