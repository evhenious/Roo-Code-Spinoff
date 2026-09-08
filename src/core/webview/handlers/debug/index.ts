/**
 * Debug Handlers Index
 *
 * Exports all debug-related handlers.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { fileExistsAtPath } from "../../../../utils/fs"

export const openDebugApiHistoryHandler: MessageHandler = async (ctx, message) => {
  const currentTask = ctx.provider.getCurrentTask()
  if (!currentTask) {
    vscode.window.showErrorMessage("No active task to view history for")
    return
  }

  try {
    const { getTaskDirectoryPath } = await import("../../../../utils/storage")
    const globalStoragePath = ctx.provider.contextProxy.globalStorageUri.fsPath
    const taskDirPath = await getTaskDirectoryPath(globalStoragePath, currentTask.taskId)

    const fileName = "api_conversation_history.json"
    const sourceFilePath = path.join(taskDirPath, fileName)

    // Check if file exists
    if (!(await fileExistsAtPath(sourceFilePath))) {
      vscode.window.showErrorMessage(`File not found: ${fileName}`)
      return
    }

    // Read the source file
    const content = await fs.readFile(sourceFilePath, "utf8")
    let jsonContent: unknown

    try {
      jsonContent = JSON.parse(content)
    } catch {
      vscode.window.showErrorMessage(`Failed to parse ${fileName}`)
      return
    }

    // Prettify the JSON
    const prettifiedContent = JSON.stringify(jsonContent, null, 2)

    // Create a temporary file
    const tmpDir = os.tmpdir()
    const timestamp = Date.now()
    const tempFileName = `roo-debug-api-${currentTask.taskId.slice(0, 8)}-${timestamp}.json`
    const tempFilePath = path.join(tmpDir, tempFileName)

    await fs.writeFile(tempFilePath, prettifiedContent, "utf8")

    // Open the temp file in VS Code
    const doc = await vscode.workspace.openTextDocument(tempFilePath)
    await vscode.window.showTextDocument(doc, { preview: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening debug history: ${errorMessage}`)
    vscode.window.showErrorMessage(`Failed to open debug history: ${errorMessage}`)
  }
}

export const openDebugUiHistoryHandler: MessageHandler = async (ctx, message) => {
  const currentTask = ctx.provider.getCurrentTask()
  if (!currentTask) {
    vscode.window.showErrorMessage("No active task to view history for")
    return
  }

  try {
    const { getTaskDirectoryPath } = await import("../../../../utils/storage")
    const globalStoragePath = ctx.provider.contextProxy.globalStorageUri.fsPath
    const taskDirPath = await getTaskDirectoryPath(globalStoragePath, currentTask.taskId)

    const fileName = "ui_messages.json"
    const sourceFilePath = path.join(taskDirPath, fileName)

    // Check if file exists
    if (!(await fileExistsAtPath(sourceFilePath))) {
      vscode.window.showErrorMessage(`File not found: ${fileName}`)
      return
    }

    // Read the source file
    const content = await fs.readFile(sourceFilePath, "utf8")
    let jsonContent: unknown

    try {
      jsonContent = JSON.parse(content)
    } catch {
      vscode.window.showErrorMessage(`Failed to parse ${fileName}`)
      return
    }

    // Prettify the JSON
    const prettifiedContent = JSON.stringify(jsonContent, null, 2)

    // Create a temporary file
    const tmpDir = os.tmpdir()
    const timestamp = Date.now()
    const tempFileName = `roo-debug-ui-${currentTask.taskId.slice(0, 8)}-${timestamp}.json`
    const tempFilePath = path.join(tmpDir, tempFileName)

    await fs.writeFile(tempFilePath, prettifiedContent, "utf8")

    // Open the temp file in VS Code
    const doc = await vscode.workspace.openTextDocument(tempFilePath)
    await vscode.window.showTextDocument(doc, { preview: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening debug history: ${errorMessage}`)
    vscode.window.showErrorMessage(`Failed to open debug history: ${errorMessage}`)
  }
}

export const downloadErrorDiagnosticsHandler: MessageHandler = async (ctx, message) => {
  const currentTask = ctx.provider.getCurrentTask()
  if (!currentTask) {
    vscode.window.showErrorMessage("No active task to generate diagnostics for")
    return
  }

  const { generateErrorDiagnostics } = await import("../../diagnosticsHandler")
  await generateErrorDiagnostics({
    taskId: currentTask.taskId,
    globalStoragePath: ctx.provider.contextProxy.globalStorageUri.fsPath,
    values: message.values,
    log: (msg) => ctx.log(msg),
  })
}
