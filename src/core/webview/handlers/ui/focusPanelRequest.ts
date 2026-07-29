/**
 * focusPanelRequest Handler
 *
 * Handles the "focusPanelRequest" message type - focuses the input panel.
 */

import * as vscode from "vscode"
import { getCommand } from "../../../../utils/commands"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for focusPanelRequest messages.
 * Focuses the input panel in the webview.
 */
export const focusPanelRequestHandler: MessageHandler = async (ctx, message) => {
  validateMessage("focusPanelRequest", message)
  // Execute the focusPanel command to focus the WebView
  await vscode.commands.executeCommand(getCommand("focusPanel"))
}
