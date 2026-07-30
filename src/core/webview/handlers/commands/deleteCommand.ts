/**
 * deleteCommand Handler
 *
 * Handles the "deleteCommand" message type - deletes a command.
 */

import * as fs from "fs/promises"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteCommand", message)
  const { text, values } = validated

  try {
    if (text && values?.source) {
      const { getCommand } = await import("../../../../services/command/commands")
      const command = await getCommand(ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd, text)

      if (command && command.filePath) {
        // Delete the command file
        await fs.unlink(command.filePath)
        ctx.log(`Deleted command file: ${command.filePath}`)
      } else {
        vscode.window.showErrorMessage(t("common:errors.command_not_found", { name: text }))
      }
    }
  } catch (error) {
    ctx.log(`Error deleting command: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.delete_command"))
  }
}

export const deleteCommandHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting command: ${errorMessage}`)
  }
}
