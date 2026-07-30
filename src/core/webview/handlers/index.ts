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
import { submitEditedMessageHandler } from "./task/submitEditedMessage"
import { deleteMessageConfirmHandler } from "./task/deleteMessageConfirm"
import { editMessageConfirmHandler } from "./task/editMessageConfirm"
import { queueMessageHandler } from "./task/queueMessage"
import { removeQueuedMessageHandler } from "./task/removeQueuedMessage"
import { condenseTaskContextRequestHandler } from "./task/condenseTaskContextRequest"
import { deleteTaskWithIdHandler } from "./task/deleteTaskWithId"
import { deleteMultipleTasksWithIdsHandler } from "./task/deleteMultipleTasksWithIds"
import { exportTaskWithIdHandler } from "./task/exportTaskWithId"
import { getTaskWithAggregatedCostsHandler } from "./task/getTaskWithAggregatedCosts"
import { editQueuedMessageHandler } from "./task/editQueuedMessage"

// Settings handlers
import { customInstructionsHandler } from "./settings/customInstructions"
import { updateSettingsHandler } from "./settings/updateSettings"
import { importSettingsHandler } from "./settings/importSettings"
import { exportSettingsHandler } from "./settings/exportSettings"
import { debugSettingHandler } from "./settings/debugSetting"
import { hasOpenedModeSelectorHandler } from "./settings/hasOpenedModeSelector"
import { lockApiConfigAcrossModesHandler } from "./settings/lockApiConfigAcrossModes"
import { toggleApiConfigPinHandler } from "./settings/toggleApiConfigPin"
import { autoApprovalEnabledHandler } from "./settings/autoApprovalEnabled"

// Message handlers
import { deleteMessageHandler } from "./messages/deleteMessage"
import { askResponseHandler } from "./messages/askResponse"

// Mode handlers
import { modeHandler } from "./mode/mode"

// UI handlers
import { switchTabHandler } from "./ui/switchTab"
import { insertTextIntoTextareaHandler } from "./ui/insertTextIntoTextarea"
import { focusPanelRequestHandler } from "./ui/focusPanelRequest"
import { selectImagesHandler, openKeyboardShortcutsHandler } from "./ui"

// Command handlers
import { allowedCommandsHandler } from "./commands/allowedCommands"
import { deniedCommandsHandler } from "./commands/deniedCommands"
import { requestCommandsHandler } from "./commands/requestCommands"
import { openCommandFileHandler } from "./commands/openCommandFile"
import { deleteCommandHandler } from "./commands/deleteCommand"
import { createCommandHandler } from "./commands/createCommand"

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

// API Configuration handlers
import { saveApiConfigurationHandler } from "./apiConfig/saveApiConfiguration"
import { upsertApiConfigurationHandler } from "./apiConfig/upsertApiConfiguration"
import { renameApiConfigurationHandler } from "./apiConfig/renameApiConfiguration"
import { loadApiConfigurationHandler } from "./apiConfig/loadApiConfiguration"
import { loadApiConfigurationByIdHandler } from "./apiConfig/loadApiConfigurationById"
import { deleteApiConfigurationHandler } from "./apiConfig/deleteApiConfiguration"
import { getListApiConfigurationHandler } from "./apiConfig/getListApiConfiguration"
import { flushRouterModelsHandler } from "./apiConfig/flushRouterModels"
import { requestRouterModelsHandler } from "./apiConfig/requestRouterModels"
import { requestOllamaModelsHandler } from "./apiConfig/requestOllamaModels"
import { requestLmStudioModelsHandler } from "./apiConfig/requestLmStudioModels"
import { requestOpenAiModelsHandler } from "./apiConfig/requestOpenAiModels"

// System handlers
import { webviewDidLaunchHandler } from "./system/webviewDidLaunch"
import { getSystemPromptHandler } from "./system/getSystemPrompt"
import { copySystemPromptHandler } from "./system/copySystemPrompt"
import { refreshCustomToolsHandler } from "./system/refreshCustomTools"
import { terminalOperationHandler } from "./system/terminalOperation"

// File operation handlers
import { openFileHandler } from "./files/openFile"
import { readFileContentHandler } from "./files/readFileContent"
import { openImageHandler } from "./files/openImage"
import { saveImageHandler } from "./files/saveImage"
import { openMentionHandler } from "./files/openMention"
import { openExternalHandler } from "./files/openExternal"
import { openMarkdownPreviewHandler } from "./files/openMarkdownPreview"

// Custom Modes handlers
import { updateCustomModeHandler } from "./customModes/updateCustomMode"
import { deleteCustomModeHandler } from "./customModes/deleteCustomMode"
import { exportModeHandler } from "./customModes/exportMode"
import { importModeHandler } from "./customModes/importMode"
import { checkRulesDirectoryHandler } from "./customModes/checkRulesDirectory"

// VSCode Settings handlers
import { updateVSCodeSettingHandler } from "./vscodeSettings/updateVSCodeSetting"
import { getVSCodeSettingHandler } from "./vscodeSettings/getVSCodeSetting"

// Worktree handlers
import {
  listWorktreesHandler,
  createWorktreeHandler,
  deleteWorktreeHandler,
  switchWorktreeHandler,
  getAvailableBranchesHandler,
  getWorktreeDefaultsHandler,
  getWorktreeIncludeStatusHandler,
  checkBranchWorktreeIncludeHandler,
  createWorktreeIncludeHandler,
  checkoutBranchHandler,
  browseForWorktreePathHandler,
} from "./worktrees"

// Skill handlers
import {
  requestSkillsHandler,
  createSkillHandler,
  deleteSkillHandler,
  moveSkillHandler,
  updateSkillModesHandler,
  openSkillFileHandler,
} from "./skills"

// Debug handlers
import { openDebugApiHistoryHandler, openDebugUiHistoryHandler, downloadErrorDiagnosticsHandler } from "./debug"

// Checkpoint handlers
import { checkpointDiffHandler, checkpointRestoreHandler } from "./checkpoint"

// OpenAI Codex handlers
import { openAiCodexSignInHandler, openAiCodexSignOutHandler, requestOpenAiCodexRateLimitsHandler } from "./codex"

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
  submitEditedMessage: submitEditedMessageHandler,
  deleteMessageConfirm: deleteMessageConfirmHandler,
  editMessageConfirm: editMessageConfirmHandler,
  queueMessage: queueMessageHandler,
  removeQueuedMessage: removeQueuedMessageHandler,
  editQueuedMessage: editQueuedMessageHandler,
  condenseTaskContextRequest: condenseTaskContextRequestHandler,
  deleteTaskWithId: deleteTaskWithIdHandler,
  deleteMultipleTasksWithIds: deleteMultipleTasksWithIdsHandler,
  exportTaskWithId: exportTaskWithIdHandler,
  getTaskWithAggregatedCosts: getTaskWithAggregatedCostsHandler,

  // Settings
  customInstructions: customInstructionsHandler,
  updateSettings: updateSettingsHandler,
  importSettings: importSettingsHandler,
  exportSettings: exportSettingsHandler,
  debugSetting: debugSettingHandler,
  hasOpenedModeSelector: hasOpenedModeSelectorHandler,
  lockApiConfigAcrossModes: lockApiConfigAcrossModesHandler,
  toggleApiConfigPin: toggleApiConfigPinHandler,
  autoApprovalEnabled: autoApprovalEnabledHandler,

  // Messages
  deleteMessage: deleteMessageHandler,
  askResponse: askResponseHandler,

  // Mode
  mode: modeHandler,

  // UI
  switchTab: switchTabHandler,
  insertTextIntoTextarea: insertTextIntoTextareaHandler,
  focusPanelRequest: focusPanelRequestHandler,
  selectImages: selectImagesHandler,
  openKeyboardShortcuts: openKeyboardShortcutsHandler,

  // Commands
  allowedCommands: allowedCommandsHandler,
  deniedCommands: deniedCommandsHandler,
  requestCommands: requestCommandsHandler,
  openCommandFile: openCommandFileHandler,
  deleteCommand: deleteCommandHandler,
  createCommand: createCommandHandler,

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

  // API Configuration
  saveApiConfiguration: saveApiConfigurationHandler,
  upsertApiConfiguration: upsertApiConfigurationHandler,
  renameApiConfiguration: renameApiConfigurationHandler,
  loadApiConfiguration: loadApiConfigurationHandler,
  loadApiConfigurationById: loadApiConfigurationByIdHandler,
  deleteApiConfiguration: deleteApiConfigurationHandler,
  getListApiConfiguration: getListApiConfigurationHandler,
  flushRouterModels: flushRouterModelsHandler,
  requestRouterModels: requestRouterModelsHandler,
  requestOllamaModels: requestOllamaModelsHandler,
  requestLmStudioModels: requestLmStudioModelsHandler,
  requestOpenAiModels: requestOpenAiModelsHandler,

  // System
  webviewDidLaunch: webviewDidLaunchHandler,
  getSystemPrompt: getSystemPromptHandler,
  copySystemPrompt: copySystemPromptHandler,
  refreshCustomTools: refreshCustomToolsHandler,
  terminalOperation: terminalOperationHandler,

  // File operations
  openFile: openFileHandler,
  readFileContent: readFileContentHandler,
  openImage: openImageHandler,
  saveImage: saveImageHandler,
  openMention: openMentionHandler,
  openExternal: openExternalHandler,
  openMarkdownPreview: openMarkdownPreviewHandler,

  // Custom Modes
  updateCustomMode: updateCustomModeHandler,
  deleteCustomMode: deleteCustomModeHandler,
  exportMode: exportModeHandler,
  importMode: importModeHandler,
  checkRulesDirectory: checkRulesDirectoryHandler,

  // VSCode Settings
  updateVSCodeSetting: updateVSCodeSettingHandler,
  getVSCodeSetting: getVSCodeSettingHandler,

  // Worktrees
  listWorktrees: listWorktreesHandler,
  createWorktree: createWorktreeHandler,
  deleteWorktree: deleteWorktreeHandler,
  switchWorktree: switchWorktreeHandler,
  getAvailableBranches: getAvailableBranchesHandler,
  getWorktreeDefaults: getWorktreeDefaultsHandler,
  getWorktreeIncludeStatus: getWorktreeIncludeStatusHandler,
  checkBranchWorktreeInclude: checkBranchWorktreeIncludeHandler,
  createWorktreeInclude: createWorktreeIncludeHandler,
  checkoutBranch: checkoutBranchHandler,
  browseForWorktreePath: browseForWorktreePathHandler,

  // Skills
  requestSkills: requestSkillsHandler,
  createSkill: createSkillHandler,
  deleteSkill: deleteSkillHandler,
  moveSkill: moveSkillHandler,
  updateSkillModes: updateSkillModesHandler,
  openSkillFile: openSkillFileHandler,

  // Debug
  openDebugApiHistory: openDebugApiHistoryHandler,
  openDebugUiHistory: openDebugUiHistoryHandler,
  downloadErrorDiagnostics: downloadErrorDiagnosticsHandler,

  // Checkpoint
  checkpointDiff: checkpointDiffHandler,
  checkpointRestore: checkpointRestoreHandler,

  // OpenAI Codex
  openAiCodexSignIn: openAiCodexSignInHandler,
  openAiCodexSignOut: openAiCodexSignOutHandler,
  requestOpenAiCodexRateLimits: requestOpenAiCodexRateLimitsHandler,
}
