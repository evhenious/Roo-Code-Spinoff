/**
 * exportMode Handler
 *
 * Handles the "exportMode" message type - exports a custom mode.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { resolveDefaultSaveUri, saveLastExportPath } from "../../../../utils/export"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("exportMode", message)
  const { slug } = validated

  if (slug) {
    try {
      // Get custom mode prompts to check if built-in mode has been customized
      const customModePrompts = (await ctx.provider.contextProxy.getValue("customModePrompts")) || {}
      const customPrompt = customModePrompts[slug]

      // Export the mode with any customizations merged directly
      const result = await ctx.provider.customModesManager.exportModeWithRules(slug, customPrompt)

      if (result.success && result.yaml) {
        const defaultUri = await resolveDefaultSaveUri(
          ctx.provider.contextProxy,
          "lastModeExportPath",
          `${slug}-export.yaml`,
          {
            useWorkspace: true,
            fallbackDir: path.join(os.homedir(), "Downloads"),
          },
        )

        // Show save dialog
        const saveUri = await vscode.window.showSaveDialog({
          defaultUri,
          filters: {
            "YAML files": ["yaml", "yml"],
          },
          title: "Save mode export",
        })

        if (saveUri && result.yaml) {
          // Save the directory for next time
          await saveLastExportPath(ctx.provider.contextProxy, "lastModeExportPath", saveUri)

          // Write the file to the selected location
          await fs.writeFile(saveUri.fsPath, result.yaml, "utf-8")

          // Send success message to webview
          ctx.postMessage({
            type: "exportModeResult",
            success: true,
            slug,
          })

          // Show info message
          vscode.window.showInformationMessage(t("common:info.mode_exported", { mode: slug }))
        } else {
          // User cancelled the save dialog
          ctx.postMessage({
            type: "exportModeResult",
            success: false,
            error: "Export cancelled",
            slug,
          })
        }
      } else {
        // Send error message to webview
        ctx.postMessage({
          type: "exportModeResult",
          success: false,
          error: result.error,
          slug,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      ctx.log(`Failed to export mode ${slug}: ${errorMessage}`)

      // Send error message to webview
      ctx.postMessage({
        type: "exportModeResult",
        success: false,
        error: errorMessage,
        slug,
      })
    }
  }
}

export const exportModeHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error exporting mode: ${errorMessage}`)
  }
}
