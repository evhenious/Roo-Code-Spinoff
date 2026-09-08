/**
 * deleteCustomMode Handler
 *
 * Handles the "deleteCustomMode" message type - deletes a custom mode.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { fileExistsAtPath } from "../../../../utils/fs"
import { getWorkspacePath } from "../../../../utils/path"
import { defaultModeSlug } from "../../../../shared/modes"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteCustomMode", message)
  const { slug, checkOnly } = validated

  if (slug) {
    // Get the mode details to determine source and rules folder path
    const customModes = await ctx.provider.customModesManager.getCustomModes()
    const modeToDelete = customModes.find((mode) => mode.slug === slug)

    if (!modeToDelete) {
      return
    }

    // Determine the scope based on source (project or global)
    const scope = modeToDelete.source || "global"

    // Determine the rules folder path
    let rulesFolderPath: string
    if (scope === "project") {
      const workspacePath = getWorkspacePath()
      if (workspacePath) {
        rulesFolderPath = path.join(workspacePath, ".roo", `rules-${slug}`)
      } else {
        rulesFolderPath = path.join(".roo", `rules-${slug}`)
      }
    } else {
      // Global scope - use OS home directory
      const homeDir = os.homedir()
      rulesFolderPath = path.join(homeDir, ".roo", `rules-${slug}`)
    }

    // Check if the rules folder exists
    const rulesFolderExists = await fileExistsAtPath(rulesFolderPath)

    // If this is a check request, send back the folder info
    if (checkOnly) {
      ctx.postMessage({
        type: "deleteCustomModeCheck",
        slug,
        rulesFolderPath: rulesFolderExists ? rulesFolderPath : undefined,
      })
      return
    }

    // Delete the mode
    await ctx.provider.customModesManager.deleteCustomMode(slug)

    // Delete the rules folder if it exists
    if (rulesFolderExists) {
      try {
        await fs.rm(rulesFolderPath, { recursive: true, force: true })
        ctx.log(`Deleted rules folder for mode ${slug}: ${rulesFolderPath}`)
      } catch (error) {
        ctx.log(`Failed to delete rules folder for mode ${slug}: ${error}`)
        // Notify the user about the failure
        vscode.window.showErrorMessage(
          t("common:errors.delete_rules_folder_failed", {
            rulesFolderPath,
            error: error instanceof Error ? error.message : String(error),
          }),
        )
        // Continue with mode deletion even if folder deletion fails
      }
    }

    // Switch back to default mode after deletion
    await ctx.provider.contextProxy.setValue("mode", defaultModeSlug)
    await ctx.provider.postStateToWebview()
  }
}

export const deleteCustomModeHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting custom mode: ${errorMessage}`)
  }
}
