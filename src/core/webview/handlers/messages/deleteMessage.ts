/**
 * deleteMessage Handler
 *
 * Handles the "deleteMessage" message type - initiates message deletion.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"

/**
 * Handler for deleteMessage messages.
 * Validates the message and initiates the deletion operation.
 */
export const deleteMessageHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteMessage", message)

  if (!ctx.provider.getCurrentTask()) {
    await vscode.window.showErrorMessage(t("common:errors.message.no_active_task_to_delete"))
    return
  }

  if (!validated.value) {
    await vscode.window.showErrorMessage(t("common:errors.message.invalid_timestamp_for_deletion"))
    return
  }

  // Import the shared message operations
  const { handleMessageModificationsOperation } = await import("../../utils/messageOperations")
  await handleMessageModificationsOperation(ctx.provider, validated.value, "delete")
}
