import {
	type ProviderSettings,
	type ProviderSettingsEntry,
	type CustomModePrompts,
	type ModeConfig,
	type ExperimentId,
	type TodoItem,
	type ExtensionState,
	type MarketplaceInstalledMetadata,
	type SkillMetadata,
	type Command,
	type McpServer,
	RouterModels,
	DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
} from "@roo-code/types"
import { experimentDefault } from "@roo/experiments"

import { defaultModeSlug, defaultPrompts, Mode } from "@roo/modes"
import { CustomSupportPrompts } from "@roo/support-prompt"

export interface IExtensionStore extends ExtensionState {
	historyPreviewCollapsed?: boolean // Add the new state property
	didHydrateState: boolean
	showWelcome: boolean
	theme: any
	mcpServers: McpServer[]
	currentCheckpoint?: string
	currentTaskTodos?: TodoItem[] // Initial todos for the current task
	filePaths: string[]
	openedTabs: Array<{ label: string; isActive: boolean; path?: string }>
	commands: Command[]
	hasOpenedModeSelector: boolean // New property to track if user has opened mode selector
	setHasOpenedModeSelector: (value: boolean) => void // Setter for the new property
	alwaysAllowFollowupQuestions: boolean // New property for follow-up questions auto-approve
	setAlwaysAllowFollowupQuestions: (value: boolean) => void // Setter for the new property
	followupAutoApproveTimeoutMs: number | undefined // Timeout in ms for auto-approving follow-up questions
	setFollowupAutoApproveTimeoutMs: (value: number) => void // Setter for the timeout
	marketplaceItems?: any[]
	marketplaceInstalledMetadata?: MarketplaceInstalledMetadata
	profileThresholds: Record<string, number>
	setProfileThresholds: (value: Record<string, number>) => void
	setApiConfiguration: (config: ProviderSettings) => void
	setCustomInstructions: (value?: string) => void
	setAlwaysAllowReadOnly: (value: boolean) => void
	setAlwaysAllowReadOnlyOutsideWorkspace: (value: boolean) => void
	setAlwaysAllowWrite: (value: boolean) => void
	setAlwaysAllowWriteOutsideWorkspace: (value: boolean) => void
	setAlwaysAllowExecute: (value: boolean) => void
	setAlwaysAllowMcp: (value: boolean) => void
	setAlwaysAllowModeSwitch: (value: boolean) => void
	setAlwaysAllowSubtasks: (value: boolean) => void
	setShowRooIgnoredFiles: (value: boolean) => void
	setEnableSubfolderRules: (value: boolean) => void
	setAllowedCommands: (value: string[]) => void
	setDeniedCommands: (value: string[]) => void
	setAllowedMaxRequests: (value: number | undefined) => void
	setAllowedMaxCost: (value: number | undefined) => void
	setSoundEnabled: (value: boolean) => void
	setSoundVolume: (value: number) => void
	terminalShellIntegrationTimeout?: number
	setTerminalShellIntegrationTimeout: (value: number) => void
	terminalShellIntegrationDisabled?: boolean
	setTerminalShellIntegrationDisabled: (value: boolean) => void
	terminalZdotdir?: boolean
	setTerminalZdotdir: (value: boolean) => void
	setTtsEnabled: (value: boolean) => void
	setTtsSpeed: (value: number) => void
	setEnableCheckpoints: (value: boolean) => void
	checkpointTimeout: number
	setCheckpointTimeout: (value: number) => void
	setWriteDelayMs: (value: number) => void
	terminalOutputPreviewSize?: "small" | "medium" | "large"
	setTerminalOutputPreviewSize: (value: "small" | "medium" | "large") => void
	mcpEnabled: boolean
	setMcpEnabled: (value: boolean) => void
	setCurrentApiConfigName: (value: string) => void
	setListApiConfigMeta: (value: ProviderSettingsEntry[]) => void
	mode: Mode
	setMode: (value: Mode) => void
	setCustomModePrompts: (value: CustomModePrompts) => void
	setCustomSupportPrompts: (value: CustomSupportPrompts) => void
	enhancementApiConfigId?: string
	setEnhancementApiConfigId: (value: string) => void
	setExperimentEnabled: (id: ExperimentId, enabled: boolean) => void
	setAutoApprovalEnabled: (value: boolean) => void
	customModes: ModeConfig[]
	setCustomModes: (value: ModeConfig[]) => void
	setMaxOpenTabsContext: (value: number) => void
	maxWorkspaceFiles: number
	setMaxWorkspaceFiles: (value: number) => void
	awsUsePromptCache?: boolean
	setAwsUsePromptCache: (value: boolean) => void
	maxImageFileSize: number
	setMaxImageFileSize: (value: number) => void
	maxTotalImageSize: number
	setMaxTotalImageSize: (value: number) => void
	pinnedApiConfigs?: Record<string, boolean>
	setPinnedApiConfigs: (value: Record<string, boolean>) => void
	togglePinnedApiConfig: (configName: string) => void
	setHistoryPreviewCollapsed: (value: boolean) => void
	setReasoningBlockCollapsed: (value: boolean) => void
	enterBehavior?: "send" | "newline"
	setEnterBehavior: (value: "send" | "newline") => void
	autoCondenseContext: boolean
	setAutoCondenseContext: (value: boolean) => void
	autoCondenseContextPercent: number
	setAutoCondenseContextPercent: (value: number) => void
	routerModels?: RouterModels
	includeDiagnosticMessages?: boolean
	setIncludeDiagnosticMessages: (value: boolean) => void
	maxDiagnosticMessages?: number
	setMaxDiagnosticMessages: (value: number) => void
	includeTaskHistoryInEnhance?: boolean
	setIncludeTaskHistoryInEnhance: (value: boolean) => void
	includeCurrentTime?: boolean
	setIncludeCurrentTime: (value: boolean) => void
	includeCurrentCost?: boolean
	setIncludeCurrentCost: (value: boolean) => void
	showWorktreesInHomeScreen: boolean
	setShowWorktreesInHomeScreen: (value: boolean) => void
	skills?: SkillMetadata[]
}

export const defaultEmptyExtensionState: ExtensionState = {
	apiConfiguration: {},
	version: "",
	clineMessages: [],
	taskHistory: [],
	allowedCommands: [],
	deniedCommands: [],
	soundEnabled: false,
	soundVolume: 0.5,
	ttsEnabled: false,
	ttsSpeed: 1.0,
	enableCheckpoints: true,
	checkpointTimeout: DEFAULT_CHECKPOINT_TIMEOUT_SECONDS, // Default to 15 seconds
	language: "en", // Default language code
	writeDelayMs: 1000,
	terminalShellIntegrationTimeout: 4000,
	mcpEnabled: true,
	currentApiConfigName: "default",
	listApiConfigMeta: [],
	mode: defaultModeSlug,
	customModePrompts: defaultPrompts,
	customSupportPrompts: {},
	experiments: experimentDefault,
	enhancementApiConfigId: "",
	hasOpenedModeSelector: false, // Default to false (not opened yet)
	autoApprovalEnabled: false,
	customModes: [],
	maxOpenTabsContext: 20,
	maxWorkspaceFiles: 200,
	cwd: "",
	showRooIgnoredFiles: true, // Default to showing .rooignore'd files with lock symbol (current behavior).
	enableSubfolderRules: false, // Default to disabled - must be enabled to load rules from subdirectories
	renderContext: "sidebar",
	maxReadFileLine: -1, // Default max line limit for read_file tool (-1 for default)
	maxImageFileSize: 5, // Default max image file size in MB
	maxTotalImageSize: 20, // Default max total image size in MB
	pinnedApiConfigs: {}, // Empty object for pinned API configs
	terminalZshOhMy: false, // Default Oh My Zsh integration setting
	terminalZshP10k: false, // Default Powerlevel10k integration setting
	terminalZdotdir: false, // Default ZDOTDIR handling setting
	historyPreviewCollapsed: false, // Initialize the new state (default to expanded)
	reasoningBlockCollapsed: true, // Default to collapsed
	enterBehavior: "send", // Default: Enter sends, Shift+Enter creates newline
	autoCondenseContext: true,
	autoCondenseContextPercent: 100,
	profileThresholds: {},
	codebaseIndexConfig: {
		codebaseIndexEnabled: true,
		codebaseIndexQdrantUrl: "http://localhost:6333",
		codebaseIndexEmbedderProvider: "openai",
		codebaseIndexEmbedderBaseUrl: "",
		codebaseIndexEmbedderModelId: "",
		codebaseIndexSearchMaxResults: undefined,
		codebaseIndexSearchMinScore: undefined,
	},
	codebaseIndexModels: { ollama: {}, openai: {} },
	includeDiagnosticMessages: true,
	maxDiagnosticMessages: 50,
	openRouterImageApiKey: "",
	openRouterImageGenerationSelectedModel: "",
	includeCurrentTime: true,
	includeCurrentCost: true,
	lockApiConfigAcrossModes: false,
}
