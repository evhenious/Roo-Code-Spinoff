/**
 * Handler Registry
 *
 * Central registry that maps message types to their handlers.
 * This is the main entry point for message dispatch.
 */

import type { HandlerRegistry } from "../types/handlerTypes"

// Task handlers
import { newTaskHandler } from "./task/newTask"
import { cancelTaskHandler } from "./task/cancelTask"
import { clearTaskHandler } from "./task/clearTask"
import { cancelAutoApprovalHandler } from "./task/cancelAutoApproval"
import { resetStateHandler } from "./task/resetState"
import { exportCurrentTaskHandler } from "./task/exportCurrentTask"
import { showTaskWithIdHandler } from "./task/showTaskWithId"
import { updateTaskTitleHandler } from "./task/updateTaskTitle"

// Settings handlers
import { customInstructionsHandler } from "./settings/customInstructions"
import { updateSettingsHandler } from "./settings/updateSettings"

// Message handlers
import { deleteMessageHandler } from "./messages/deleteMessage"
import { askResponseHandler } from "./messages/askResponse"

// Mode handlers
import { modeHandler } from "./mode/mode"

// UI handlers
import { switchTabHandler } from "./ui/switchTab"
import { insertTextIntoTextareaHandler } from "./ui/insertTextIntoTextarea"
import { focusPanelRequestHandler } from "./ui/focusPanelRequest"

// Command handlers
import { allowedCommandsHandler } from "./commands/allowedCommands"
import { deniedCommandsHandler } from "./commands/deniedCommands"

// MCP handlers
import { deleteMcpServerHandler } from "./mcp/deleteMcpServer"
import { restartMcpServerHandler } from "./mcp/restartMcpServer"
import { toggleToolAlwaysAllowHandler } from "./mcp/toggleToolAlwaysAllow"
import { toggleToolEnabledForPromptHandler } from "./mcp/toggleToolEnabledForPrompt"
import { toggleMcpServerHandler } from "./mcp/toggleMcpServer"
import { refreshAllMcpServersHandler } from "./mcp/refreshAllMcpServers"
import { openMcpSettingsHandler } from "./mcp/openMcpSettings"
import { openProjectMcpSettingsHandler } from "./mcp/openProjectMcpSettings"
import { openCustomModesSettingsHandler } from "./mcp/openCustomModesSettings"

// Search handlers
import { searchFilesHandler } from "./search/searchFiles"
import { searchCommitsHandler } from "./search/searchCommits"

// Todo handlers
import { updateTodoListHandler } from "./todo/updateTodoList"

/**
 * Handler registry mapping message types to handler functions.
 * All migrated handlers are registered here.
 */
export const handlerRegistry: HandlerRegistry = {
  // Task management
  newTask: newTaskHandler,
  cancelTask: cancelTaskHandler,
  clearTask: clearTaskHandler,
  cancelAutoApproval: cancelAutoApprovalHandler,
  resetState: resetStateHandler,
  exportCurrentTask: exportCurrentTaskHandler,
  showTaskWithId: showTaskWithIdHandler,
  updateTaskTitle: updateTaskTitleHandler,

  // Settings
  customInstructions: customInstructionsHandler,
  updateSettings: updateSettingsHandler,

  // Messages
  deleteMessage: deleteMessageHandler,
  askResponse: askResponseHandler,

  // Mode
  mode: modeHandler,

  // UI
  switchTab: switchTabHandler,
  insertTextIntoTextarea: insertTextIntoTextareaHandler,
  focusPanelRequest: focusPanelRequestHandler,

  // Commands
  allowedCommands: allowedCommandsHandler,
  deniedCommands: deniedCommandsHandler,

  // MCP
  deleteMcpServer: deleteMcpServerHandler,
  restartMcpServer: restartMcpServerHandler,
  toggleToolAlwaysAllow: toggleToolAlwaysAllowHandler,
  toggleToolEnabledForPrompt: toggleToolEnabledForPromptHandler,
  toggleMcpServer: toggleMcpServerHandler,
  refreshAllMcpServers: refreshAllMcpServersHandler,
  openMcpSettings: openMcpSettingsHandler,
  openProjectMcpSettings: openProjectMcpSettingsHandler,
  openCustomModesSettings: openCustomModesSettingsHandler,

  // Search
  searchFiles: searchFilesHandler,
  searchCommits: searchCommitsHandler,

  // Todo
  updateTodoList: updateTodoListHandler,
}
