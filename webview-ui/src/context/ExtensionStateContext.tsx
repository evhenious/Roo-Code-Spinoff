import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import {
	type ProviderSettings,
	type ProviderSettingsEntry,
	type ExtensionMessage,
	type ExtensionState,
	type MarketplaceInstalledMetadata,
	type SkillMetadata,
	type Command,
	type McpServer,
	RouterModels,
} from "@roo-code/types"

import { checkExistKey } from "@roo/checkExistApiConfig"
import { Mode } from "@roo/modes"

import { vscode } from "@src/utils/vscode"
import { convertTextMateToHljs } from "@src/utils/textMateToHljs"
import { defaultEmptyExtensionState, ExtensionStateContextType } from "./stateContextDef"

export const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

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
	// Multiple async event sources (cloud auth, settings, task streaming) can trigger
	// concurrent state pushes. If a stale push arrives after a newer one, its clineMessages
	// would overwrite the newer messages. The sequence number prevents this by only applying
	// clineMessages when the incoming seq is strictly greater than the last applied seq.
	if (
		newState.clineMessagesSeq !== undefined &&
		prevState.clineMessagesSeq !== undefined &&
		newState.clineMessagesSeq <= prevState.clineMessagesSeq &&
		newState.clineMessages !== undefined
	) {
		rest.clineMessages = prevState.clineMessages
		rest.clineMessagesSeq = prevState.clineMessagesSeq
	}

	// Note that we completely replace the previous apiConfiguration and customSupportPrompts objects
	// with new ones since the state that is broadcast is the entire objects so merging is not necessary.
	return {
		...rest,
		apiConfiguration: apiConfiguration ?? prevState.apiConfiguration,
		customModePrompts,
		customSupportPrompts: customSupportPrompts ?? prevState.customSupportPrompts,
		experiments,
	}
}

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [state, setState] = useState<ExtensionState>(defaultEmptyExtensionState)

	const [didHydrateState, setDidHydrateState] = useState(false)
	const [showWelcome, setShowWelcome] = useState(false)
	const [theme, setTheme] = useState<any>(undefined)
	const [filePaths, setFilePaths] = useState<string[]>([])
	const [openedTabs, setOpenedTabs] = useState<Array<{ label: string; isActive: boolean; path?: string }>>([])
	const [commands, setCommands] = useState<Command[]>([])
	const [mcpServers, setMcpServers] = useState<McpServer[]>([])
	const [currentCheckpoint, setCurrentCheckpoint] = useState<string>()
	const [extensionRouterModels, setExtensionRouterModels] = useState<RouterModels | undefined>(undefined)
	const [marketplaceItems, setMarketplaceItems] = useState<any[]>([])
	const [alwaysAllowFollowupQuestions, setAlwaysAllowFollowupQuestions] = useState(false) // Add state for follow-up questions auto-approve
	const [followupAutoApproveTimeoutMs, setFollowupAutoApproveTimeoutMs] = useState<number | undefined>(undefined) // Will be set from global settings
	const [marketplaceInstalledMetadata, setMarketplaceInstalledMetadata] = useState<MarketplaceInstalledMetadata>({
		project: {},
		global: {},
	})
	const [skills, setSkills] = useState<SkillMetadata[]>([])
	const [includeTaskHistoryInEnhance, setIncludeTaskHistoryInEnhance] = useState(true)
	const [prevCloudIsAuthenticated, setPrevCloudIsAuthenticated] = useState(false)
	const [includeCurrentTime, setIncludeCurrentTime] = useState(true)
	const [includeCurrentCost, setIncludeCurrentCost] = useState(true)

	const setListApiConfigMeta = useCallback(
		(value: ProviderSettingsEntry[]) => setState((prevState) => ({ ...prevState, listApiConfigMeta: value })),
		[],
	)

	const setApiConfiguration = useCallback((value: ProviderSettings) => {
		setState((prevState) => ({
			...prevState,
			apiConfiguration: {
				...prevState.apiConfiguration,
				...value,
			},
		}))
	}, [])

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			switch (message.type) {
				case "state": {
					const newState = message.state ?? {}
					setState((prevState) => mergeExtensionState(prevState, newState))
					setShowWelcome(!checkExistKey(newState.apiConfiguration))
					setDidHydrateState(true)
					// Update alwaysAllowFollowupQuestions if present in state message
					if ((newState as any).alwaysAllowFollowupQuestions !== undefined) {
						setAlwaysAllowFollowupQuestions((newState as any).alwaysAllowFollowupQuestions)
					}
					// Update followupAutoApproveTimeoutMs if present in state message
					if ((newState as any).followupAutoApproveTimeoutMs !== undefined) {
						setFollowupAutoApproveTimeoutMs((newState as any).followupAutoApproveTimeoutMs)
					}
					// Update includeTaskHistoryInEnhance if present in state message
					if ((newState as any).includeTaskHistoryInEnhance !== undefined) {
						setIncludeTaskHistoryInEnhance((newState as any).includeTaskHistoryInEnhance)
					}
					// Update includeCurrentTime if present in state message
					if ((newState as any).includeCurrentTime !== undefined) {
						setIncludeCurrentTime((newState as any).includeCurrentTime)
					}
					// Update includeCurrentCost if present in state message
					if ((newState as any).includeCurrentCost !== undefined) {
						setIncludeCurrentCost((newState as any).includeCurrentCost)
					}
					// Handle marketplace data if present in state message
					if (newState.marketplaceItems !== undefined) {
						setMarketplaceItems(newState.marketplaceItems)
					}
					if (newState.marketplaceInstalledMetadata !== undefined) {
						setMarketplaceInstalledMetadata(newState.marketplaceInstalledMetadata)
					}
					break
				}
				case "action": {
					if (message.action === "toggleAutoApprove") {
						// Toggle the auto-approval state
						setState((prevState) => {
							const newValue = !(prevState.autoApprovalEnabled ?? false)
							// Also send the update to the extension
							vscode.postMessage({ type: "autoApprovalEnabled", bool: newValue })
							return { ...prevState, autoApprovalEnabled: newValue }
						})
					}
					break
				}
				case "theme": {
					if (message.text) {
						setTheme(convertTextMateToHljs(JSON.parse(message.text)))
					}
					break
				}
				case "workspaceUpdated": {
					const paths = message.filePaths ?? []
					const tabs = message.openedTabs ?? []

					setFilePaths(paths)
					setOpenedTabs(tabs)
					break
				}
				case "commands": {
					setCommands(message.commands ?? [])
					break
				}
				case "messageUpdated": {
					const clineMessage = message.clineMessage!
					setState((prevState) => {
						// worth noting it will never be possible for a more up-to-date message to be sent here or in normal messages post since the presentAssistantContent function uses lock
						const lastIndex = prevState.clineMessages.findLastIndex((msg) => msg.ts === clineMessage.ts)
						if (lastIndex !== -1) {
							const newClineMessages = [...prevState.clineMessages]
							newClineMessages[lastIndex] = clineMessage
							return { ...prevState, clineMessages: newClineMessages }
						}
						// Log a warning if messageUpdated arrives for a timestamp not in the
						// frontend's clineMessages. With the seq guard and cloud event isolation
						// (layers 1+2), this should not happen under normal conditions. If it
						// does, it signals a state synchronization issue worth investigating.
						console.warn(
							`[messageUpdated] Received update for unknown message ts=${clineMessage.ts}, dropping. ` +
								`Frontend has ${prevState.clineMessages.length} messages.`,
						)
						return prevState
					})
					break
				}
				case "skills": {
					if (message.skills) {
						setSkills(message.skills)
					}
					break
				}
				case "mcpServers": {
					setMcpServers(message.mcpServers ?? [])
					break
				}
				case "currentCheckpointUpdated": {
					setCurrentCheckpoint(message.text)
					break
				}
				case "listApiConfig": {
					setListApiConfigMeta(message.listApiConfig ?? [])
					break
				}
				case "routerModels": {
					setExtensionRouterModels(message.routerModels)
					break
				}
				case "marketplaceData": {
					if (message.marketplaceItems !== undefined) {
						setMarketplaceItems(message.marketplaceItems)
					}
					if (message.marketplaceInstalledMetadata !== undefined) {
						setMarketplaceInstalledMetadata(message.marketplaceInstalledMetadata)
					}
					break
				}
				case "taskHistoryUpdated": {
					// Efficiently update just the task history without replacing entire state
					if (message.taskHistory !== undefined) {
						setState((prevState) => ({
							...prevState,
							taskHistory: message.taskHistory!,
						}))
					}
					break
				}
				case "taskHistoryItemUpdated": {
					const item = message.taskHistoryItem
					if (!item) {
						break
					}
					setState((prevState) => {
						const existingIndex = prevState.taskHistory.findIndex((h) => h.id === item.id)
						let nextHistory: typeof prevState.taskHistory
						if (existingIndex === -1) {
							nextHistory = [item, ...prevState.taskHistory]
						} else {
							nextHistory = [...prevState.taskHistory]
							nextHistory[existingIndex] = item
						}
						// Keep UI semantics consistent with extension: newest-first ordering.
						nextHistory.sort((a, b) => b.ts - a.ts)
						return {
							...prevState,
							taskHistory: nextHistory,
							currentTaskItem:
								prevState.currentTaskItem?.id === item.id ? item : prevState.currentTaskItem,
						}
					})
					break
				}
			}
		},
		[setListApiConfigMeta],
	)

	useEffect(() => {
		window.addEventListener("message", handleMessage)
		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [handleMessage])

	useEffect(() => {
		vscode.postMessage({ type: "webviewDidLaunch" })
	}, [])

	// Watch for authentication state changes and refresh Roo models
	useEffect(() => {
		const currentAuth = state.cloudIsAuthenticated ?? false
		const currentProvider = state.apiConfiguration?.apiProvider
		if (!prevCloudIsAuthenticated && currentAuth && currentProvider === "roo") {
			// User just authenticated and Roo is the active provider - refresh Roo models
			vscode.postMessage({ type: "requestRooModels" })
		}
		setPrevCloudIsAuthenticated(currentAuth)
	}, [state.cloudIsAuthenticated, prevCloudIsAuthenticated, state.apiConfiguration?.apiProvider])

	const contextValue: ExtensionStateContextType = {
		...state,
		reasoningBlockCollapsed: state.reasoningBlockCollapsed ?? true,
		didHydrateState,
		showWelcome,
		theme,
		mcpServers,
		currentCheckpoint,
		filePaths,
		openedTabs,
		commands,
		soundVolume: state.soundVolume,
		ttsSpeed: state.ttsSpeed,
		writeDelayMs: state.writeDelayMs,
		routerModels: extensionRouterModels,
		cloudIsAuthenticated: state.cloudIsAuthenticated ?? false,
		cloudOrganizations: state.cloudOrganizations ?? [],
		organizationSettingsVersion: state.organizationSettingsVersion ?? -1,
		marketplaceItems,
		marketplaceInstalledMetadata,
		profileThresholds: state.profileThresholds ?? {},
		alwaysAllowFollowupQuestions,
		followupAutoApproveTimeoutMs,
		taskSyncEnabled: state.taskSyncEnabled,
		setExperimentEnabled: (id, enabled) =>
			setState((prevState) => ({ ...prevState, experiments: { ...prevState.experiments, [id]: enabled } })),
		setApiConfiguration,
		setCustomInstructions: (value) => setState((prevState) => ({ ...prevState, customInstructions: value })),
		setAlwaysAllowReadOnly: (value) => setState((prevState) => ({ ...prevState, alwaysAllowReadOnly: value })),
		setAlwaysAllowReadOnlyOutsideWorkspace: (value) =>
			setState((prevState) => ({ ...prevState, alwaysAllowReadOnlyOutsideWorkspace: value })),
		setAlwaysAllowWrite: (value) => setState((prevState) => ({ ...prevState, alwaysAllowWrite: value })),
		setAlwaysAllowWriteOutsideWorkspace: (value) =>
			setState((prevState) => ({ ...prevState, alwaysAllowWriteOutsideWorkspace: value })),
		setAlwaysAllowExecute: (value) => setState((prevState) => ({ ...prevState, alwaysAllowExecute: value })),
		setAlwaysAllowMcp: (value) => setState((prevState) => ({ ...prevState, alwaysAllowMcp: value })),
		setAlwaysAllowModeSwitch: (value) => setState((prevState) => ({ ...prevState, alwaysAllowModeSwitch: value })),
		setAlwaysAllowSubtasks: (value) => setState((prevState) => ({ ...prevState, alwaysAllowSubtasks: value })),
		setAlwaysAllowFollowupQuestions,
		setFollowupAutoApproveTimeoutMs: (value) =>
			setState((prevState) => ({ ...prevState, followupAutoApproveTimeoutMs: value })),
		setAllowedCommands: (value) => setState((prevState) => ({ ...prevState, allowedCommands: value })),
		setDeniedCommands: (value) => setState((prevState) => ({ ...prevState, deniedCommands: value })),
		setAllowedMaxRequests: (value) => setState((prevState) => ({ ...prevState, allowedMaxRequests: value })),
		setAllowedMaxCost: (value) => setState((prevState) => ({ ...prevState, allowedMaxCost: value })),
		setSoundEnabled: (value) => setState((prevState) => ({ ...prevState, soundEnabled: value })),
		setSoundVolume: (value) => setState((prevState) => ({ ...prevState, soundVolume: value })),
		setTtsEnabled: (value) => setState((prevState) => ({ ...prevState, ttsEnabled: value })),
		setTtsSpeed: (value) => setState((prevState) => ({ ...prevState, ttsSpeed: value })),
		setEnableCheckpoints: (value) => setState((prevState) => ({ ...prevState, enableCheckpoints: value })),
		setCheckpointTimeout: (value) => setState((prevState) => ({ ...prevState, checkpointTimeout: value })),
		setWriteDelayMs: (value) => setState((prevState) => ({ ...prevState, writeDelayMs: value })),
		setTerminalOutputPreviewSize: (value) =>
			setState((prevState) => ({ ...prevState, terminalOutputPreviewSize: value })),
		setTerminalShellIntegrationTimeout: (value) =>
			setState((prevState) => ({ ...prevState, terminalShellIntegrationTimeout: value })),
		setTerminalShellIntegrationDisabled: (value) =>
			setState((prevState) => ({ ...prevState, terminalShellIntegrationDisabled: value })),
		setTerminalZdotdir: (value) => setState((prevState) => ({ ...prevState, terminalZdotdir: value })),
		setMcpEnabled: (value) => setState((prevState) => ({ ...prevState, mcpEnabled: value })),
		setTaskSyncEnabled: (value) => setState((prevState) => ({ ...prevState, taskSyncEnabled: value }) as any),
		setCurrentApiConfigName: (value) => setState((prevState) => ({ ...prevState, currentApiConfigName: value })),
		setListApiConfigMeta,
		setMode: (value: Mode) => setState((prevState) => ({ ...prevState, mode: value })),
		setCustomModePrompts: (value) => setState((prevState) => ({ ...prevState, customModePrompts: value })),
		setCustomSupportPrompts: (value) => setState((prevState) => ({ ...prevState, customSupportPrompts: value })),
		setEnhancementApiConfigId: (value) =>
			setState((prevState) => ({ ...prevState, enhancementApiConfigId: value })),
		setAutoApprovalEnabled: (value) => setState((prevState) => ({ ...prevState, autoApprovalEnabled: value })),
		setCustomModes: (value) => setState((prevState) => ({ ...prevState, customModes: value })),
		setMaxOpenTabsContext: (value) => setState((prevState) => ({ ...prevState, maxOpenTabsContext: value })),
		setMaxWorkspaceFiles: (value) => setState((prevState) => ({ ...prevState, maxWorkspaceFiles: value })),
		setShowRooIgnoredFiles: (value) => setState((prevState) => ({ ...prevState, showRooIgnoredFiles: value })),
		setEnableSubfolderRules: (value) => setState((prevState) => ({ ...prevState, enableSubfolderRules: value })),
		setAwsUsePromptCache: (value) => setState((prevState) => ({ ...prevState, awsUsePromptCache: value })),
		setMaxImageFileSize: (value) => setState((prevState) => ({ ...prevState, maxImageFileSize: value })),
		setMaxTotalImageSize: (value) => setState((prevState) => ({ ...prevState, maxTotalImageSize: value })),
		setPinnedApiConfigs: (value) => setState((prevState) => ({ ...prevState, pinnedApiConfigs: value })),
		togglePinnedApiConfig: (configId) =>
			setState((prevState) => {
				const currentPinned = prevState.pinnedApiConfigs || {}
				const newPinned = {
					...currentPinned,
					[configId]: !currentPinned[configId],
				}

				// If the config is now unpinned, remove it from the object
				if (!newPinned[configId]) {
					delete newPinned[configId]
				}

				return { ...prevState, pinnedApiConfigs: newPinned }
			}),
		setHistoryPreviewCollapsed: (value) =>
			setState((prevState) => ({ ...prevState, historyPreviewCollapsed: value })),
		setReasoningBlockCollapsed: (value) =>
			setState((prevState) => ({ ...prevState, reasoningBlockCollapsed: value })),
		enterBehavior: state.enterBehavior ?? "send",
		setEnterBehavior: (value) => setState((prevState) => ({ ...prevState, enterBehavior: value })),
		setHasOpenedModeSelector: (value) => setState((prevState) => ({ ...prevState, hasOpenedModeSelector: value })),
		setAutoCondenseContext: (value) => setState((prevState) => ({ ...prevState, autoCondenseContext: value })),
		setAutoCondenseContextPercent: (value) =>
			setState((prevState) => ({ ...prevState, autoCondenseContextPercent: value })),
		setProfileThresholds: (value) => setState((prevState) => ({ ...prevState, profileThresholds: value })),
		includeDiagnosticMessages: state.includeDiagnosticMessages,
		setIncludeDiagnosticMessages: (value) => {
			setState((prevState) => ({ ...prevState, includeDiagnosticMessages: value }))
		},
		maxDiagnosticMessages: state.maxDiagnosticMessages,
		setMaxDiagnosticMessages: (value) => {
			setState((prevState) => ({ ...prevState, maxDiagnosticMessages: value }))
		},
		includeTaskHistoryInEnhance,
		setIncludeTaskHistoryInEnhance,
		includeCurrentTime,
		setIncludeCurrentTime,
		includeCurrentCost,
		setIncludeCurrentCost,
		skills,
		showWorktreesInHomeScreen: state.showWorktreesInHomeScreen ?? true,
		setShowWorktreesInHomeScreen: (value) =>
			setState((prevState) => ({ ...prevState, showWorktreesInHomeScreen: value })),
	}

	return <ExtensionStateContext.Provider value={contextValue}>{children}</ExtensionStateContext.Provider>
}

export const useExtensionState = () => {
	const context = useContext(ExtensionStateContext)

	if (context === undefined) {
		throw new Error("useExtensionState must be used within an ExtensionStateContextProvider")
	}

	return context
}
