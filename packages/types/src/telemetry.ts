import { z } from "zod"

import { providerNames } from "./provider-settings.js"

export const staticAppPropertiesSchema = z.object({
	appName: z.string(),
	appVersion: z.string(),
	vscodeVersion: z.string(),
	platform: z.string(),
	editorName: z.string(),
	hostname: z.string().optional(),
})

export type StaticAppProperties = z.infer<typeof staticAppPropertiesSchema>

export const dynamicAppPropertiesSchema = z.object({
	language: z.string(),
	mode: z.string(),
})

export type DynamicAppProperties = z.infer<typeof dynamicAppPropertiesSchema>

export const appPropertiesSchema = z.object({
	...staticAppPropertiesSchema.shape,
	...dynamicAppPropertiesSchema.shape,
})

export type AppProperties = z.infer<typeof appPropertiesSchema>

export const taskPropertiesSchema = z.object({
	taskId: z.string().optional(),
	parentTaskId: z.string().optional(),
	apiProvider: z.enum(providerNames).optional(),
	modelId: z.string().optional(),
	diffStrategy: z.string().optional(),
	isSubtask: z.boolean().optional(),
	todos: z
		.object({
			total: z.number(),
			completed: z.number(),
			inProgress: z.number(),
			pending: z.number(),
		})
		.optional(),
})

export type TaskProperties = z.infer<typeof taskPropertiesSchema>

export const gitPropertiesSchema = z.object({
	repositoryUrl: z.string().optional(),
	repositoryName: z.string().optional(),
	defaultBranch: z.string().optional(),
})

export type GitProperties = z.infer<typeof gitPropertiesSchema>

export const telemetryPropertiesSchema = z.object({
	...appPropertiesSchema.shape,
	...taskPropertiesSchema.shape,
	...gitPropertiesSchema.shape,
})

export type TelemetryProperties = z.infer<typeof telemetryPropertiesSchema>

/**
 * Expected API error codes that should not be reported to telemetry.
 * These are normal/expected errors that users can't do much about.
 */
export const EXPECTED_API_ERROR_CODES = new Set([
	402, // Payment required - billing issues
	429, // Rate limit - expected when hitting API limits
])

/**
 * Interface representing the error structure from OpenAI SDK.
 * OpenAI SDK errors (APIError, AuthenticationError, RateLimitError, etc.)
 * have a numeric `status` property and may contain nested error metadata.
 *
 * @see https://github.com/openai/openai-node/blob/master/src/error.ts
 */
interface OpenAISdkError {
	/** HTTP status code of the error response */
	status: number
	/** Optional error code (may be numeric or string) */
	code?: number | string
	/** Primary error message */
	message: string
	/** Nested error object containing additional details from the API response */
	error?: {
		message?: string
		metadata?: {
			/** Raw error message from upstream provider (e.g., OpenRouter upstream errors) */
			raw?: string
		}
	}
}

/**
 * Type guard to check if an error object is an OpenAI SDK error.
 * OpenAI SDK errors (APIError and subclasses) have: status, code, message properties.
 */
function isOpenAISdkError(error: unknown): error is OpenAISdkError {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		typeof (error as OpenAISdkError).status === "number"
	)
}

/**
 * Extracts the HTTP status code from an error object.
 * Supports OpenAI SDK errors that have a status property.
 * @param error - The error to extract status from
 * @returns The status code if available, undefined otherwise
 */
export function getErrorStatusCode(error: unknown): number | undefined {
	if (isOpenAISdkError(error)) {
		return error.status
	}
	return undefined
}

/**
 * Extracts a message from a JSON payload embedded in an error string.
 * Handles cases like "503 {"error":{"message":"actual error message"}}"
 * or just '{"error":{"message":"actual error message"}}'
 *
 * @param message - The message string that may contain JSON
 * @returns The extracted message from the JSON payload, or undefined if not found
 */
export function extractMessageFromJsonPayload(message: string): string | undefined {
	// Find the first occurrence of '{' which may indicate JSON content
	const jsonStartIndex = message.indexOf("{")
	if (jsonStartIndex === -1) {
		return undefined
	}

	const potentialJson = message.slice(jsonStartIndex)

	try {
		const parsed = JSON.parse(potentialJson)

		// Handle structure: {"error":{"message":"..."}} or {"error":{"code":"","message":"..."}}
		if (parsed?.error?.message && typeof parsed.error.message === "string") {
			return parsed.error.message
		}

		// Handle structure: {"message":"..."}
		if (parsed?.message && typeof parsed.message === "string") {
			return parsed.message
		}
	} catch {
		// JSON parsing failed - not valid JSON
	}

	return undefined
}

/**
 * Extracts the most descriptive error message from an error object.
 * Prioritizes nested metadata (upstream provider errors) over the standard message.
 * Also handles JSON payloads embedded in error messages.
 * @param error - The error to extract message from
 * @returns The best available error message, or undefined if not extractable
 */
export function getErrorMessage(error: unknown): string | undefined {
	let message: string | undefined

	if (isOpenAISdkError(error)) {
		// Prioritize nested metadata which may contain upstream provider details
		message = error.error?.metadata?.raw || error.error?.message || error.message
	} else if (error instanceof Error) {
		// Handle standard Error objects (including ApiProviderError)
		message = error.message
	} else if (typeof error === "object" && error !== null && "message" in error) {
		// Handle plain objects with a message property
		const msgValue = (error as { message: unknown }).message
		if (typeof msgValue === "string") {
			message = msgValue
		}
	}

	if (!message) {
		return undefined
	}

	// If the message contains JSON, try to extract the message from it
	const extractedMessage = extractMessageFromJsonPayload(message)
	if (extractedMessage) {
		return extractedMessage
	}

	return message
}

/**
 * Generic API provider error class for structured error tracking via PostHog.
 * Can be reused by any API provider.
 */
export class ApiProviderError extends Error {
	constructor(
		message: string,
		public readonly provider: string,
		public readonly modelId: string,
		public readonly operation: string,
		public readonly errorCode?: number,
	) {
		super(message)
		this.name = "ApiProviderError"
	}
}

/**
 * Type guard to check if an error is an ApiProviderError.
 * Used by telemetry to automatically extract structured properties.
 */
export function isApiProviderError(error: unknown): error is ApiProviderError {
	return (
		error instanceof Error &&
		error.name === "ApiProviderError" &&
		"provider" in error &&
		"modelId" in error &&
		"operation" in error
	)
}

/**
 * Extracts properties from an ApiProviderError for telemetry.
 * Returns the structured properties that can be merged with additionalProperties.
 */
export function extractApiProviderErrorProperties(error: ApiProviderError): Record<string, unknown> {
	return {
		provider: error.provider,
		modelId: error.modelId,
		operation: error.operation,
		...(error.errorCode !== undefined && { errorCode: error.errorCode }),
	}
}

/**
 * Reason why the consecutive mistake limit was reached.
 */
export type ConsecutiveMistakeReason = "no_tools_used" | "tool_repetition" | "unknown"

/**
 * Error class for "Roo is having trouble" consecutive mistake scenarios.
 * Triggered when the task reaches the configured consecutive mistake limit.
 * Used for structured exception tracking via PostHog.
 */
export class ConsecutiveMistakeError extends Error {
	constructor(
		message: string,
		public readonly taskId: string,
		public readonly consecutiveMistakeCount: number,
		public readonly consecutiveMistakeLimit: number,
		public readonly reason: ConsecutiveMistakeReason = "unknown",
		public readonly provider?: string,
		public readonly modelId?: string,
	) {
		super(message)
		this.name = "ConsecutiveMistakeError"
	}
}

/**
 * Type guard to check if an error is a ConsecutiveMistakeError.
 * Used by telemetry to automatically extract structured properties.
 */
export function isConsecutiveMistakeError(error: unknown): error is ConsecutiveMistakeError {
	return (
		error instanceof Error &&
		error.name === "ConsecutiveMistakeError" &&
		"taskId" in error &&
		"consecutiveMistakeCount" in error &&
		"consecutiveMistakeLimit" in error
	)
}

/**
 * Extracts properties from a ConsecutiveMistakeError for telemetry.
 * Returns the structured properties that can be merged with additionalProperties.
 */
export function extractConsecutiveMistakeErrorProperties(error: ConsecutiveMistakeError): Record<string, unknown> {
	return {
		taskId: error.taskId,
		consecutiveMistakeCount: error.consecutiveMistakeCount,
		consecutiveMistakeLimit: error.consecutiveMistakeLimit,
		reason: error.reason,
		...(error.provider !== undefined && { provider: error.provider }),
		...(error.modelId !== undefined && { modelId: error.modelId }),
	}
}
