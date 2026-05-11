import Anthropic from "@anthropic-ai/sdk"
import {
	ClineApiReqCancelReason,
	ClineAsk,
	ClineMessage,
	ClineSay,
	ModelInfo,
	ProviderSettings,
	ToolName,
} from "@roo-code/types"
import { ApiStream } from "../../api/transform/stream"
import { ApiMessage } from "../task-persistence"
import { AssistantMessageContent } from "../assistant-message"
import { Task } from "./Task"

/**
 * ─── Task Identity ───────────────────────────────────────────────────────────
 */
export interface TaskWorkflowIdentity {
	taskId: string
	instanceId: string
}

/**
 * ─── Abort / Lifecycle ──────────────────────────────────────────────────────
 */
export interface TaskWorkflowLifecycle {
	get abort(): boolean
	set abort(value: boolean)
	get abandoned(): boolean
	set abandoned(value: boolean)
	isStreaming: boolean
	setIsStreaming(value: boolean): void
	abortReason?: ClineApiReqCancelReason
	setAbortReason(reason: ClineApiReqCancelReason | undefined): void
	didFinishAbortingStream: boolean
}

/**
 * ─── Mistake Tracking ───────────────────────────────────────────────────────
 */
export interface TaskWorkflowMistakeTracking {
	consecutiveMistakeLimit: number
	consecutiveMistakeCount: number
	setConsecutiveMistakeCount(value: number): void
	consecutiveNoAssistantMessagesCount: number
	setConsecutiveNoAssistantMessagesCount(value: number): void
	consecutiveNoToolUseCount: number
	setConsecutiveNoToolUseCount(value: number): void
}

/**
 * ─── Configuration ──────────────────────────────────────────────────────────
 */
export interface TaskWorkflowConfiguration {
	apiConfiguration: ProviderSettings
	cwd: string
}

/**
 * ─── Message Arrays ─────────────────────────────────────────────────────────
 */
export interface TaskWorkflowMessages {
	clineMessages: ClineMessage[]
	apiConversationHistory: ApiMessage[]
	assistantMessageContent: AssistantMessageContent[]
	setAssistantMessageContent(value: AssistantMessageContent[]): void
	userMessageContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam)[]
	setUserMessageContent(
		content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam)[],
	): void
}

/**
 * ─── Streaming State ────────────────────────────────────────────────────────
 */
export interface TaskWorkflowStreamingState {
	currentStreamingContentIndex: number
	setCurrentStreamingContentIndex(value: number): void
	currentStreamingDidCheckpoint: boolean
	setCurrentStreamingDidCheckpoint(value: boolean): void
	didCompleteReadingStream: boolean
	setDidCompleteReadingStream(value: boolean): void
	userMessageContentReady: boolean
	setUserMessageContentReady(value: boolean): void
	didRejectTool: boolean
	setDidRejectTool(value: boolean): void
	didAlreadyUseTool: boolean
	setDidAlreadyUseTool(value: boolean): void
	assistantMessageSavedToHistory: boolean
	setAssistantMessageSavedToHistory(value: boolean): void
	didToolFailInCurrentTurn: boolean
	setDidToolFailInCurrentTurn(value: boolean): void
	presentAssistantMessageLocked: boolean
	setPresentAssistantMessageLocked(value: boolean): void
	presentAssistantMessageHasPendingUpdates: boolean
	setPresentAssistantMessageHasPendingUpdates(value: boolean): void
	streamingToolCallIndices: Map<string, number>
	cachedStreamingModel: { id: string; info: ModelInfo } | undefined
	setCachedStreamingModel(model: { id: string; info: ModelInfo } | undefined): void
}

/**
 * ─── Request State ──────────────────────────────────────────────────────────
 */
export interface TaskWorkflowRequestState {
	currentRequestAbortController: AbortController | undefined
	setCurrentRequestAbortController(controller: AbortController | undefined): void
	isWaitingForFirstChunk: boolean
	setIsWaitingForFirstChunk(value: boolean): void
	skipPrevResponseIdOnce: boolean
	setSkipPrevResponseIdOnce(value: boolean): void
}

/**
 * ─── Paused State ───────────────────────────────────────────────────────────
 */
export interface TaskWorkflowPausedState {
	isPaused: boolean
}

/**
 * ─── Methods ────────────────────────────────────────────────────────────────
 */
export interface TaskWorkflowMethods {
	ask(
		type: ClineAsk,
		text?: string,
		partial?: boolean,
		progressStatus?: any,
		isProtected?: boolean,
	): Promise<{
		response: string
		text?: string
		images?: string[]
	}>
	say(
		type: ClineSay,
		text?: string,
		images?: string[],
		partial?: boolean,
		checkpoint?: any,
		progressStatus?: any,
		options?: any,
		contextData?: any,
	): Promise<undefined>
	saveClineMessages(): Promise<boolean>
	updateClineMessage(message: ClineMessage): Promise<void>
	addToApiConversationHistory(message: Anthropic.MessageParam, reasoning?: string): Promise<void>
	pushToolResultToUserContent(toolResult: Anthropic.ToolResultBlockParam): boolean
	recordToolUsage(toolName: ToolName): void
	recordToolError(toolName: ToolName, error?: string): void
}

/**
 * ─── Provider Access ────────────────────────────────────────────────────────
 */
export interface TaskWorkflowProviderAccess {
	getProvider(): Promise<import("../webview/ClineProvider").ClineProvider>
	postStateToWebviewWithoutTaskHistory(): Promise<void>
	getState(): Promise<Record<string, any>>
}

/**
 * ─── Diff View ──────────────────────────────────────────────────────────────
 */
export interface TaskWorkflowDiffView {
	diffViewProviderIsEditing: boolean
	diffViewProviderRevertChanges(): Promise<void>
	diffViewProviderReset(): Promise<void>
}

/**
 * ─── External Services ──────────────────────────────────────────────────────
 */
export interface TaskWorkflowExternalServices {
	attemptApiRequest(retryAttempt: number, options?: { skipProviderRateLimit?: boolean }): ApiStream
	backoffAndAnnounce(retryAttempt: number, error: any): Promise<void>
	abortTask(): Promise<void>
}

/**
 * ─── Present Assistant Message ──────────────────────────────────────────────
 */
export interface TaskWorkflowPresentAssistantMessage {
	presentAssistantMessage(): Promise<void>
}

/**
 * ─── Context Tracking ───────────────────────────────────────────────────────
 */
export interface TaskWorkflowContextTracking {
	fileContextTracker: any
	rooIgnoreController: any
}

/**
 * ─── Static State ───────────────────────────────────────────────────────────
 */
export interface TaskWorkflowStaticState {
	lastGlobalApiRequestTime: number | null
	setLastGlobalApiRequestTime(value: number | null): void
}

/**
 * ─── Environment Details ────────────────────────────────────────────────────
 */
export interface TaskWorkflowEnvironmentDetails {
	taskForEnvironmentDetails: Task
}

/**
 * Dependencies required by TaskWorkflow to execute the agentic loop and streaming logic.
 *
 * Composed from focused sub-interfaces following the Interface Segregation Principle.
 *
 * NOTE: `presentAssistantMessage` currently takes a full Task instance as its parameter.
 * This should be revisited in a future phase to use a narrowed interface, reducing the
 * coupling between TaskWorkflow and the Task class.
 */
export interface TaskWorkflowDependencies
	extends TaskWorkflowIdentity,
		TaskWorkflowLifecycle,
		TaskWorkflowMistakeTracking,
		TaskWorkflowConfiguration,
		TaskWorkflowMessages,
		TaskWorkflowStreamingState,
		TaskWorkflowRequestState,
		TaskWorkflowPausedState,
		TaskWorkflowMethods,
		TaskWorkflowProviderAccess,
		TaskWorkflowDiffView,
		TaskWorkflowExternalServices,
		TaskWorkflowPresentAssistantMessage,
		TaskWorkflowContextTracking,
		TaskWorkflowStaticState,
		TaskWorkflowEnvironmentDetails {}
