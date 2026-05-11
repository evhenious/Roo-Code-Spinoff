import { presentAssistantMessage } from "../../assistant-message"
import { TaskWorkflowDependencies } from "../interface"
import { Task } from "../Task"

import { Anthropic } from "@anthropic-ai/sdk"

import { type ClineApiReqCancelReason, type ModelInfo } from "@roo-code/types"
import type { AssistantMessageContent } from "../../assistant-message"

export function createWorkflowDependencies(task: Task): TaskWorkflowDependencies {
	return {
		// ─── Task identity ───────────────────────────────────────────────────────────
		taskId: task.taskId,
		instanceId: task.instanceId,

		// ─── Abort / lifecycle flags ────────────────────────────────────────────────
		get abort() {
			return task.abort
		},
		set abort(value: boolean) {
			task.abort = value
		},
		get abandoned() {
			return task.abandoned
		},
		set abandoned(value: boolean) {
			task.abandoned = value
		},
		get isStreaming() {
			return task.isStreaming
		},
		setIsStreaming(value: boolean) {
			task.isStreaming = value
		},
		get abortReason() {
			return task.abortReason
		},
		setAbortReason(reason: ClineApiReqCancelReason | undefined) {
			task.abortReason = reason
		},

		// ─── Mistake tracking ───────────────────────────────────────────────────────
		get consecutiveMistakeLimit() {
			return task.consecutiveMistakeLimit
		},
		get consecutiveMistakeCount() {
			return task.consecutiveMistakeCount
		},
		setConsecutiveMistakeCount(value: number) {
			task.consecutiveMistakeCount = value
		},
		get consecutiveNoAssistantMessagesCount() {
			return task.consecutiveNoAssistantMessagesCount
		},
		setConsecutiveNoAssistantMessagesCount(value: number) {
			task.consecutiveNoAssistantMessagesCount = value
		},
		get consecutiveNoToolUseCount() {
			return task.consecutiveNoToolUseCount
		},
		setConsecutiveNoToolUseCount(value: number) {
			task.consecutiveNoToolUseCount = value
		},

		// ─── Configuration ──────────────────────────────────────────────────────────
		get apiConfiguration() {
			return task.apiConfiguration
		},
		get cwd() {
			return task.cwd
		},

		// ─── Message arrays (read/write) ────────────────────────────────────────────
		get clineMessages() {
			return task.clineMessages
		},
		get apiConversationHistory() {
			return task.apiConversationHistory
		},
		get assistantMessageContent() {
			return task.assistantMessageContent
		},
		setAssistantMessageContent(value: AssistantMessageContent[]) {
			task.assistantMessageContent = value
		},
		get userMessageContent() {
			return task.userMessageContent
		},
		setUserMessageContent(
			content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam)[],
		) {
			task.userMessageContent = content
		},

		// ─── Streaming state ────────────────────────────────────────────────────────
		get currentStreamingContentIndex() {
			return task.currentStreamingContentIndex
		},
		setCurrentStreamingContentIndex(value: number) {
			task.currentStreamingContentIndex = value
		},
		get currentStreamingDidCheckpoint() {
			return task.currentStreamingDidCheckpoint
		},
		setCurrentStreamingDidCheckpoint(value: boolean) {
			task.currentStreamingDidCheckpoint = value
		},
		get didCompleteReadingStream() {
			return task.didCompleteReadingStream
		},
		setDidCompleteReadingStream(value: boolean) {
			task.didCompleteReadingStream = value
		},
		get userMessageContentReady() {
			return task.userMessageContentReady
		},
		setUserMessageContentReady(value: boolean) {
			task.userMessageContentReady = value
		},
		get didRejectTool() {
			return task.didRejectTool
		},
		setDidRejectTool(value: boolean) {
			task.didRejectTool = value
		},
		get didAlreadyUseTool() {
			return task.didAlreadyUseTool
		},
		setDidAlreadyUseTool(value: boolean) {
			task.didAlreadyUseTool = value
		},
		get assistantMessageSavedToHistory() {
			return task.assistantMessageSavedToHistory
		},
		setAssistantMessageSavedToHistory(value: boolean) {
			task.assistantMessageSavedToHistory = value
		},
		get didToolFailInCurrentTurn() {
			return task.didToolFailInCurrentTurn
		},
		setDidToolFailInCurrentTurn(value: boolean) {
			task.didToolFailInCurrentTurn = value
		},
		get presentAssistantMessageLocked() {
			return task.presentAssistantMessageLocked
		},
		setPresentAssistantMessageLocked(value: boolean) {
			task.presentAssistantMessageLocked = value
		},
		get presentAssistantMessageHasPendingUpdates() {
			return task.presentAssistantMessageHasPendingUpdates
		},
		setPresentAssistantMessageHasPendingUpdates(value: boolean) {
			task.presentAssistantMessageHasPendingUpdates = value
		},
		get streamingToolCallIndices() {
			return task.streamingToolCallIndices
		},
		get cachedStreamingModel() {
			return task.cachedStreamingModel
		},
		setCachedStreamingModel(model: { id: string; info: ModelInfo } | undefined) {
			task.cachedStreamingModel = model
		},

		// ─── Request state ──────────────────────────────────────────────────────────
		get currentRequestAbortController() {
			return task.currentRequestAbortController
		},
		setCurrentRequestAbortController(controller: AbortController | undefined) {
			task.currentRequestAbortController = controller
		},
		get isWaitingForFirstChunk() {
			return task.isWaitingForFirstChunk
		},
		setIsWaitingForFirstChunk(value: boolean) {
			task.isWaitingForFirstChunk = value
		},
		get skipPrevResponseIdOnce() {
			return task.skipPrevResponseIdOnce
		},
		setSkipPrevResponseIdOnce(value: boolean) {
			task.skipPrevResponseIdOnce = value
		},

		// ─── Paused state ───────────────────────────────────────────────────────────
		get isPaused() {
			return task.isPaused
		},

		// ─── Abort completion flag ──────────────────────────────────────────────────
		get didFinishAbortingStream() {
			return task.didFinishAbortingStream
		},

		// ─── Methods ────────────────────────────────────────────────────────────────
		ask: task.ask.bind(task),
		say: task.say.bind(task),
		saveClineMessages: task.saveClineMessages.bind(task),
		updateClineMessage: task.updateClineMessage.bind(task),
		addToApiConversationHistory: task.addToApiConversationHistory.bind(task),
		pushToolResultToUserContent: task.pushToolResultToUserContent.bind(task),
		recordToolUsage: task.recordToolUsage.bind(task),
		recordToolError: task.recordToolError.bind(task),

		// ─── Provider access ────────────────────────────────────────────────────────
		getProvider: async () => {
			const provider = task.providerRef.deref()
			if (!provider) {
				throw new Error(
					`[Task#${task.taskId}] Provider reference lost during getProvider - the WeakRef was garbage collected`,
				)
			}
			return provider
		},
		postStateToWebviewWithoutTaskHistory: async () => {
			const provider = task.providerRef.deref()
			if (!provider) {
				console.error(
					`[Task#${task.taskId}] Provider reference lost during postStateToWebviewWithoutTaskHistory`,
				)
				return
			}
			await provider.postStateToWebviewWithoutTaskHistory()
		},
		getState: async () => {
			const provider = task.providerRef.deref()
			if (!provider) {
				console.error(`[Task#${task.taskId}] Provider reference lost during getState`)
				return {}
			}
			return (await provider.getState()) ?? {}
		},

		// ─── Diff view ──────────────────────────────────────────────────────────────
		get diffViewProviderIsEditing() {
			return task.diffViewProvider.isEditing
		},
		diffViewProviderRevertChanges: () => task.diffViewProvider.revertChanges(),
		diffViewProviderReset: () => task.diffViewProvider.reset(),

		// ─── External services (wrapped) ────────────────────────────────────────────
		attemptApiRequest: task.attemptApiRequest.bind(task),
		backoffAndAnnounce: task.backoffAndAnnounce.bind(task),
		abortTask: task.abortTask.bind(task),

		// ─── presentAssistantMessage ────────────────────────────────────────────────
		presentAssistantMessage: () => presentAssistantMessage(task),

		// ─── Context tracking ───────────────────────────────────────────────────────
		get fileContextTracker() {
			return task.fileContextTracker
		},
		get rooIgnoreController() {
			return task.rooIgnoreController
		},

		// ─── Static state ───────────────────────────────────────────────────────────
		get lastGlobalApiRequestTime() {
			return Task.lastGlobalApiRequestTime
		},
		setLastGlobalApiRequestTime(value: number | null) {
			Task.lastGlobalApiRequestTime = value
		},

		// ─── Environment details ────────────────────────────────────────────────────
		taskForEnvironmentDetails: task,
	}
}
