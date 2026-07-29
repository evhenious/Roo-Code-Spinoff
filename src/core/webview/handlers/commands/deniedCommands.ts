/**
 * deniedCommands Handler
 *
 * Handles the "deniedCommands" message type - updates the list of denied commands.
 */

import * as vscode from "vscode"
import { Package } from "../../../../shared/package"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { filterValidCommands } from "../../utils/commonHelpers"

/**
 * Handler for deniedCommands messages.
 * Updates the list of denied commands in state and VSCode settings.
 */
export const deniedCommandsHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deniedCommands", message)
  const validCommands = filterValidCommands(validated.commands ?? [])

  await ctx.provider.contextProxy.setValue("deniedCommands", validCommands)

  // Also update workspace settings.
  await vscode.workspace
    .getConfiguration(Package.name)
    .update("deniedCommands", validCommands, vscode.ConfigurationTarget.Global)
}
