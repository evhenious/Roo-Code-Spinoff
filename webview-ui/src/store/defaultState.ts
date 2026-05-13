import {
	type ExtensionState,
	type SkillMetadata,
	type Command,
	RouterModels,
	globalSettingsSchema,
} from "@roo-code/types"

/**
 * IWebviewState contains fields that are only relevant in the webview UI.
 * These fields are NOT persisted and should NOT be sent to the extension host.
 * Examples: UI state, command list, current checkpoint, tab state.
 */
export interface IWebviewState {
	commands: Command[]
	currentCheckpoint?: string
	didHydrateState: boolean
	filePaths: string[]
	openedTabs: Array<{ label: string; isActive: boolean; path?: string }>
	routerModels?: RouterModels
	skills?: SkillMetadata[]
	theme?: Record<string, string>
}

/**
 * IExtensionStoreData represents the complete Zustand store data for the webview.
 * It is composed of ExtensionState (all settings + runtime state) + IWebviewState (webview-only fields).
 */
export interface IExtensionStoreData extends ExtensionState, IWebviewState {}

const defaults = globalSettingsSchema.parse({})

export const defaultEmptyExtensionState: ExtensionState = {
	...defaults,
	//
	version: "",
	cwd: "",
	apiConfiguration: {},
	clineMessages: [],
	taskHistory: [],
	renderContext: "sidebar",
	maxReadFileLine: -1, // Default max line limit for read_file tool (-1 for default) // TODO sort this out - why runtime?
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
}
