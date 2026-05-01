import {
	type ExtensionState,
	type SkillMetadata,
	type Command,
	RouterModels,
	DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
} from "@roo-code/types"
import { experimentDefault } from "@roo/experiments"

import { defaultModeSlug, defaultPrompts } from "@roo/modes"

export interface IExtensionStoreData extends ExtensionState {
	commands: Command[]
	currentCheckpoint?: string
	didHydrateState: boolean
	filePaths: string[]
	openedTabs: Array<{ label: string; isActive: boolean; path?: string }>
	routerModels?: RouterModels
	showWelcome: boolean
	skills?: SkillMetadata[]
	theme?: Record<string, string>
}

export const defaultEmptyExtensionState: ExtensionState = {
	mcpServers: [],
	showWorktreesInHomeScreen: true,
	includeTaskHistoryInEnhance: true,
	alwaysAllowFollowupQuestions: false,
	version: "",
	apiConfiguration: {},
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
