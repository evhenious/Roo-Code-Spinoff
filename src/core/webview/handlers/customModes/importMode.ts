/**
 * importMode Handler
 *
 * Handles the "importMode" message type - imports a custom mode.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("importMode", message)
  const { source } = validated

  try {
    // Get last used directory for import
    const lastImportPath = await ctx.provider.contextProxy.getValue("lastModeImportPath")
    let defaultUri: vscode.Uri | undefined

    if (lastImportPath) {
      // Use the directory from the last import
      const lastDir = path.dirname(lastImportPath)
      defaultUri = vscode.Uri.file(lastDir)
    } else {
      // Default to workspace or home directory
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders && workspaceFolders.length > 0) {
        defaultUri = vscode.Uri.file(workspaceFolders[0].uri.fsPath)
      }
    }

    // Show file picker to select YAML file
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      defaultUri,
      filters: {
        "YAML files": ["yaml", "yml"],
      },
      title: "Select mode export file to import",
    })

    if (fileUri && fileUri[0]) {
      // Save the directory for next time
      await ctx.provider.contextProxy.setValue("lastModeImportPath", fileUri[0].fsPath)

      // Read the file content
      const yamlContent = await fs.readFile(fileUri[0].fsPath, "utf-8")

      // Import the mode with the specified source level
      const result = await ctx.provider.customModesManager.importModeWithRules(
        yamlContent,
        source || "project", // Default to project if not specified
      )

      if (result.success) {
        // Update state after importing
        const customModes = await ctx.provider.customModesManager.getCustomModes()
        await ctx.provider.contextProxy.setValue("customModes", customModes)
        await ctx.provider.postStateToWebview()

        // Send success message to webview, include the imported slug so UI can switch
        ctx.postMessage({
          type: "importModeResult",
          success: true,
          slug: result.slug,
        })

        // Show success message
        vscode.window.showInformationMessage(t("common:info.mode_imported"))
      } else {
        // Send error message to webview
        ctx.postMessage({
          type: "importModeResult",
          success: false,
          error: result.error,
        })

        // Show error message
        vscode.window.showErrorMessage(t("common:errors.mode_import_failed", { error: result.error }))
      }
    } else {
      // User cancelled the file dialog - reset the importing state
      ctx.postMessage({
        type: "importModeResult",
        success: false,
        error: "cancelled",
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Failed to import mode: ${errorMessage}`)

    // Send error message to webview
    ctx.postMessage({
      type: "importModeResult",
      success: false,
      error: errorMessage,
    })

    // Show error message
    vscode.window.showErrorMessage(t("common:errors.mode_import_failed", { error: errorMessage }))
  }
}

export const importModeHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error importing mode: ${errorMessage}`)
  }
}
