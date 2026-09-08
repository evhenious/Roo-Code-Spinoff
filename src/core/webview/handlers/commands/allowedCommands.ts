/**
 * allowedCommands Handler
 *
 * Handles the "allowedCommands" message type - updates the list of allowed commands.
 */

import * as vscode from "vscode"
import { Package } from "../../../../shared/package"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { filterValidCommands } from "../../utils/commonHelpers"

/**
 * Handler for allowedCommands messages.
 * Updates the list of allowed commands in state and VSCode settings.
 */
export const allowedCommandsHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("allowedCommands", message)
  const validCommands = filterValidCommands(validated.commands ?? [])

  await ctx.provider.contextProxy.setValue("allowedCommands", validCommands)

  // Also update workspace settings.
  await vscode.workspace
    .getConfiguration(Package.name)
    .update("allowedCommands", validCommands, vscode.ConfigurationTarget.Global)
}
