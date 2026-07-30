/**
 * Message Validators
 *
 * Zod-based validators for commonly used webview message types.
 * These validators provide runtime type checking and validation.
 */

import { z } from "zod"
import type { WebviewMessage } from "@roo-code/types"

// ============================================================================
// Message Schemas
// ============================================================================

/**
 * Schema for newTask messages.
 * Used when creating a new task from the webview.
 */
export const newTaskSchema = z.object({
  type: z.literal("newTask"),
  text: z.string().optional(),
  images: z.array(z.string()).optional(),
  taskId: z.string().optional(),
  taskConfiguration: z.record(z.unknown()).optional(),
})

/**
 * Schema for updateSettings messages.
 * Used when updating settings from the webview.
 */
export const updateSettingsSchema = z.object({
  type: z.literal("updateSettings"),
  updatedSettings: z.record(z.unknown()),
})

/**
 * Schema for deleteMessage messages.
 * Used when deleting a message from the conversation.
 */
export const deleteMessageSchema = z.object({
  type: z.literal("deleteMessage"),
  value: z.number(),
})

/**
 * Schema for submitEditedMessage messages.
 * Used when editing a message in the conversation.
 */
export const submitEditedMessageSchema = z.object({
  type: z.literal("submitEditedMessage"),
  value: z.number(),
  editedMessageContent: z.string(),
  images: z.array(z.string()).optional(),
})

/**
 * Schema for deleteMessageConfirm messages.
 * Used when confirming a message deletion.
 */
export const deleteMessageConfirmSchema = z.object({
  type: z.literal("deleteMessageConfirm"),
  messageTs: z.number(),
  restoreCheckpoint: z.boolean().optional(),
})

/**
 * Schema for editMessageConfirm messages.
 * Used when confirming a message edit.
 */
export const editMessageConfirmSchema = z.object({
  type: z.literal("editMessageConfirm"),
  messageTs: z.number(),
  text: z.string().optional(),
  images: z.array(z.string()).optional(),
  restoreCheckpoint: z.boolean().optional(),
})

/**
 * Schema for askResponse messages.
 * Used when responding to an ask from the agent.
 */
export const askResponseSchema = z.object({
  type: z.literal("askResponse"),
  askResponse: z.string().optional(),
  text: z.string().optional(),
  images: z.array(z.string()).optional(),
})

/**
 * Schema for updateTaskTitle messages.
 * Used when renaming a task.
 */
export const updateTaskTitleSchema = z.object({
  type: z.literal("updateTaskTitle"),
  taskId: z.string().optional(),
  title: z.string().optional(),
})

/**
 * Schema for switchTab messages.
 * Used when switching tabs in the webview.
 */
export const switchTabSchema = z.object({
  type: z.literal("switchTab"),
  tab: z.string().optional(),
  values: z.record(z.unknown()).optional(),
})

/**
 * Schema for insertTextIntoTextarea messages.
 * Used when inserting text into the chat textarea.
 */
export const insertTextIntoTextareaSchema = z.object({
  type: z.literal("insertTextIntoTextarea"),
  text: z.string().optional(),
})

/**
 * Schema for customInstructions messages.
 * Used when updating custom instructions.
 */
export const customInstructionsSchema = z.object({
  type: z.literal("customInstructions"),
  text: z.string().optional(),
})

/**
 * Schema for mode messages.
 * Used when switching modes.
 */
export const modeSchema = z.object({
  type: z.literal("mode"),
  text: z.string().optional(),
})

/**
 * Schema for updatePrompt messages.
 * Used when updating custom mode prompts.
 */
export const updatePromptSchema = z.object({
  type: z.literal("updatePrompt"),
  promptMode: z.string().optional(),
  customPrompt: z.unknown().optional(),
})

/**
 * Schema for openFile messages.
 * Used when opening a file from the webview.
 */
export const openFileSchema = z.object({
  type: z.literal("openFile"),
  text: z.string().optional(),
  values: z.record(z.unknown()).optional(),
})

/**
 * Schema for readFileContent messages.
 * Used when reading file content from the webview.
 */
export const readFileContentSchema = z.object({
  type: z.literal("readFileContent"),
  text: z.string().optional(),
})

/**
 * Schema for openMention messages.
 * Used when opening a mention from the webview.
 */
export const openMentionSchema = z.object({
  type: z.literal("openMention"),
  text: z.string().optional(),
})

/**
 * Schema for openExternal messages.
 * Used when opening an external URL.
 */
export const openExternalSchema = z.object({
  type: z.literal("openExternal"),
  url: z.string().optional(),
})

/**
 * Schema for openImage messages.
 * Used when opening an image from the webview.
 */
export const openImageSchema = z.object({
  type: z.literal("openImage"),
  text: z.string().optional(),
  values: z.record(z.unknown()).optional(),
})

/**
 * Schema for saveImage messages.
 * Used when saving an image from the webview.
 */
export const saveImageSchema = z.object({
  type: z.literal("saveImage"),
  dataUri: z.string().optional(),
})

/**
 * Schema for searchFiles messages.
 * Used when searching files from the webview.
 */
export const searchFilesSchema = z.object({
  type: z.literal("searchFiles"),
  query: z.string().optional(),
  requestId: z.string().optional(),
})

/**
 * Schema for searchCommits messages.
 * Used when searching git commits from the webview.
 */
export const searchCommitsSchema = z.object({
  type: z.literal("searchCommits"),
  query: z.string().optional(),
})

/**
 * Schema for updateTodoList messages.
 * Used when updating the todo list.
 */
export const updateTodoListSchema = z.object({
  type: z.literal("updateTodoList"),
  payload: z.object({ todos: z.array(z.unknown()).optional() }).optional(),
})

/**
 * Schema for allowedCommands messages.
 * Used when updating allowed commands.
 */
export const allowedCommandsSchema = z.object({
  type: z.literal("allowedCommands"),
  commands: z.array(z.string()).optional(),
})

/**
 * Schema for deniedCommands messages.
 * Used when updating denied commands.
 */
export const deniedCommandsSchema = z.object({
  type: z.literal("deniedCommands"),
  commands: z.array(z.string()).optional(),
})

/**
 * Schema for deleteTaskWithId messages.
 * Used when deleting a task by ID.
 */
export const deleteTaskWithIdSchema = z.object({
  type: z.literal("deleteTaskWithId"),
  text: z.string().optional(),
})

/**
 * Schema for deleteMultipleTasksWithIds messages.
 * Used when deleting multiple tasks by IDs.
 */
export const deleteMultipleTasksWithIdsSchema = z.object({
  type: z.literal("deleteMultipleTasksWithIds"),
  ids: z.array(z.string()),
})

/**
 * Schema for exportTaskWithId messages.
 * Used when exporting a task by ID.
 */
export const exportTaskWithIdSchema = z.object({
  type: z.literal("exportTaskWithId"),
  text: z.string().optional(),
})

/**
 * Schema for showTaskWithId messages.
 * Used when showing a task by ID.
 */
export const showTaskWithIdSchema = z.object({
  type: z.literal("showTaskWithId"),
  text: z.string().optional(),
})

/**
 * Schema for condenseTaskContextRequest messages.
 * Used when requesting to condense task context.
 */
export const condenseTaskContextRequestSchema = z.object({
  type: z.literal("condenseTaskContextRequest"),
  text: z.string().optional(),
})

/**
 * Schema for queueMessage messages.
 * Used when queuing a message.
 */
export const queueMessageSchema = z.object({
  type: z.literal("queueMessage"),
  text: z.string().optional(),
  images: z.array(z.string()).optional(),
})

/**
 * Schema for removeQueuedMessage messages.
 * Used when removing a queued message.
 */
export const removeQueuedMessageSchema = z.object({
  type: z.literal("removeQueuedMessage"),
  text: z.string().optional(),
})

/**
 * Schema for deleteMcpServer messages.
 * Used when deleting an MCP server.
 */
export const deleteMcpServerSchema = z.object({
  type: z.literal("deleteMcpServer"),
  serverName: z.string().optional(),
  source: z.enum(["global", "project"]).optional(),
})

/**
 * Schema for restartMcpServer messages.
 * Used when restarting an MCP server.
 */
export const restartMcpServerSchema = z.object({
  type: z.literal("restartMcpServer"),
  text: z.string().optional(),
  source: z.enum(["global", "project"]).optional(),
})

/**
 * Schema for toggleMcpServer messages.
 * Used when toggling an MCP server.
 */
export const toggleMcpServerSchema = z.object({
  type: z.literal("toggleMcpServer"),
  serverName: z.string().optional(),
  disabled: z.boolean().optional(),
  source: z.enum(["global", "project"]).optional(),
})

/**
 * Schema for toggleToolAlwaysAllow messages.
 * Used when toggling tool always allow setting.
 */
export const toggleToolAlwaysAllowSchema = z.object({
  type: z.literal("toggleToolAlwaysAllow"),
  serverName: z.string().optional(),
  source: z.enum(["global", "project"]).optional(),
  toolName: z.string().optional(),
  alwaysAllow: z.boolean().optional(),
})

/**
 * Schema for toggleToolEnabledForPrompt messages.
 * Used when toggling tool enabled for prompt setting.
 */
export const toggleToolEnabledForPromptSchema = z.object({
  type: z.literal("toggleToolEnabledForPrompt"),
  serverName: z.string().optional(),
  source: z.enum(["global", "project"]).optional(),
  toolName: z.string().optional(),
  isEnabled: z.boolean().optional(),
})

/**
 * Schema for updateMcpTimeout messages.
 * Used when updating MCP server timeout.
 */
export const updateMcpTimeoutSchema = z.object({
  type: z.literal("updateMcpTimeout"),
  serverName: z.string().optional(),
  timeout: z.number().optional(),
  source: z.enum(["global", "project"]).optional(),
})

/**
 * Schema for updateCustomMode messages.
 * Used when updating a custom mode.
 */
export const updateCustomModeSchema = z.object({
  type: z.literal("updateCustomMode"),
  modeConfig: z.record(z.unknown()).optional(),
})

/**
 * Schema for deleteCustomMode messages.
 * Used when deleting a custom mode.
 */
export const deleteCustomModeSchema = z.object({
  type: z.literal("deleteCustomMode"),
  slug: z.string().optional(),
  checkOnly: z.boolean().optional(),
})

/**
 * Schema for exportMode messages.
 * Used when exporting a custom mode.
 */
export const exportModeSchema = z.object({
  type: z.literal("exportMode"),
  slug: z.string().optional(),
})

/**
 * Schema for importMode messages.
 * Used when importing a custom mode.
 */
export const importModeSchema = z.object({
  type: z.literal("importMode"),
  source: z.enum(["global", "project"]).optional(),
})

/**
 * Schema for checkRulesDirectory messages.
 * Used when checking rules directory for a custom mode.
 */
export const checkRulesDirectorySchema = z.object({
  type: z.literal("checkRulesDirectory"),
  slug: z.string().optional(),
})

/**
 * Schema for saveApiConfiguration messages.
 * Used when saving an API configuration.
 */
export const saveApiConfigurationSchema = z.object({
  type: z.literal("saveApiConfiguration"),
  text: z.string().optional(),
  apiConfiguration: z.record(z.unknown()).optional(),
})

/**
 * Schema for upsertApiConfiguration messages.
 * Used when upserting an API configuration.
 */
export const upsertApiConfigurationSchema = z.object({
  type: z.literal("upsertApiConfiguration"),
  text: z.string().optional(),
  apiConfiguration: z.record(z.unknown()).optional(),
})

/**
 * Schema for renameApiConfiguration messages.
 * Used when renaming an API configuration.
 */
export const renameApiConfigurationSchema = z.object({
  type: z.literal("renameApiConfiguration"),
  values: z.object({ oldName: z.string(), newName: z.string() }).optional(),
  apiConfiguration: z.record(z.unknown()).optional(),
})

/**
 * Schema for loadApiConfiguration messages.
 * Used when loading an API configuration by name.
 */
export const loadApiConfigurationSchema = z.object({
  type: z.literal("loadApiConfiguration"),
  text: z.string().optional(),
})

/**
 * Schema for loadApiConfigurationById messages.
 * Used when loading an API configuration by ID.
 */
export const loadApiConfigurationByIdSchema = z.object({
  type: z.literal("loadApiConfigurationById"),
  text: z.string().optional(),
})

/**
 * Schema for deleteApiConfiguration messages.
 * Used when deleting an API configuration.
 */
export const deleteApiConfigurationSchema = z.object({
  type: z.literal("deleteApiConfiguration"),
  text: z.string().optional(),
})

/**
 * Schema for getTaskWithAggregatedCosts messages.
 * Used when requesting task costs.
 */
export const getTaskWithAggregatedCostsSchema = z.object({
  type: z.literal("getTaskWithAggregatedCosts"),
  text: z.string().optional(),
})

/**
 * Schema for flushRouterModels messages.
 * Used when flushing router models cache.
 */
export const flushRouterModelsSchema = z.object({
  type: z.literal("flushRouterModels"),
  text: z.string().optional(),
})

/**
 * Schema for requestRouterModels messages.
 * Used when requesting router models.
 */
export const requestRouterModelsSchema = z.object({
  type: z.literal("requestRouterModels"),
  values: z.record(z.unknown()).optional(),
})

/**
 * Schema for requestOllamaModels messages.
 * Used when requesting Ollama models.
 */
export const requestOllamaModelsSchema = z.object({
  type: z.literal("requestOllamaModels"),
})

/**
 * Schema for requestLmStudioModels messages.
 * Used when requesting LM Studio models.
 */
export const requestLmStudioModelsSchema = z.object({
  type: z.literal("requestLmStudioModels"),
})

/**
 * Schema for requestOpenAiModels messages.
 * Used when requesting OpenAI models.
 */
export const requestOpenAiModelsSchema = z.object({
  type: z.literal("requestOpenAiModels"),
  values: z
    .object({
      baseUrl: z.string().optional(),
      apiKey: z.string().optional(),
      openAiHeaders: z.record(z.unknown()).optional(),
    })
    .optional(),
})

/**
 * Schema for updateVSCodeSetting messages.
 * Used when updating VSCode settings.
 */
export const updateVSCodeSettingSchema = z.object({
  type: z.literal("updateVSCodeSetting"),
  setting: z.string().optional(),
  value: z.unknown().optional(),
})

/**
 * Schema for getVSCodeSetting messages.
 * Used when getting VSCode settings.
 */
export const getVSCodeSettingSchema = z.object({
  type: z.literal("getVSCodeSetting"),
  setting: z.string().optional(),
})

/**
 * Schema for createWorktree messages.
 * Used when creating a worktree.
 */
export const createWorktreeSchema = z.object({
  type: z.literal("createWorktree"),
  worktreePath: z.string().optional(),
  worktreeBranch: z.string().optional(),
  worktreeBaseBranch: z.string().optional(),
  worktreeCreateNewBranch: z.boolean().optional(),
})

/**
 * Schema for deleteWorktree messages.
 * Used when deleting a worktree.
 */
export const deleteWorktreeSchema = z.object({
  type: z.literal("deleteWorktree"),
  worktreePath: z.string().optional(),
  worktreeForce: z.boolean().optional(),
})

/**
 * Schema for switchWorktree messages.
 * Used when switching worktrees.
 */
export const switchWorktreeSchema = z.object({
  type: z.literal("switchWorktree"),
  worktreePath: z.string().optional(),
  worktreeNewWindow: z.boolean().optional(),
})

/**
 * Schema for browseForWorktreePath messages.
 * Used when browsing for a worktree path.
 */
export const browseForWorktreePathSchema = z.object({
  type: z.literal("browseForWorktreePath"),
})

/**
 * Schema for createWorktreeInclude messages.
 * Used when creating a worktree include file.
 */
export const createWorktreeIncludeSchema = z.object({
  type: z.literal("createWorktreeInclude"),
  worktreeIncludeContent: z.string().optional(),
})

/**
 * Schema for checkoutBranch messages.
 * Used when checking out a branch.
 */
export const checkoutBranchSchema = z.object({
  type: z.literal("checkoutBranch"),
  worktreeBranch: z.string().optional(),
})

/**
 * Schema for checkBranchWorktreeInclude messages.
 * Used when checking branch worktree include status.
 */
export const checkBranchWorktreeIncludeSchema = z.object({
  type: z.literal("checkBranchWorktreeInclude"),
  worktreeBranch: z.string().optional(),
})

/**
 * Schema for openCommandFile messages.
 * Used when opening a command file.
 */
export const openCommandFileSchema = z.object({
  type: z.literal("openCommandFile"),
  text: z.string().optional(),
})

/**
 * Schema for deleteCommand messages.
 * Used when deleting a command.
 */
export const deleteCommandSchema = z.object({
  type: z.literal("deleteCommand"),
  text: z.string().optional(),
  values: z.object({ source: z.string() }).optional(),
})

/**
 * Schema for createCommand messages.
 * Used when creating a command.
 */
export const createCommandSchema = z.object({
  type: z.literal("createCommand"),
  text: z.string().optional(),
  values: z.object({ source: z.string() }).optional(),
})

/**
 * Schema for openAiCodexSignIn messages.
 * Used when signing in to OpenAI Codex.
 */
export const openAiCodexSignInSchema = z.object({
  type: z.literal("openAiCodexSignIn"),
})

/**
 * Schema for openAiCodexSignOut messages.
 * Used when signing out from OpenAI Codex.
 */
export const openAiCodexSignOutSchema = z.object({
  type: z.literal("openAiCodexSignOut"),
})

/**
 * Schema for requestOpenAiCodexRateLimits messages.
 * Used when requesting OpenAI Codex rate limits.
 */
export const requestOpenAiCodexRateLimitsSchema = z.object({
  type: z.literal("requestOpenAiCodexRateLimits"),
})

/**
 * Schema for focusPanelRequest messages.
 * Used when focusing the panel.
 */
export const focusPanelRequestSchema = z.object({
  type: z.literal("focusPanelRequest"),
})

/**
 * Schema for debugSetting messages.
 * Used when toggling debug mode.
 */
export const debugSettingSchema = z.object({
  type: z.literal("debugSetting"),
  bool: z.boolean().optional(),
})

/**
 * Schema for hasOpenedModeSelector messages.
 * Used when tracking mode selector state.
 */
export const hasOpenedModeSelectorSchema = z.object({
  type: z.literal("hasOpenedModeSelector"),
  bool: z.boolean().optional(),
})

/**
 * Schema for lockApiConfigAcrossModes messages.
 * Used when locking API config across modes.
 */
export const lockApiConfigAcrossModesSchema = z.object({
  type: z.literal("lockApiConfigAcrossModes"),
  bool: z.boolean().optional(),
})

/**
 * Schema for toggleApiConfigPin messages.
 * Used when toggling API config pin.
 */
export const toggleApiConfigPinSchema = z.object({
  type: z.literal("toggleApiConfigPin"),
  text: z.string().optional(),
})

/**
 * Schema for autoApprovalEnabled messages.
 * Used when toggling auto approval.
 */
export const autoApprovalEnabledSchema = z.object({
  type: z.literal("autoApprovalEnabled"),
  bool: z.boolean().optional(),
})

/**
 * Schema for getSystemPrompt messages.
 * Used when requesting the system prompt.
 */
export const getSystemPromptSchema = z.object({
  type: z.literal("getSystemPrompt"),
  mode: z.string().optional(),
})

/**
 * Schema for copySystemPrompt messages.
 * Used when copying the system prompt.
 */
export const copySystemPromptSchema = z.object({
  type: z.literal("copySystemPrompt"),
})

/**
 * Schema for cancelTask messages.
 * Used when canceling the current task.
 */
export const cancelTaskSchema = z.object({
  type: z.literal("cancelTask"),
})

/**
 * Schema for cancelAutoApproval messages.
 * Used when canceling auto approval.
 */
export const cancelAutoApprovalSchema = z.object({
  type: z.literal("cancelAutoApproval"),
})

/**
 * Schema for clearTask messages.
 * Used when clearing the current task.
 */
export const clearTaskSchema = z.object({
  type: z.literal("clearTask"),
})

/**
 * Schema for selectImages messages.
 * Used when selecting images.
 */
export const selectImagesSchema = z.object({
  type: z.literal("selectImages"),
  context: z.string().optional(),
  messageTs: z.number().optional(),
})

/**
 * Schema for exportCurrentTask messages.
 * Used when exporting the current task.
 */
export const exportCurrentTaskSchema = z.object({
  type: z.literal("exportCurrentTask"),
})

/**
 * Schema for importSettings messages.
 * Used when importing settings.
 */
export const importSettingsSchema = z.object({
  type: z.literal("importSettings"),
})

/**
 * Schema for exportSettings messages.
 * Used when exporting settings.
 */
export const exportSettingsSchema = z.object({
  type: z.literal("exportSettings"),
})

/**
 * Schema for resetState messages.
 * Used when resetting state.
 */
export const resetStateSchema = z.object({
  type: z.literal("resetState"),
})

/**
 * Schema for webviewDidLaunch messages.
 * Used when the webview launches.
 */
export const webviewDidLaunchSchema = z.object({
  type: z.literal("webviewDidLaunch"),
})

/**
 * Schema for terminalOperation messages.
 * Used when performing terminal operations.
 */
export const terminalOperationSchema = z.object({
  type: z.literal("terminalOperation"),
  terminalOperation: z.string().optional(),
})

/**
 * Schema for requestCommands messages.
 * Used when requesting slash commands.
 */
export const requestCommandsSchema = z.object({
  type: z.literal("requestCommands"),
})

/**
 * Schema for requestModes messages.
 * Used when requesting available modes.
 */
export const requestModesSchema = z.object({
  type: z.literal("requestModes"),
})

/**
 * Schema for openMcpSettings messages.
 * Used when opening MCP settings.
 */
export const openMcpSettingsSchema = z.object({
  type: z.literal("openMcpSettings"),
})

/**
 * Schema for openProjectMcpSettings messages.
 * Used when opening project MCP settings.
 */
export const openProjectMcpSettingsSchema = z.object({
  type: z.literal("openProjectMcpSettings"),
})

/**
 * Schema for openCustomModesSettings messages.
 * Used when opening custom modes settings.
 */
export const openCustomModesSettingsSchema = z.object({
  type: z.literal("openCustomModesSettings"),
})

/**
 * Schema for openKeyboardShortcuts messages.
 * Used when opening keyboard shortcuts.
 */
export const openKeyboardShortcutsSchema = z.object({
  type: z.literal("openKeyboardShortcuts"),
  text: z.string().optional(),
})

/**
 * Schema for refreshMcpServers messages.
 * Used when refreshing MCP servers.
 */
export const refreshAllMcpServersSchema = z.object({
  type: z.literal("refreshAllMcpServers"),
})

/**
 * Schema for refreshCustomTools messages.
 * Used when refreshing custom tools.
 */
export const refreshCustomToolsSchema = z.object({
  type: z.literal("refreshCustomTools"),
})

/**
 * Schema for getListApiConfiguration messages.
 * Used when requesting the list of API configurations.
 */
export const getListApiConfigurationSchema = z.object({
  type: z.literal("getListApiConfiguration"),
})

/**
 * Schema for checkpointDiff messages.
 * Used when diffing checkpoints.
 */
export const checkpointDiffSchema = z.object({
  type: z.literal("checkpointDiff"),
  payload: z.unknown(),
})

/**
 * Schema for checkpointRestore messages.
 * Used when restoring checkpoints.
 */
export const checkpointRestoreSchema = z.object({
  type: z.literal("checkpointRestore"),
  payload: z.unknown(),
})

/**
 * Schema for downloadErrorDiagnostics messages.
 * Used when downloading error diagnostics.
 */
export const downloadErrorDiagnosticsSchema = z.object({
  type: z.literal("downloadErrorDiagnostics"),
  values: z.record(z.unknown()).optional(),
})

/**
 * Schema for openDebugApiHistory messages.
 * Used when opening debug API history.
 */
export const openDebugApiHistorySchema = z.object({
  type: z.literal("openDebugApiHistory"),
})

/**
 * Schema for openDebugUiHistory messages.
 * Used when opening debug UI history.
 */
export const openDebugUiHistorySchema = z.object({
  type: z.literal("openDebugUiHistory"),
})

/**
 * Schema for openMarkdownPreview messages.
 * Used when opening markdown preview.
 */
export const openMarkdownPreviewSchema = z.object({
  type: z.literal("openMarkdownPreview"),
  text: z.string().optional(),
})

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Registry of all message schemas.
 * Keys correspond to message.type values.
 */
export const MessageSchemas = {
  // Task management
  newTask: newTaskSchema,
  clearTask: clearTaskSchema,
  cancelTask: cancelTaskSchema,
  cancelAutoApproval: cancelAutoApprovalSchema,
  updateTaskTitle: updateTaskTitleSchema,
  condenseTaskContextRequest: condenseTaskContextRequestSchema,
  deleteTaskWithId: deleteTaskWithIdSchema,
  deleteMultipleTasksWithIds: deleteMultipleTasksWithIdsSchema,
  exportTaskWithId: exportTaskWithIdSchema,
  showTaskWithId: showTaskWithIdSchema,
  exportCurrentTask: exportCurrentTaskSchema,
  getTaskWithAggregatedCosts: getTaskWithAggregatedCostsSchema,

  // Settings
  updateSettings: updateSettingsSchema,
  debugSetting: debugSettingSchema,
  hasOpenedModeSelector: hasOpenedModeSelectorSchema,
  lockApiConfigAcrossModes: lockApiConfigAcrossModesSchema,
  toggleApiConfigPin: toggleApiConfigPinSchema,
  autoApprovalEnabled: autoApprovalEnabledSchema,
  resetState: resetStateSchema,

  // Messages
  deleteMessage: deleteMessageSchema,
  submitEditedMessage: submitEditedMessageSchema,
  deleteMessageConfirm: deleteMessageConfirmSchema,
  editMessageConfirm: editMessageConfirmSchema,
  askResponse: askResponseSchema,
  queueMessage: queueMessageSchema,
  removeQueuedMessage: removeQueuedMessageSchema,

  // Mode and prompts
  mode: modeSchema,
  updatePrompt: updatePromptSchema,
  customInstructions: customInstructionsSchema,

  // API Configuration
  saveApiConfiguration: saveApiConfigurationSchema,
  upsertApiConfiguration: upsertApiConfigurationSchema,
  renameApiConfiguration: renameApiConfigurationSchema,
  loadApiConfiguration: loadApiConfigurationSchema,
  loadApiConfigurationById: loadApiConfigurationByIdSchema,
  deleteApiConfiguration: deleteApiConfigurationSchema,
  getListApiConfiguration: getListApiConfigurationSchema,
  flushRouterModels: flushRouterModelsSchema,
  requestRouterModels: requestRouterModelsSchema,
  requestOllamaModels: requestOllamaModelsSchema,
  requestLmStudioModels: requestLmStudioModelsSchema,
  requestOpenAiModels: requestOpenAiModelsSchema,

  // File operations
  openFile: openFileSchema,
  readFileContent: readFileContentSchema,
  openImage: openImageSchema,
  saveImage: saveImageSchema,
  openMention: openMentionSchema,
  openExternal: openExternalSchema,
  openMarkdownPreview: openMarkdownPreviewSchema,

  // Search
  searchFiles: searchFilesSchema,
  searchCommits: searchCommitsSchema,

  // Terminal
  terminalOperation: terminalOperationSchema,

  // Commands
  allowedCommands: allowedCommandsSchema,
  deniedCommands: deniedCommandsSchema,
  requestCommands: requestCommandsSchema,
  openCommandFile: openCommandFileSchema,
  deleteCommand: deleteCommandSchema,
  createCommand: createCommandSchema,

  // MCP
  deleteMcpServer: deleteMcpServerSchema,
  restartMcpServer: restartMcpServerSchema,
  toggleMcpServer: toggleMcpServerSchema,
  toggleToolAlwaysAllow: toggleToolAlwaysAllowSchema,
  toggleToolEnabledForPrompt: toggleToolEnabledForPromptSchema,
  updateMcpTimeout: updateMcpTimeoutSchema,
  openMcpSettings: openMcpSettingsSchema,
  openProjectMcpSettings: openProjectMcpSettingsSchema,
  refreshAllMcpServers: refreshAllMcpServersSchema,

  // Custom Modes
  updateCustomMode: updateCustomModeSchema,
  deleteCustomMode: deleteCustomModeSchema,
  exportMode: exportModeSchema,
  importMode: importModeSchema,
  checkRulesDirectory: checkRulesDirectorySchema,
  openCustomModesSettings: openCustomModesSettingsSchema,

  // System
  webviewDidLaunch: webviewDidLaunchSchema,
  getSystemPrompt: getSystemPromptSchema,
  copySystemPrompt: copySystemPromptSchema,
  refreshCustomTools: refreshCustomToolsSchema,
  importSettings: importSettingsSchema,
  exportSettings: exportSettingsSchema,

  // VSCode Settings
  updateVSCodeSetting: updateVSCodeSettingSchema,
  getVSCodeSetting: getVSCodeSettingSchema,

  // Worktrees
  listWorktrees: z.object({ type: z.literal("listWorktrees") }),
  createWorktree: createWorktreeSchema,
  deleteWorktree: deleteWorktreeSchema,
  switchWorktree: switchWorktreeSchema,
  getAvailableBranches: z.object({ type: z.literal("getAvailableBranches") }),
  getWorktreeDefaults: z.object({ type: z.literal("getWorktreeDefaults") }),
  getWorktreeIncludeStatus: z.object({ type: z.literal("getWorktreeIncludeStatus") }),
  checkBranchWorktreeInclude: checkBranchWorktreeIncludeSchema,
  createWorktreeInclude: createWorktreeIncludeSchema,
  checkoutBranch: checkoutBranchSchema,
  browseForWorktreePath: browseForWorktreePathSchema,

  // Skills
  requestSkills: z.object({ type: z.literal("requestSkills") }),
  createSkill: z.object({ type: z.literal("createSkill") }),
  deleteSkill: z.object({ type: z.literal("deleteSkill") }),
  moveSkill: z.object({ type: z.literal("moveSkill") }),
  updateSkillModes: z.object({ type: z.literal("updateSkillModes") }),
  openSkillFile: z.object({ type: z.literal("openSkillFile") }),

  // UI
  switchTab: switchTabSchema,
  insertTextIntoTextarea: insertTextIntoTextareaSchema,
  selectImages: selectImagesSchema,
  openKeyboardShortcuts: openKeyboardShortcutsSchema,
  // Todo
  updateTodoList: updateTodoListSchema,

  focusPanelRequest: focusPanelRequestSchema,

  // Debug
  openDebugApiHistory: openDebugApiHistorySchema,
  openDebugUiHistory: openDebugUiHistorySchema,
  downloadErrorDiagnostics: downloadErrorDiagnosticsSchema,

  // Checkpoint
  checkpointDiff: checkpointDiffSchema,
  checkpointRestore: checkpointRestoreSchema,

  // OpenAI Codex
  openAiCodexSignIn: openAiCodexSignInSchema,
  openAiCodexSignOut: openAiCodexSignOutSchema,
  requestOpenAiCodexRateLimits: requestOpenAiCodexRateLimitsSchema,
} as const

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Type helper to extract the validated message type for a given schema key.
 */
type SchemaType<T extends keyof typeof MessageSchemas> = z.infer<(typeof MessageSchemas)[T]>

/**
 * Validates a message against its schema based on the message type.
 *
 * @param type - The message type to validate against
 * @param message - The message to validate
 * @returns The validated and parsed message
 * @throws Error if validation fails
 */
export function validateMessage<T extends keyof typeof MessageSchemas>(
  type: T,
  message: WebviewMessage,
): SchemaType<T> {
  const schema = MessageSchemas[type]
  const result = schema.safeParse(message)

  if (!result.success) {
    throw new Error(`Invalid message ${type}: ${result.error.message}`)
  }

  return result.data as SchemaType<T>
}

/**
 * Checks if a message type has a known validator.
 *
 * @param type - The message type to check
 * @returns True if a validator exists for this type
 */
export function hasValidator(type: string): type is keyof typeof MessageSchemas {
  return type in MessageSchemas
}
