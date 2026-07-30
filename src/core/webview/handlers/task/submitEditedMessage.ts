/**
 * submitEditedMessage Handler
 *
 * Handles the "submitEditedMessage" message type - initiates editing a message in conversation.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import type { ClineMessage } from "@roo-code/types"
import type { ApiMessage } from "../../../task-persistence/apiMessages"

/**
 * Find message indices based on timestamp.
 */
const findMessageIndices = (messageTs: number, currentCline: any) => {
  const messageIndex = currentCline.clineMessages.findIndex((msg: ClineMessage) => msg.ts === messageTs)

  const allApiMatches = currentCline.apiConversationHistory
    .map((msg: ApiMessage, idx: number) => ({ msg, idx }))
    .filter(({ msg }: { msg: ApiMessage }) => msg.ts === messageTs)

  const preferred = allApiMatches.find(({ msg }: { msg: ApiMessage }) => !msg.isSummary) || allApiMatches[0]
  const apiConversationHistoryIndex = preferred?.idx ?? -1

  return { messageIndex, apiConversationHistoryIndex }
}

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("submitEditedMessage", message)
  const { value, editedMessageContent, images } = validated

  if (!ctx.provider.getCurrentTask() || typeof value !== "number" || !value || !editedMessageContent) {
    return
  }

  const currentCline = ctx.provider.getCurrentTask()!
  const { messageIndex } = findMessageIndices(value, currentCline)

  if (messageIndex === -1) {
    await vscode.window.showErrorMessage(t("common:errors.message.invalid_timestamp_for_editing"))
    return
  }

  const targetMessage = currentCline.clineMessages[messageIndex]

  // Check if there's a checkpoint before this message
  let hasCheckpoint = false
  const checkpoints = currentCline.clineMessages.filter(
    (msg) => msg.say === "checkpoint_saved" && msg.ts > targetMessage.ts!,
  )
  hasCheckpoint = checkpoints.length > 0

  // Send message to webview to show edit confirmation dialog
  await ctx.postMessage({
    type: "showEditMessageDialog",
    messageTs: value,
    text: editedMessageContent,
    hasCheckpoint,
    images: images,
  })
}

export const submitEditedMessageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(t("common:errors.message.edit_failed", { error: errorMessage }))
  }
}
