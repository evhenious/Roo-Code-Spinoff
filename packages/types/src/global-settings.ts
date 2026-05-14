import { z } from "zod"

import { type Keys } from "./type-fu.js"
import {
	type ProviderSettings,
	PROVIDER_SETTINGS_KEYS,
	providerSettingsEntrySchema,
	providerSettingsSchema,
} from "./provider-settings.js"
import { historyItemSchema } from "./history.js"
import { codebaseIndexModelsSchema, codebaseIndexConfigSchema } from "./codebase-index.js"
import { experimentsSchema } from "./experiment.js"
import { modeConfigSchema } from "./mode.js"
import { customModePromptsSchema, customSupportPromptsSchema } from "./mode.js"
import { toolNamesSchema } from "./tool.js"
import { languagesSchema } from "./vscode.js"

/**
 * Default delay in milliseconds after writes to allow diagnostics to detect potential problems.
 * This delay is particularly important for Go and other languages where tools like goimports
 * need time to automatically clean up unused imports.
 */
export const DEFAULT_WRITE_DELAY_MS = 1000

/**
 * Terminal output preview size options for persisted command output.
 *
 * Controls how much command output is kept in memory as a "preview" before
 * the LLM decides to retrieve more via `read_command_output`. Larger previews
 * mean more immediate context but consume more of the context window.
 *
 * - `small`: 5KB preview - Best for long-running commands with verbose output
 * - `medium`: 10KB preview - Balanced default for most use cases
 * - `large`: 20KB preview - Best when commands produce critical info early
 *
 * @see OutputInterceptor - Uses this setting to determine when to spill to disk
 * @see PersistedCommandOutput - Contains the resulting preview and artifact reference
 */
export type TerminalOutputPreviewSize = "small" | "medium" | "large"

/**
 * Byte limits for each terminal output preview size.
 *
 * Maps preview size names to their corresponding byte thresholds.
 * When command output exceeds these thresholds, the excess is persisted
 * to disk and made available via the `read_command_output` tool.
 */
export const TERMINAL_PREVIEW_BYTES: Record<TerminalOutputPreviewSize, number> = {
	small: 5 * 1024, // 5KB
	medium: 10 * 1024, // 10KB
	large: 20 * 1024, // 20KB
}

/**
 * Default terminal output preview size.
 * The "medium" (10KB) setting provides a good balance between immediate
 * visibility and context window conservation for most use cases.
 */
export const DEFAULT_TERMINAL_OUTPUT_PREVIEW_SIZE: TerminalOutputPreviewSize = "medium"

/**
 * Minimum checkpoint timeout in seconds.
 */
export const MIN_CHECKPOINT_TIMEOUT_SECONDS = 10

/**
 * Maximum checkpoint timeout in seconds.
 */
export const MAX_CHECKPOINT_TIMEOUT_SECONDS = 60

/**
 * Default checkpoint timeout in seconds.
 */
export const DEFAULT_CHECKPOINT_TIMEOUT_SECONDS = 15

/**
 * GlobalSettings
 */

export const globalSettingsSchema = z.object({
	currentApiConfigName: z.string().default("default"),
	listApiConfigMeta: z.array(providerSettingsEntrySchema).default([]),
	pinnedApiConfigs: z.record(z.string(), z.boolean()).default({}),

	customInstructions: z.string().default(""),
	taskHistory: z.array(historyItemSchema).optional(),

	// Image generation settings (experimental) - flattened for simplicity
	imageGenerationProvider: z.enum(["openrouter"]).default("openrouter"),
	openRouterImageApiKey: z.string().default(""),
	openRouterImageGenerationSelectedModel: z.string().default(""),

	customCondensingPrompt: z.string().default(""),

	autoApprovalEnabled: z.boolean().default(false),
	alwaysAllowReadOnly: z.boolean().default(false),
	alwaysAllowReadOnlyOutsideWorkspace: z.boolean().default(false),
	alwaysAllowWrite: z.boolean().default(false),
	alwaysAllowWriteOutsideWorkspace: z.boolean().default(false),
	alwaysAllowWriteProtected: z.boolean().default(false),
	writeDelayMs: z.number().min(0).default(DEFAULT_WRITE_DELAY_MS),
	requestDelaySeconds: z.number().optional(),
	alwaysAllowMcp: z.boolean().default(false),
	alwaysAllowModeSwitch: z.boolean().default(false),
	alwaysAllowSubtasks: z.boolean().default(false),
	alwaysAllowExecute: z.boolean().default(false),
	alwaysAllowFollowupQuestions: z.boolean().default(false),
	followupAutoApproveTimeoutMs: z.number().default(60_000),
	allowedCommands: z.array(z.string()).default([]),
	deniedCommands: z.array(z.string()).default([]),
	commandExecutionTimeout: z.number().optional(),
	commandTimeoutAllowlist: z.array(z.string()).optional(),
	preventCompletionWithOpenTodos: z.boolean().optional(),
	allowedMaxRequests: z.number().nullable().default(null),
	allowedMaxCost: z.number().nullable().default(null),
	autoCondenseContext: z.boolean().default(true),
	autoCondenseContextPercent: z.number().min(0).max(100).default(90),

	/**
	 * Whether to include current time in the environment details
	 * @default true
	 */
	includeCurrentTime: z.boolean().default(true),
	/**
	 * Whether to include current cost in the environment details
	 * @default true
	 */
	includeCurrentCost: z.boolean().default(false),
	/**
	 * Maximum number of git status file entries to include in the environment details.
	 * Set to 0 to disable git status. The header (branch, commits) is always included when > 0.
	 * @default 0
	 */
	maxGitStatusFiles: z.number().default(0),

	/**
	 * Whether to include diagnostic messages (errors, warnings) in tool outputs
	 * @default true
	 */
	includeDiagnosticMessages: z.boolean().default(true),
	/**
	 * Maximum number of diagnostic messages to include in tool outputs
	 * @default 50
	 */
	maxDiagnosticMessages: z.number().default(50),

	enableCheckpoints: z.boolean().default(true),
	checkpointTimeout: z
		.number()
		.int()
		.min(MIN_CHECKPOINT_TIMEOUT_SECONDS)
		.max(MAX_CHECKPOINT_TIMEOUT_SECONDS)
		.default(DEFAULT_CHECKPOINT_TIMEOUT_SECONDS),

	ttsEnabled: z.boolean().default(false),
	ttsSpeed: z.number().default(1.0),
	soundEnabled: z.boolean().default(false),
	soundVolume: z.number().default(0.5),

	maxOpenTabsContext: z.number().default(20),
	maxWorkspaceFiles: z.number().default(200),
	showRooIgnoredFiles: z.boolean().default(false),
	enableSubfolderRules: z.boolean().default(false),
	maxImageFileSize: z.number().default(5),
	maxTotalImageSize: z.number().default(20),

	terminalOutputPreviewSize: z.enum(["small", "medium", "large"]).default("medium"),
	terminalShellIntegrationTimeout: z.number().default(5_000),
	terminalShellIntegrationDisabled: z.boolean().default(true),
	terminalCommandDelay: z.number().default(0),
	terminalPowershellCounter: z.boolean().default(false),
	terminalZshClearEolMark: z.boolean().default(true),
	terminalZshOhMy: z.boolean().default(false),
	terminalZshP10k: z.boolean().default(false),
	terminalZdotdir: z.boolean().default(false),
	execaShellPath: z.string().optional(),

	diagnosticsEnabled: z.boolean().default(true),

	rateLimitSeconds: z.number().optional(),
	experiments: experimentsSchema.default({
		customTools: false,
		imageGeneration: false,
		preventFocusDisruption: false,
		runSlashCommand: false,
	}),

	codebaseIndexModels: codebaseIndexModelsSchema.optional(),
	codebaseIndexConfig: codebaseIndexConfigSchema.optional(),

	language: languagesSchema,

	mcpEnabled: z.boolean().default(true),

	mode: z.string().default("ask"),
	modeApiConfigs: z.record(z.string(), z.string()).optional(), // TODO sort this out! where it should be?
	customModes: z.array(modeConfigSchema).optional(),
	customModePrompts: customModePromptsSchema.default({}),
	customSupportPrompts: customSupportPromptsSchema.default({}),
	enhancementApiConfigId: z.string().default(""),
	includeTaskHistoryInEnhance: z.boolean().default(true),
	historyPreviewCollapsed: z.boolean().default(false),
	reasoningBlockCollapsed: z.boolean().default(true),
	/**
	 * Controls the keyboard behavior for sending messages in the chat input.
	 * - "send": Enter sends message, Shift+Enter creates newline (default)
	 * - "newline": Enter creates newline, Shift+Enter/Ctrl+Enter sends message
	 * @default "send"
	 */
	enterBehavior: z.enum(["send", "newline"]).default("send"),
	profileThresholds: z.record(z.string(), z.number()).default({}),
	hasOpenedModeSelector: z.boolean().optional(),
	lastModeExportPath: z.string().optional(),
	lastModeImportPath: z.string().optional(),
	lastSettingsExportPath: z.string().optional(),
	lastTaskExportPath: z.string().optional(),
	lastImageSavePath: z.string().optional(),

	/**
	 * Path to worktree to auto-open after switching workspaces.
	 * Used by the worktree feature to open the Roo Code sidebar in a new window.
	 */
	worktreeAutoOpenPath: z.string().optional(),
	/**
	 * Whether to show the worktree selector in the home screen.
	 * @default true
	 */
	showWorktreesInHomeScreen: z.boolean().optional(),

	/**
	 * List of native tool names to globally disable.
	 * Tools in this list will be excluded from prompt generation and rejected at execution time.
	 */
	disabledTools: z.array(toolNamesSchema).default([]),
})

export type GlobalSettings = z.infer<typeof globalSettingsSchema>

export const GLOBAL_SETTINGS_KEYS = globalSettingsSchema.keyof().options

/**
 * RooCodeSettings
 */

export const rooCodeSettingsSchema = providerSettingsSchema.merge(globalSettingsSchema)

export type RooCodeSettings = GlobalSettings & ProviderSettings

/**
 * SecretState
 */
export const SECRET_STATE_KEYS = [
	"apiKey",
	"openRouterApiKey",
	"awsAccessKey",
	"awsApiKey",
	"awsSecretKey",
	"awsSessionToken",
	"openAiApiKey",
	"ollamaApiKey",
	"geminiApiKey",
	"openAiNativeApiKey",
	"deepSeekApiKey",
	"moonshotApiKey",
	"mistralApiKey",
	"minimaxApiKey",
	"requestyApiKey",
	"xaiApiKey",
	"litellmApiKey",
	"codeIndexOpenAiKey",
	"codeIndexQdrantApiKey",
	"codebaseIndexOpenAiCompatibleApiKey",
	"codebaseIndexGeminiApiKey",
	"codebaseIndexMistralApiKey",
	"codebaseIndexVercelAiGatewayApiKey",
	"codebaseIndexOpenRouterApiKey",
	"sambaNovaApiKey",
	"zaiApiKey",
	"fireworksApiKey",
	"vercelAiGatewayApiKey",
	"basetenApiKey",
] as const

// Global secrets that are part of GlobalSettings (not ProviderSettings)
export const GLOBAL_SECRET_KEYS = [
	"openRouterImageApiKey", // For image generation
] as const

// Type for the actual secret storage keys
type ProviderSecretKey = (typeof SECRET_STATE_KEYS)[number]
type GlobalSecretKey = (typeof GLOBAL_SECRET_KEYS)[number]

// Type representing all secrets that can be stored
export type SecretState = Pick<ProviderSettings, Extract<ProviderSecretKey, keyof ProviderSettings>> & {
	[K in GlobalSecretKey]?: string
}

export const isSecretStateKey = (key: string): key is Keys<SecretState> =>
	SECRET_STATE_KEYS.includes(key as ProviderSecretKey) || GLOBAL_SECRET_KEYS.includes(key as GlobalSecretKey)

/**
 * GlobalState
 */

export type GlobalState = Omit<RooCodeSettings, Keys<SecretState>>

export const GLOBAL_STATE_KEYS = [...GLOBAL_SETTINGS_KEYS, ...PROVIDER_SETTINGS_KEYS].filter(
	(key: Keys<RooCodeSettings>) => !isSecretStateKey(key),
) as Keys<GlobalState>[]

export const isGlobalStateKey = (key: string): key is Keys<GlobalState> =>
	GLOBAL_STATE_KEYS.includes(key as Keys<GlobalState>)
