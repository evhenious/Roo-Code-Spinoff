/**
 * Worktree Handlers Index
 *
 * Exports all worktree-related handlers.
 * These handlers delegate to existing functions in worktree.ts
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import {
  handleListWorktrees,
  handleCreateWorktree,
  handleDeleteWorktree,
  handleSwitchWorktree,
  handleGetAvailableBranches,
  handleGetWorktreeDefaults,
  handleGetWorktreeIncludeStatus,
  handleCheckBranchWorktreeInclude,
  handleCreateWorktreeInclude,
  handleCheckoutBranch,
} from "../../worktree"
import { t } from "../../../../i18n"
import * as vscode from "vscode"

export const listWorktreesHandler: MessageHandler = async (ctx, message) => {
  try {
    const { worktrees, isGitRepo, isMultiRoot, isSubfolder, gitRootPath, error } = await handleListWorktrees(
      ctx.provider,
    )

    ctx.postMessage({
      type: "worktreeList",
      worktrees,
      isGitRepo,
      isMultiRoot,
      isSubfolder,
      gitRootPath,
      error,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    ctx.postMessage({
      type: "worktreeList",
      worktrees: [],
      isGitRepo: false,
      isMultiRoot: false,
      isSubfolder: false,
      gitRootPath: "",
      error: errorMessage,
    })
  }
}

export const createWorktreeHandler: MessageHandler = async (ctx, message) => {
  try {
    const { success, message: text } = await handleCreateWorktree(
      ctx.provider,
      {
        path: message.worktreePath!,
        branch: message.worktreeBranch,
        baseBranch: message.worktreeBaseBranch,
        createNewBranch: message.worktreeCreateNewBranch,
      },
      (progress) => {
        ctx.postMessage({
          type: "worktreeCopyProgress",
          copyProgressBytesCopied: progress.bytesCopied,
          copyProgressItemName: progress.itemName,
        })
      },
    )

    ctx.postMessage({ type: "worktreeResult", success, text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.postMessage({ type: "worktreeResult", success: false, text: errorMessage })
  }
}

export const deleteWorktreeHandler: MessageHandler = async (ctx, message) => {
  try {
    const { success, message: text } = await handleDeleteWorktree(
      ctx.provider,
      message.worktreePath!,
      message.worktreeForce ?? false,
    )

    ctx.postMessage({ type: "worktreeResult", success, text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.postMessage({ type: "worktreeResult", success: false, text: errorMessage })
  }
}

export const switchWorktreeHandler: MessageHandler = async (ctx, message) => {
  try {
    const { success, message: text } = await handleSwitchWorktree(
      ctx.provider,
      message.worktreePath!,
      message.worktreeNewWindow ?? true,
    )

    ctx.postMessage({ type: "worktreeResult", success, text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.postMessage({ type: "worktreeResult", success: false, text: errorMessage })
  }
}

export const getAvailableBranchesHandler: MessageHandler = async (ctx, message) => {
  try {
    const { localBranches, remoteBranches, currentBranch } = await handleGetAvailableBranches(ctx.provider)

    ctx.postMessage({
      type: "branchList",
      localBranches,
      remoteBranches,
      currentBranch,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    ctx.postMessage({
      type: "branchList",
      localBranches: [],
      remoteBranches: [],
      currentBranch: "",
      error: errorMessage,
    })
  }
}

export const getWorktreeDefaultsHandler: MessageHandler = async (ctx, message) => {
  try {
    const { suggestedBranch, suggestedPath } = await handleGetWorktreeDefaults(ctx.provider)
    ctx.postMessage({ type: "worktreeDefaults", suggestedBranch, suggestedPath })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    ctx.postMessage({
      type: "worktreeDefaults",
      suggestedBranch: "",
      suggestedPath: "",
      error: errorMessage,
    })
  }
}

export const getWorktreeIncludeStatusHandler: MessageHandler = async (ctx, message) => {
  try {
    const worktreeIncludeStatus = await handleGetWorktreeIncludeStatus(ctx.provider)
    ctx.postMessage({ type: "worktreeIncludeStatus", worktreeIncludeStatus })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    ctx.postMessage({
      type: "worktreeIncludeStatus",
      worktreeIncludeStatus: {
        exists: false,
        hasGitignore: false,
        gitignoreContent: undefined,
      },
      error: errorMessage,
    })
  }
}

export const checkBranchWorktreeIncludeHandler: MessageHandler = async (ctx, message) => {
  try {
    const branch = message.worktreeBranch
    if (!branch) {
      ctx.postMessage({
        type: "branchWorktreeIncludeResult",
        hasWorktreeInclude: false,
        error: "No branch specified",
      })
      return
    }
    const hasWorktreeInclude = await handleCheckBranchWorktreeInclude(ctx.provider, branch)
    ctx.postMessage({
      type: "branchWorktreeIncludeResult",
      branch,
      hasWorktreeInclude,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.postMessage({
      type: "branchWorktreeIncludeResult",
      hasWorktreeInclude: false,
      error: errorMessage,
    })
  }
}

export const createWorktreeIncludeHandler: MessageHandler = async (ctx, message) => {
  try {
    const { success, message: text } = await handleCreateWorktreeInclude(
      ctx.provider,
      message.worktreeIncludeContent ?? "",
    )

    ctx.postMessage({ type: "worktreeResult", success, text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error creating worktree include: ${errorMessage}`)
    ctx.postMessage({ type: "worktreeResult", success: false, text: errorMessage })
  }
}

export const checkoutBranchHandler: MessageHandler = async (ctx, message) => {
  try {
    const { success, message: text } = await handleCheckoutBranch(ctx.provider, message.worktreeBranch!)
    ctx.postMessage({ type: "worktreeResult", success, text })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.postMessage({ type: "worktreeResult", success: false, text: errorMessage })
  }
}

export const browseForWorktreePathHandler: MessageHandler = async (ctx, message) => {
  try {
    const options: vscode.OpenDialogOptions = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: t("worktrees:selectWorktreeLocation"),
      title: t("worktrees:selectFolderForWorktree"),
      defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri
        ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "..")
        : undefined,
    }

    const result = await vscode.window.showOpenDialog(options)
    if (result && result[0]) {
      ctx.postMessage({
        type: "folderSelected",
        path: result[0].fsPath,
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening folder picker: ${errorMessage}`)
  }
}
