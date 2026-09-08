/**
 * deleteMessageConfirm Handler
 *
 * Handles the "deleteMessageConfirm" message type - confirms deletion of a message with optional checkpoint restore.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import type { ClineMessage } from "@roo-code/types"
import type { ApiMessage } from "../../../task-persistence/apiMessages"
import { handleCheckpointRestoreOperation } from "../../checkpointRestoreHandler"

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

/**
 * Fallback: find first API history index at or after a timestamp.
 */
const findFirstApiIndexAtOrAfter = (ts: number, currentCline: any) => {
  if (typeof ts !== "number") return -1
  return currentCline.apiConversationHistory.findIndex(
    (msg: ApiMessage) => typeof msg?.ts === "number" && (msg.ts as number) >= ts,
  )
}

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("deleteMessageConfirm", message)
  const { messageTs, restoreCheckpoint } = validated

  const currentCline = ctx.provider.getCurrentTask()
  if (!currentCline) {
    console.error("[handleDeleteMessageConfirm] No current cline available")
    return
  }

  const { messageIndex, apiConversationHistoryIndex } = findMessageIndices(messageTs, currentCline)
  let apiIndexToUse = apiConversationHistoryIndex
  const tsThreshold = currentCline.clineMessages[messageIndex]?.ts
  if (apiIndexToUse === -1 && typeof tsThreshold === "number") {
    apiIndexToUse = findFirstApiIndexAtOrAfter(tsThreshold, currentCline)
  }

  if (messageIndex === -1) {
    await vscode.window.showErrorMessage(t("common:errors.message.message_not_found", { messageTs }))
    return
  }

  try {
    const targetMessage = currentCline.clineMessages[messageIndex]

    if (restoreCheckpoint) {
      const checkpoints = currentCline.clineMessages.filter(
        (msg) => msg.say === "checkpoint_saved" && msg.ts > messageTs,
      )

      const nextCheckpoint = checkpoints[0]

      if (nextCheckpoint && nextCheckpoint.text) {
        await handleCheckpointRestoreOperation({
          provider: ctx.provider,
          currentCline,
          messageTs: targetMessage.ts!,
          messageIndex,
          checkpoint: { hash: nextCheckpoint.text },
          operation: "delete",
        })
      } else {
        console.log("[handleDeleteMessageConfirm] No checkpoint found before message")
        vscode.window.showWarningMessage("No checkpoint found before this message")
      }
    } else {
      const preservedCheckpoints = new Map<number, any>()
      for (let i = 0; i < messageIndex; i++) {
        const msg = currentCline.clineMessages[i]
        if (msg?.checkpoint && msg.ts) {
          preservedCheckpoints.set(msg.ts, msg.checkpoint)
        }
      }

      await currentCline.messageManager.rewindToTimestamp(targetMessage.ts!, { includeTargetMessage: false })

      for (const [ts, checkpoint] of preservedCheckpoints) {
        const msgIndex = currentCline.clineMessages.findIndex((msg) => msg.ts === ts)
        if (msgIndex !== -1) {
          currentCline.clineMessages[msgIndex].checkpoint = checkpoint
        }
      }

      const { saveTaskMessages } = await import("../../../task-persistence")
      await saveTaskMessages({
        messages: currentCline.clineMessages,
        taskId: currentCline.taskId,
        globalStoragePath: ctx.provider.contextProxy.globalStorageUri.fsPath,
      })

      await ctx.provider.postStateToWebview()
    }
  } catch (error) {
    console.error("Error in delete message:", error)
    vscode.window.showErrorMessage(
      t("common:errors.message.error_deleting_message", {
        error: error instanceof Error ? error.message : String(error),
      }),
    )
  }
}

export const deleteMessageConfirmHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(t("common:errors.message.delete_failed", { error: errorMessage }))
  }
}
