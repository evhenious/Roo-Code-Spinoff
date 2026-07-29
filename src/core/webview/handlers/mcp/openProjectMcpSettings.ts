/**
 * openProjectMcpSettings Handler
 *
 * Handles the "openProjectMcpSettings" message type - opens the project-level MCP settings file.
 */

import * as vscode from "vscode"
import * as path from "path"
import * as os from "os"
import { t } from "../../../../i18n"
import { openFile } from "../../../../integrations/misc/open-file"
import { safeWriteJson } from "../../../../utils/safeWriteJson"
import { fileExistsAtPath } from "../../../../utils/fs"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { getCurrentCwd } from "../../utils/commonHelpers"

/**
 * Handler for openProjectMcpSettings messages.
 * Creates and opens the project-level MCP settings file.
 */
export const openProjectMcpSettingsHandler: MessageHandler = async (ctx, message) => {
  validateMessage("openProjectMcpSettings", message)

  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showErrorMessage(t("common:errors.no_workspace"))
    return
  }

  const workspaceFolder = getCurrentCwd(ctx.provider)
  const rooDir = path.join(workspaceFolder, ".roo")
  const mcpPath = path.join(rooDir, "mcp.json")

  try {
    await fs.mkdir(rooDir, { recursive: true })
    const exists = await fileExistsAtPath(mcpPath)

    if (!exists) {
      await safeWriteJson(mcpPath, { mcpServers: {} }, { prettyPrint: true })
    }

    await openFile(mcpPath)
  } catch (error) {
    vscode.window.showErrorMessage(t("mcp:errors.create_json", { error: `${error}` }))
  }
}

// Import fs at the top level for this handler
import * as fs from "fs/promises"
