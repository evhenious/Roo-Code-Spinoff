/**
 * editMessageConfirm Handler
 *
 * Handles the "editMessageConfirm" message type - confirms editing of a message with optional checkpoint restore.
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
  const validated = validateMessage("editMessageConfirm", message)
  const { messageTs, text, images, restoreCheckpoint } = validated

  if (!messageTs || !text) {
    return
  }

  const currentCline = ctx.provider.getCurrentTask()
  if (!currentCline) {
    console.error("[handleEditMessageConfirm] No current cline available")
    return
  }

  const { messageIndex, apiConversationHistoryIndex } = findMessageIndices(messageTs, currentCline)

  if (messageIndex === -1) {
    const errorMessage = t("common:errors.message.message_not_found", { messageTs })
    console.error("[handleEditMessageConfirm]", errorMessage)
    await vscode.window.showErrorMessage(errorMessage)
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
          operation: "edit",
          editData: {
            editedContent: text,
            images,
            apiConversationHistoryIndex,
          },
        })
        return
      } else {
        console.log("[handleEditMessageConfirm] No checkpoint found before message")
        vscode.window.showWarningMessage("No checkpoint found before this message")
      }
    }

    let deleteFromMessageIndex = messageIndex
    let deleteFromApiIndex = apiConversationHistoryIndex

    for (let i = messageIndex; i >= 0; i--) {
      const m = currentCline.clineMessages[i]
      if (m?.say === "user_feedback") {
        deleteFromMessageIndex = i
        const userTs = m.ts
        if (typeof userTs === "number") {
          const apiIdx = currentCline.apiConversationHistory.findIndex((am: ApiMessage) => am.ts === userTs)
          if (apiIdx !== -1) {
            deleteFromApiIndex = apiIdx
          }
        }
        break
      }
    }

    if (deleteFromApiIndex === -1) {
      const tsThresholdForEdit = currentCline.clineMessages[deleteFromMessageIndex]?.ts
      if (typeof tsThresholdForEdit === "number") {
        deleteFromApiIndex = findFirstApiIndexAtOrAfter(tsThresholdForEdit, currentCline)
      }
    }

    const preservedCheckpoints = new Map<number, any>()
    for (let i = 0; i < deleteFromMessageIndex; i++) {
      const msg = currentCline.clineMessages[i]
      if (msg?.checkpoint && msg.ts) {
        preservedCheckpoints.set(msg.ts, msg.checkpoint)
      }
    }

    const rewindTs = currentCline.clineMessages[deleteFromMessageIndex]?.ts
    if (rewindTs) {
      await currentCline.messageManager.rewindToTimestamp(rewindTs, { includeTargetMessage: false })
    }

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

    await currentCline.submitUserMessage(text, images)
  } catch (error) {
    console.error("Error in edit message:", error)
    vscode.window.showErrorMessage(
      t("common:errors.message.error_editing_message", {
        error: error instanceof Error ? error.message : String(error),
      }),
    )
  }
}

export const editMessageConfirmHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(t("common:errors.message.edit_failed", { error: errorMessage }))
  }
}
