/**
 * Checkpoint Handlers Index
 *
 * Exports all checkpoint-related handlers.
 */

import { checkoutDiffPayloadSchema, checkoutRestorePayloadSchema } from "@roo-code/types"
import pWaitFor from "p-wait-for"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { MessageHandler } from "../../types/handlerTypes"

export const checkpointDiffHandler: MessageHandler = async (ctx, message) => {
  const result = checkoutDiffPayloadSchema.safeParse(message.payload)

  if (result.success) {
    ctx.provider.getCurrentTask()?.checkpointDiff(result.data)
  }
}

export const checkpointRestoreHandler: MessageHandler = async (ctx, message) => {
  const result = checkoutRestorePayloadSchema.safeParse(message.payload)

  if (result.success) {
    await ctx.provider.cancelTask()

    try {
      await pWaitFor(() => ctx.provider.getCurrentTask()?.isInitialized === true, { timeout: 3_000 })
    } catch (error) {
      vscode.window.showErrorMessage(t("common:errors.checkpoint_timeout"))
    }

    try {
      ctx.provider.getCurrentTask()?.checkpointRestore(result.data)
    } catch (error) {
      vscode.window.showErrorMessage(t("common:errors.checkpoint_failed"))
    }
  }
}
