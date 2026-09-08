/**
 * openCommandFile Handler
 *
 * Handles the "openCommandFile" message type - opens a command file.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { openFile } from "../../../../integrations/misc/open-file"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("openCommandFile", message)
  const { text } = validated

  try {
    if (text) {
      const { getCommand } = await import("../../../../services/command/commands")
      const command = await getCommand(ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd, text)

      if (command && command.filePath) {
        openFile(command.filePath)
      } else {
        vscode.window.showErrorMessage(t("common:errors.command_not_found", { name: text }))
      }
    }
  } catch (error) {
    ctx.log(`Error opening command file: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.open_command_file"))
  }
}

export const openCommandFileHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening command file: ${errorMessage}`)
  }
}
