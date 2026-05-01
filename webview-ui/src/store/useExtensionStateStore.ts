import { create } from "zustand"
import {
	type ProviderSettings,
	type ProviderSettingsEntry,
	type CustomModePrompts,
	type ModeConfig,
	type ExperimentId,
	type ExtensionState,
	type ExtensionMessage,
	DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
} from "@roo-code/types"

import { checkExistKey } from "@roo/checkExistApiConfig"
import { Mode, defaultModeSlug } from "@roo/modes"
import { CustomSupportPrompts } from "@roo/support-prompt"

import { defaultEmptyExtensionState, IExtensionStore } from "./defaultState"
import { vscode } from "@src/utils/vscode"
import { convertTextMateToHljs } from "@src/utils/textMateToHljs"

// Merge function for extension state updates
export const mergeExtensionState = (prevState: ExtensionState, newState: Partial<ExtensionState>) => {
	const { customModePrompts: prevCustomModePrompts, experiments: prevExperiments, ...prevRest } = prevState

	const {
		apiConfiguration,
		customModePrompts: newCustomModePrompts,
		customSupportPrompts,
		experiments: newExperiments,
		...newRest
	} = newState

	const customModePrompts = { ...prevCustomModePrompts, ...(newCustomModePrompts ?? {}) }
	const experiments = { ...prevExperiments, ...(newExperiments ?? {}) }
	const rest = { ...prevRest, ...newRest }

	// Protect clineMessages from stale state pushes using sequence numbering.
	if (
		newState.clineMessagesSeq !== undefined &&
		prevState.clineMessagesSeq !== undefined &&
		newState.clineMessagesSeq <= prevState.clineMessagesSeq &&
		newState.clineMessages !== undefined
	) {
		rest.clineMessages = prevState.clineMessages
		rest.clineMessagesSeq = prevState.clineMessagesSeq
	}

	return {
		...rest,
		apiConfiguration: apiConfiguration ?? prevState.apiConfiguration,
		customModePrompts,
		customSupportPrompts: customSupportPrompts ?? prevState.customSupportPrompts,
		experiments,
	}
}

// Store state interface
interface ExtensionStateStore extends IExtensionStore {
	// Message handling action
	handleMessage: (event: MessageEvent) => void

	// Initialization action
	initialize: () => void
}

// Helper to get default context value shape
const getDefaultState = (state: ExtensionState): Partial<ExtensionStateStore> => ({
	...state,
	reasoningBlockCollapsed: state.reasoningBlockCollapsed ?? true,
	didHydrateState: false,
	showWelcome: !checkExistKey(state.apiConfiguration),
	theme: undefined,
	mcpServers: [],
	filePaths: [],
	openedTabs: [],
	commands: [],
	//
	currentCheckpoint: undefined,
	currentTaskTodos: undefined,
	hasOpenedModeSelector: state.hasOpenedModeSelector ?? false,
	alwaysAllowFollowupQuestions: state.alwaysAllowFollowupQuestions ?? false,
	followupAutoApproveTimeoutMs: state.followupAutoApproveTimeoutMs ?? undefined,
	marketplaceItems: undefined,
	marketplaceInstalledMetadata: undefined,
	profileThresholds: state.profileThresholds ?? {},
	terminalShellIntegrationTimeout: state.terminalShellIntegrationTimeout,
	terminalShellIntegrationDisabled: state.terminalShellIntegrationDisabled,
	terminalZdotdir: state.terminalZdotdir,
	checkpointTimeout: state.checkpointTimeout ?? DEFAULT_CHECKPOINT_TIMEOUT_SECONDS,
	terminalOutputPreviewSize: state.terminalOutputPreviewSize,
	mcpEnabled: state.mcpEnabled ?? true,
	mode: state.mode ?? defaultModeSlug,
	enhancementApiConfigId: state.enhancementApiConfigId,
	customModes: state.customModes ?? [],
	maxWorkspaceFiles: state.maxWorkspaceFiles ?? 200,
	awsUsePromptCache: (state as any).awsUsePromptCache, // TODO get rid of ANY
	maxImageFileSize: state.maxImageFileSize ?? 5,
	maxTotalImageSize: state.maxTotalImageSize ?? 20,
	pinnedApiConfigs: state.pinnedApiConfigs,
	enterBehavior: state.enterBehavior ?? "send",
	autoCondenseContext: state.autoCondenseContext ?? true,
	autoCondenseContextPercent: state.autoCondenseContextPercent ?? 100,
	routerModels: undefined,
	includeDiagnosticMessages: state.includeDiagnosticMessages,
	maxDiagnosticMessages: state.maxDiagnosticMessages,
	includeTaskHistoryInEnhance: state.includeTaskHistoryInEnhance ?? true,
	includeCurrentTime: state.includeCurrentTime ?? true,
	includeCurrentCost: state.includeCurrentCost ?? true,
	showWorktreesInHomeScreen: state.showWorktreesInHomeScreen ?? true,
	skills: (state as any).skills, // TODO get rid of ANY
})

export const useExtensionStateStore = create<ExtensionStateStore>((set, get) => {
	const initialState = getDefaultState(defaultEmptyExtensionState)

	return {
		// Initial state
		...initialState,
		showWelcome: true,

		// Message handler
		handleMessage: (event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			const state = get()

			switch (message.type) {
				case "state": {
					const newState = message.state ?? {}
					const mergedState = mergeExtensionState(state, newState)

					set({
						...mergedState,
						showWelcome: !checkExistKey(newState.apiConfiguration),
						didHydrateState: true,
					})

					// Update specific properties that might come from state message
					if (newState.alwaysAllowFollowupQuestions !== undefined) {
						set({ alwaysAllowFollowupQuestions: newState.alwaysAllowFollowupQuestions })
					}
					if (newState.followupAutoApproveTimeoutMs !== undefined) {
						set({ followupAutoApproveTimeoutMs: newState.followupAutoApproveTimeoutMs })
					}
					if (newState.includeTaskHistoryInEnhance !== undefined) {
						set({ includeTaskHistoryInEnhance: newState.includeTaskHistoryInEnhance })
					}
					if (newState.includeCurrentTime !== undefined) {
						set({ includeCurrentTime: newState.includeCurrentTime })
					}
					if (newState.includeCurrentCost !== undefined) {
						set({ includeCurrentCost: newState.includeCurrentCost })
					}
					if (newState.marketplaceItems !== undefined) {
						set({ marketplaceItems: newState.marketplaceItems })
					}
					if (newState.marketplaceInstalledMetadata !== undefined) {
						set({ marketplaceInstalledMetadata: newState.marketplaceInstalledMetadata })
					}
					break
				}
				case "action": {
					if (message.action === "toggleAutoApprove") {
						const newValue = !(state.autoApprovalEnabled ?? false)
						vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue })
						set({ autoApprovalEnabled: newValue })
					}
					break
				}
				case "theme": {
					if (message.text) {
						set({ theme: convertTextMateToHljs(JSON.parse(message.text)) })
					}
					break
				}
				case "workspaceUpdated": {
					const paths = message.filePaths ?? []
					const tabs = message.openedTabs ?? []
					set({ filePaths: paths, openedTabs: tabs })
					break
				}
				case "commands": {
					set({ commands: message.commands ?? [] })
					break
				}
				case "messageUpdated": {
					const clineMessage = message.clineMessage!
					const prevState = get()
					const lastIndex = prevState.clineMessages.findLastIndex((msg) => msg.ts === clineMessage.ts)
					if (lastIndex !== -1) {
						const newClineMessages = [...prevState.clineMessages]
						newClineMessages[lastIndex] = clineMessage
						set({ clineMessages: newClineMessages })
					} else {
						console.warn(
							`[messageUpdated] Received update for unknown message ts=${clineMessage.ts}, dropping. ` +
								`Frontend has ${prevState.clineMessages.length} messages.`,
						)
					}
					break
				}
				case "skills": {
					if (message.skills) {
						set({ skills: message.skills })
					}
					break
				}
				case "mcpServers": {
					set({ mcpServers: message.mcpServers ?? [] })
					break
				}
				case "currentCheckpointUpdated": {
					set({ currentCheckpoint: message.text })
					break
				}
				case "listApiConfig": {
					set({ listApiConfigMeta: message.listApiConfig ?? [] })
					break
				}
				case "routerModels": {
					set({ routerModels: message.routerModels })
					break
				}
				case "marketplaceData": {
					if (message.marketplaceItems !== undefined) {
						set({ marketplaceItems: message.marketplaceItems })
					}
					if (message.marketplaceInstalledMetadata !== undefined) {
						set({ marketplaceInstalledMetadata: message.marketplaceInstalledMetadata })
					}
					break
				}
				case "taskHistoryUpdated": {
					if (message.taskHistory !== undefined) {
						set({ taskHistory: message.taskHistory! })
					}
					break
				}
				case "taskHistoryItemUpdated": {
					const item = message.taskHistoryItem
					if (!item) {
						break
					}
					const prevState = get()
					const existingIndex = prevState.taskHistory.findIndex((h) => h.id === item.id)
					let nextHistory: typeof prevState.taskHistory
					if (existingIndex === -1) {
						nextHistory = [item, ...prevState.taskHistory]
					} else {
						nextHistory = [...prevState.taskHistory]
						nextHistory[existingIndex] = item
					}
					nextHistory.sort((a, b) => b.ts - a.ts)
					set({
						taskHistory: nextHistory,
						currentTaskItem: prevState.currentTaskItem?.id === item.id ? item : prevState.currentTaskItem,
					})
					break
				}
			}
		},

		// Initialization
		initialize: () => {
			vscode.postMessage({ type: "webviewDidLaunch" })
		},

		// Setters
		setListApiConfigMeta: (value: ProviderSettingsEntry[]) => set({ listApiConfigMeta: value }),
		setApiConfiguration: (value: ProviderSettings) =>
			set((prevState) => ({
				...prevState,
				apiConfiguration: {
					...prevState.apiConfiguration,
					...value,
				},
			})),
		setExperimentEnabled: (id: ExperimentId, enabled: boolean) =>
			set((prevState) => ({ ...prevState, experiments: { ...prevState.experiments, [id]: enabled } })),
		setCustomInstructions: (value?: string) => set((prevState) => ({ ...prevState, customInstructions: value })),
		setAlwaysAllowReadOnly: (value: boolean) => set((prevState) => ({ ...prevState, alwaysAllowReadOnly: value })),
		setAlwaysAllowReadOnlyOutsideWorkspace: (value: boolean) =>
			set((prevState) => ({ ...prevState, alwaysAllowReadOnlyOutsideWorkspace: value })),
		setAlwaysAllowWrite: (value: boolean) => set((prevState) => ({ ...prevState, alwaysAllowWrite: value })),
		setAlwaysAllowWriteOutsideWorkspace: (value: boolean) =>
			set((prevState) => ({ ...prevState, alwaysAllowWriteOutsideWorkspace: value })),
		setAlwaysAllowExecute: (value: boolean) => set((prevState) => ({ ...prevState, alwaysAllowExecute: value })),
		setAlwaysAllowMcp: (value: boolean) => set((prevState) => ({ ...prevState, alwaysAllowMcp: value })),
		setAlwaysAllowModeSwitch: (value: boolean) =>
			set((prevState) => ({ ...prevState, alwaysAllowModeSwitch: value })),
		setAlwaysAllowSubtasks: (value: boolean) => set((prevState) => ({ ...prevState, alwaysAllowSubtasks: value })),
		setAlwaysAllowFollowupQuestions: (value: boolean) => set({ alwaysAllowFollowupQuestions: value }),
		setFollowupAutoApproveTimeoutMs: (value: number) => set({ followupAutoApproveTimeoutMs: value }),
		setAllowedCommands: (value: string[]) => set((prevState) => ({ ...prevState, allowedCommands: value })),
		setDeniedCommands: (value: string[]) => set((prevState) => ({ ...prevState, deniedCommands: value })),
		setAllowedMaxRequests: (value: number | undefined) =>
			set((prevState) => ({ ...prevState, allowedMaxRequests: value })),
		setAllowedMaxCost: (value: number | undefined) => set((prevState) => ({ ...prevState, allowedMaxCost: value })),
		setSoundEnabled: (value: boolean) => set((prevState) => ({ ...prevState, soundEnabled: value })),
		setSoundVolume: (value: number) => set((prevState) => ({ ...prevState, soundVolume: value })),
		setTtsEnabled: (value: boolean) => set((prevState) => ({ ...prevState, ttsEnabled: value })),
		setTtsSpeed: (value: number) => set((prevState) => ({ ...prevState, ttsSpeed: value })),
		setEnableCheckpoints: (value: boolean) => set((prevState) => ({ ...prevState, enableCheckpoints: value })),
		setCheckpointTimeout: (value: number) => set((prevState) => ({ ...prevState, checkpointTimeout: value })),
		setWriteDelayMs: (value: number) => set((prevState) => ({ ...prevState, writeDelayMs: value })),
		setTerminalOutputPreviewSize: (value: "small" | "medium" | "large") =>
			set((prevState) => ({ ...prevState, terminalOutputPreviewSize: value })),
		setTerminalShellIntegrationTimeout: (value: number) =>
			set((prevState) => ({ ...prevState, terminalShellIntegrationTimeout: value })),
		setTerminalShellIntegrationDisabled: (value: boolean) =>
			set((prevState) => ({ ...prevState, terminalShellIntegrationDisabled: value })),
		setTerminalZdotdir: (value: boolean) => set((prevState) => ({ ...prevState, terminalZdotdir: value })),
		setMcpEnabled: (value: boolean) => set((prevState) => ({ ...prevState, mcpEnabled: value })),
		setCurrentApiConfigName: (value: string) => set((prevState) => ({ ...prevState, currentApiConfigName: value })),
		setMode: (value: Mode) => set((prevState) => ({ ...prevState, mode: value })),
		setCustomModePrompts: (value: CustomModePrompts) =>
			set((prevState) => ({ ...prevState, customModePrompts: value })),
		setCustomSupportPrompts: (value: CustomSupportPrompts) =>
			set((prevState) => ({ ...prevState, customSupportPrompts: value })),
		setEnhancementApiConfigId: (value: string) =>
			set((prevState) => ({ ...prevState, enhancementApiConfigId: value })),
		setAutoApprovalEnabled: (value: boolean) => set((prevState) => ({ ...prevState, autoApprovalEnabled: value })),
		setCustomModes: (value: ModeConfig[]) => set((prevState) => ({ ...prevState, customModes: value })),
		setMaxOpenTabsContext: (value: number) => set((prevState) => ({ ...prevState, maxOpenTabsContext: value })),
		setMaxWorkspaceFiles: (value: number) => set((prevState) => ({ ...prevState, maxWorkspaceFiles: value })),
		setShowRooIgnoredFiles: (value: boolean) => set((prevState) => ({ ...prevState, showRooIgnoredFiles: value })),
		setEnableSubfolderRules: (value: boolean) =>
			set((prevState) => ({ ...prevState, enableSubfolderRules: value })),
		setAwsUsePromptCache: (value: boolean) => set((prevState) => ({ ...prevState, awsUsePromptCache: value })),
		setMaxImageFileSize: (value: number) => set((prevState) => ({ ...prevState, maxImageFileSize: value })),
		setMaxTotalImageSize: (value: number) => set((prevState) => ({ ...prevState, maxTotalImageSize: value })),
		setPinnedApiConfigs: (value: Record<string, boolean>) =>
			set((prevState) => ({ ...prevState, pinnedApiConfigs: value })),
		togglePinnedApiConfig: (configName: string) =>
			set((prevState) => {
				const currentPinned = prevState.pinnedApiConfigs || {}
				const newPinned = {
					...currentPinned,
					[configName]: !currentPinned[configName],
				}
				if (!newPinned[configName]) {
					delete newPinned[configName]
				}
				return { ...prevState, pinnedApiConfigs: newPinned }
			}),
		setHistoryPreviewCollapsed: (value: boolean) =>
			set((prevState) => ({ ...prevState, historyPreviewCollapsed: value })),
		setReasoningBlockCollapsed: (value: boolean) =>
			set((prevState) => ({ ...prevState, reasoningBlockCollapsed: value })),
		setEnterBehavior: (value: "send" | "newline") => set((prevState) => ({ ...prevState, enterBehavior: value })),
		setHasOpenedModeSelector: (value: boolean) =>
			set((prevState) => ({ ...prevState, hasOpenedModeSelector: value })),
		setAutoCondenseContext: (value: boolean) => set((prevState) => ({ ...prevState, autoCondenseContext: value })),
		setAutoCondenseContextPercent: (value: number) =>
			set((prevState) => ({ ...prevState, autoCondenseContextPercent: value })),
		setProfileThresholds: (value: Record<string, number>) =>
			set((prevState) => ({ ...prevState, profileThresholds: value })),
		setIncludeDiagnosticMessages: (value: boolean) =>
			set((prevState) => ({ ...prevState, includeDiagnosticMessages: value })),
		setMaxDiagnosticMessages: (value: number) =>
			set((prevState) => ({ ...prevState, maxDiagnosticMessages: value })),
		setIncludeTaskHistoryInEnhance: (value: boolean) => set({ includeTaskHistoryInEnhance: value }),
		setIncludeCurrentTime: (value: boolean) => set({ includeCurrentTime: value }),
		setIncludeCurrentCost: (value: boolean) => set({ includeCurrentCost: value }),
		setShowWorktreesInHomeScreen: (value: boolean) =>
			set((prevState) => ({ ...prevState, showWorktreesInHomeScreen: value })),
	} as ExtensionStateStore
})

// Export the hook that replaces useExtensionState
export const useExtensionState = () => {
	return useExtensionStateStore()
}
