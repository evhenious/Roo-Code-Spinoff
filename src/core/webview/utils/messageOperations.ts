/**
 * Message Operations
 *
 * Shared utility functions for message modification operations (delete, edit).
 * These functions were previously defined inline in webviewMessageHandler.ts
 * and are now exported here for use by individual handlers.
 */

import * as vscode from "vscode"
import { t } from "../../../i18n"
import type { ClineProvider } from "../ClineProvider"
import { handleCheckpointRestoreOperation } from "../checkpointRestoreHandler"
import { saveTaskMessages } from "../../task-persistence"
import type { ApiMessage } from "../../task-persistence/apiMessages"
import type { ClineMessage } from "@roo-code/types"

/**
 * Find message indices based on timestamp.
 * When multiple messages share the same timestamp (e.g., after condense),
 * this function prefers non-summary messages to ensure user operations
 * target the intended message rather than the summary.
 */
export function findMessageIndices(messageTs: number, currentCline: any) {
  // Find the exact message by timestamp, not the first one after a cutoff
  const messageIndex = currentCline.clineMessages.findIndex((msg: ClineMessage) => msg.ts === messageTs)

  // Find all matching API messages by timestamp
  const allApiMatches = currentCline.apiConversationHistory
    .map((msg: ApiMessage, idx: number) => ({ msg, idx }))
    .filter(({ msg }: { msg: ApiMessage }) => msg.ts === messageTs)

  // Prefer non-summary message if multiple matches exist (handles timestamp collision after condense)
  const preferred = allApiMatches.find(({ msg }: { msg: ApiMessage }) => !msg.isSummary) || allApiMatches[0]
  const apiConversationHistoryIndex = preferred?.idx ?? -1

  return { messageIndex, apiConversationHistoryIndex }
}

/**
 * Fallback: find first API history index at or after a timestamp.
 * Used when the exact user message isn't present in apiConversationHistory (e.g., after condense).
 */
function findFirstApiIndexAtOrAfter(ts: number, currentCline: any) {
  if (typeof ts !== "number") return -1
  return currentCline.apiConversationHistory.findIndex(
    (msg: ApiMessage) => typeof msg?.ts === "number" && (msg.ts as number) >= ts,
  )
}

/**
 * Handles message deletion operations with user confirmation
 */
export async function handleDeleteOperation(messageTs: number, provider: ClineProvider): Promise<void> {
  // Check if there's a checkpoint before this message
  const currentCline = provider.getCurrentTask()
  let hasCheckpoint = false

  if (!currentCline) {
    await vscode.window.showErrorMessage(t("common:errors.message.no_active_task_to_delete"))
    return
  }

  const { messageIndex } = findMessageIndices(messageTs, currentCline)

  if (messageIndex !== -1) {
    // Find the last checkpoint before this message
    const checkpoints = currentCline.clineMessages.filter((msg) => msg.say === "checkpoint_saved" && msg.ts > messageTs)
    hasCheckpoint = checkpoints.length > 0
  }

  // Send message to webview to show delete confirmation dialog
  await provider.postMessageToWebview({
    type: "showDeleteMessageDialog",
    messageTs,
    hasCheckpoint,
  })
}

/**
 * Handles confirmed message deletion from webview dialog
 */
export async function handleDeleteMessageConfirm(
  messageTs: number,
  restoreCheckpoint: boolean | undefined,
  provider: ClineProvider,
): Promise<void> {
  const currentCline = provider.getCurrentTask()
  if (!currentCline) {
    console.error("[handleDeleteMessageConfirm] No current cline available")
    return
  }

  const { messageIndex, apiConversationHistoryIndex } = findMessageIndices(messageTs, currentCline)
  // Determine API truncation index with timestamp fallback if exact match not found
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

    // If checkpoint restoration is requested, find and restore to the last checkpoint before this message
    if (restoreCheckpoint) {
      // Find the last checkpoint before this message
      const checkpoints = currentCline.clineMessages.filter(
        (msg) => msg.say === "checkpoint_saved" && msg.ts > messageTs,
      )

      const nextCheckpoint = checkpoints[0]

      if (nextCheckpoint && nextCheckpoint.text) {
        await handleCheckpointRestoreOperation({
          provider,
          currentCline,
          messageTs: targetMessage.ts!,
          messageIndex,
          checkpoint: { hash: nextCheckpoint.text },
          operation: "delete",
        })
      } else {
        // No checkpoint found before this message
        console.log("[handleDeleteMessageConfirm] No checkpoint found before message")
        vscode.window.showWarningMessage("No checkpoint found before this message")
      }
    } else {
      // For non-checkpoint deletes, preserve checkpoint associations for remaining messages
      // Store checkpoints from messages that will be preserved
      const preservedCheckpoints = new Map<number, any>()
      for (let i = 0; i < messageIndex; i++) {
        const msg = currentCline.clineMessages[i]
        if (msg?.checkpoint && msg.ts) {
          preservedCheckpoints.set(msg.ts, msg.checkpoint)
        }
      }

      // Delete this message and all subsequent messages using MessageManager
      await currentCline.messageManager.rewindToTimestamp(targetMessage.ts!, { includeTargetMessage: false })

      // Restore checkpoint associations for preserved messages
      for (const [ts, checkpoint] of preservedCheckpoints) {
        const msgIndex = currentCline.clineMessages.findIndex((msg) => msg.ts === ts)
        if (msgIndex !== -1) {
          currentCline.clineMessages[msgIndex].checkpoint = checkpoint
        }
      }

      // Save the updated messages with restored checkpoints
      await saveTaskMessages({
        messages: currentCline.clineMessages,
        taskId: currentCline.taskId,
        globalStoragePath: provider.contextProxy.globalStorageUri.fsPath,
      })

      // Update the UI to reflect the deletion
      await provider.postStateToWebview()
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

/**
 * Handles message editing operations with user confirmation
 */
export async function handleEditOperation(
  messageTs: number,
  editedContent: string,
  images: string[] | undefined,
  provider: ClineProvider,
): Promise<void> {
  // Check if there's a checkpoint before this message
  const currentCline = provider.getCurrentTask()
  let hasCheckpoint = false
  if (currentCline) {
    const { messageIndex } = findMessageIndices(messageTs, currentCline)
    if (messageIndex !== -1) {
      // Find the last checkpoint before this message
      const checkpoints = currentCline.clineMessages.filter(
        (msg) => msg.say === "checkpoint_saved" && msg.ts > messageTs,
      )

      hasCheckpoint = checkpoints.length > 0
    } else {
      console.log("[messageOperations] Edit - Message not found in clineMessages!")
    }
  } else {
    console.log("[messageOperations] Edit - No currentCline available!")
  }

  // Send message to webview to show edit confirmation dialog
  await provider.postMessageToWebview({
    type: "showEditMessageDialog",
    messageTs,
    text: editedContent,
    hasCheckpoint,
    images,
  })
}

/**
 * Handles confirmed message editing from webview dialog
 */
export async function handleEditMessageConfirm(
  messageTs: number,
  editedContent: string,
  restoreCheckpoint: boolean | undefined,
  images: string[] | undefined,
  provider: ClineProvider,
): Promise<void> {
  const currentCline = provider.getCurrentTask()
  if (!currentCline) {
    console.error("[handleEditMessageConfirm] No current cline available")
    return
  }

  // Use findMessageIndices to find messages based on timestamp
  const { messageIndex, apiConversationHistoryIndex } = findMessageIndices(messageTs, currentCline)

  if (messageIndex === -1) {
    const errorMessage = t("common:errors.message.message_not_found", { messageTs })
    console.error("[handleEditMessageConfirm]", errorMessage)
    await vscode.window.showErrorMessage(errorMessage)
    return
  }

  try {
    const targetMessage = currentCline.clineMessages[messageIndex]

    // If checkpoint restoration is requested, find and restore to the last checkpoint before this message
    if (restoreCheckpoint) {
      // Find the last checkpoint before this message
      const checkpoints = currentCline.clineMessages.filter(
        (msg) => msg.say === "checkpoint_saved" && msg.ts > messageTs,
      )

      const nextCheckpoint = checkpoints[0]

      if (nextCheckpoint && nextCheckpoint.text) {
        await handleCheckpointRestoreOperation({
          provider,
          currentCline,
          messageTs: targetMessage.ts!,
          messageIndex,
          checkpoint: { hash: nextCheckpoint.text },
          operation: "edit",
          editData: {
            editedContent,
            images,
            apiConversationHistoryIndex,
          },
        })
        // The task will be cancelled and reinitialized by checkpointRestore
        // The pending edit will be processed in the reinitialized task
        return
      } else {
        // No checkpoint found before this message
        console.log("[handleEditMessageConfirm] No checkpoint found before message")
        vscode.window.showWarningMessage("No checkpoint found before this message")
        // Continue with non-checkpoint edit
      }
    }

    // For non-checkpoint edits, remove the ORIGINAL user message being edited and all subsequent messages
    // Determine the correct starting index to delete from (prefer the last preceding user_feedback message)
    let deleteFromMessageIndex = messageIndex
    let deleteFromApiIndex = apiConversationHistoryIndex

    // Find the nearest preceding user message to ensure we replace the original, not just the assistant reply
    for (let i = messageIndex; i >= 0; i--) {
      const m = currentCline.clineMessages[i]
      if (m?.say === "user_feedback") {
        deleteFromMessageIndex = i
        // Align API history truncation to the same user message timestamp if present
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

    // Timestamp fallback for API history when exact user message isn't present
    if (deleteFromApiIndex === -1) {
      const tsThresholdForEdit = currentCline.clineMessages[deleteFromMessageIndex]?.ts
      if (typeof tsThresholdForEdit === "number") {
        deleteFromApiIndex = findFirstApiIndexAtOrAfter(tsThresholdForEdit, currentCline)
      }
    }

    // Store checkpoints from messages that will be preserved
    const preservedCheckpoints = new Map<number, any>()
    for (let i = 0; i < deleteFromMessageIndex; i++) {
      const msg = currentCline.clineMessages[i]
      if (msg?.checkpoint && msg.ts) {
        preservedCheckpoints.set(msg.ts, msg.checkpoint)
      }
    }

    // Delete the original (user) message and all subsequent messages using MessageManager
    const rewindTs = currentCline.clineMessages[deleteFromMessageIndex]?.ts
    if (rewindTs) {
      await currentCline.messageManager.rewindToTimestamp(rewindTs, { includeTargetMessage: false })
    }

    // Restore checkpoint associations for preserved messages
    for (const [ts, checkpoint] of preservedCheckpoints) {
      const msgIndex = currentCline.clineMessages.findIndex((msg) => msg.ts === ts)
      if (msgIndex !== -1) {
        currentCline.clineMessages[msgIndex].checkpoint = checkpoint
      }
    }

    // Save the updated messages with restored checkpoints
    await saveTaskMessages({
      messages: currentCline.clineMessages,
      taskId: currentCline.taskId,
      globalStoragePath: provider.contextProxy.globalStorageUri.fsPath,
    })

    // Update the UI to reflect the deletion
    await provider.postStateToWebview()

    await currentCline.submitUserMessage(editedContent, images)
  } catch (error) {
    console.error("Error in edit message:", error)
    vscode.window.showErrorMessage(
      t("common:errors.message.error_editing_message", {
        error: error instanceof Error ? error.message : String(error),
      }),
    )
  }
}

/**
 * Handles message modification operations (delete or edit) with confirmation dialog
 * @param provider - The ClineProvider instance
 * @param messageTs - Timestamp of the message to operate on
 * @param operation - Type of operation ('delete' or 'edit')
 * @param editedContent - New content for edit operations
 * @param images - Images for edit operations
 * @returns Promise<void>
 */
export async function handleMessageModificationsOperation(
  provider: ClineProvider,
  messageTs: number,
  operation: "delete" | "edit",
  editedContent?: string,
  images?: string[],
): Promise<void> {
  if (operation === "delete") {
    await handleDeleteOperation(messageTs, provider)
  } else if (operation === "edit" && editedContent) {
    await handleEditOperation(messageTs, editedContent, images, provider)
  }
}
