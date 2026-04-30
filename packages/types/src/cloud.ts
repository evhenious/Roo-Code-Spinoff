import { z } from "zod"

import { RooCodeEventName } from "./events.js"
import { TaskStatus, taskMetadataSchema } from "./task.js"
import { clineMessageSchema, queuedMessageSchema, tokenUsageSchema } from "./message.js"
import { staticAppPropertiesSchema, gitPropertiesSchema } from "./telemetry.js"

// TODO remove all related to orgs

/**
 * JWTPayload
 */

export interface JWTPayload {
	iss?: string // Issuer (should be 'rcc')
	sub?: string // Subject - CloudJob ID for job tokens (t:'cj'), User ID for auth tokens (t:'auth')
	exp?: number // Expiration time
	iat?: number // Issued at time
	nbf?: number // Not before time
	v?: number // Version (should be 1)
	r?: {
		u?: string // User ID (always present in valid tokens)
		o?: string // Organization ID (optional - undefined when orgId is null)
		t?: string // Token type: 'cj' for job tokens, 'auth' for auth tokens
	}
}

/**
 * ConnectionState
 */

export enum ConnectionState {
	DISCONNECTED = "disconnected",
	CONNECTING = "connecting",
	CONNECTED = "connected",
	RETRYING = "retrying",
	FAILED = "failed",
}

/**
 * RetryConfig
 */

export interface RetryConfig {
	maxInitialAttempts: number
	initialDelay: number
	maxDelay: number
	backoffMultiplier: number
}

/**
 * Constants
 */

export const HEARTBEAT_INTERVAL_MS = 20_000
export const INSTANCE_TTL_SECONDS = 60

/**
 * ExtensionTask
 */

const extensionTaskSchema = z.object({
	taskId: z.string(),
	taskStatus: z.nativeEnum(TaskStatus),
	taskAsk: clineMessageSchema.optional(),
	queuedMessages: z.array(queuedMessageSchema).optional(),
	parentTaskId: z.string().optional(),
	childTaskId: z.string().optional(),
	tokenUsage: tokenUsageSchema.optional(),
	...taskMetadataSchema.shape,
})

export type ExtensionTask = z.infer<typeof extensionTaskSchema>

/**
 * ExtensionInstance
 */

export const extensionInstanceSchema = z.object({
	instanceId: z.string(),
	userId: z.string(),
	workspacePath: z.string(),
	appProperties: staticAppPropertiesSchema,
	gitProperties: gitPropertiesSchema.optional(),
	lastHeartbeat: z.coerce.number(),
	task: extensionTaskSchema,
	taskAsk: clineMessageSchema.optional(),
	taskHistory: z.array(z.string()),
	mode: z.string().optional(),
	modes: z.array(z.object({ slug: z.string(), name: z.string() })).optional(),
	providerProfile: z.string().optional(),
	providerProfiles: z.array(z.object({ name: z.string(), provider: z.string().optional() })).optional(),
	isCloudAgent: z.boolean().optional(),
})

export type ExtensionInstance = z.infer<typeof extensionInstanceSchema>

/**
 * TaskBridgeEvent
 */

export enum TaskBridgeEventName {
	Message = RooCodeEventName.Message,
	TaskModeSwitched = RooCodeEventName.TaskModeSwitched,
	TaskInteractive = RooCodeEventName.TaskInteractive,
}

export const taskBridgeEventSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(TaskBridgeEventName.Message),
		taskId: z.string(),
		action: z.string(),
		message: clineMessageSchema,
	}),
	z.object({
		type: z.literal(TaskBridgeEventName.TaskModeSwitched),
		taskId: z.string(),
		mode: z.string(),
	}),
	z.object({
		type: z.literal(TaskBridgeEventName.TaskInteractive),
		taskId: z.string(),
	}),
])

export type TaskBridgeEvent = z.infer<typeof taskBridgeEventSchema>

/**
 * TaskBridgeCommand
 */

export enum TaskBridgeCommandName {
	Message = "message",
	ApproveAsk = "approve_ask",
	DenyAsk = "deny_ask",
}

export const taskBridgeCommandSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(TaskBridgeCommandName.Message),
		taskId: z.string(),
		payload: z.object({
			text: z.string(),
			images: z.array(z.string()).optional(),
			mode: z.string().optional(),
			providerProfile: z.string().optional(),
		}),
		timestamp: z.number(),
	}),
	z.object({
		type: z.literal(TaskBridgeCommandName.ApproveAsk),
		taskId: z.string(),
		payload: z.object({
			text: z.string().optional(),
			images: z.array(z.string()).optional(),
		}),
		timestamp: z.number(),
	}),
	z.object({
		type: z.literal(TaskBridgeCommandName.DenyAsk),
		taskId: z.string(),
		payload: z.object({
			text: z.string().optional(),
			images: z.array(z.string()).optional(),
		}),
		timestamp: z.number(),
	}),
])

export type TaskBridgeCommand = z.infer<typeof taskBridgeCommandSchema>

/**
 * ExtensionSocketEvents
 */

export enum ExtensionSocketEvents {
	CONNECTED = "extension:connected",

	REGISTER = "extension:register",
	UNREGISTER = "extension:unregister",

	HEARTBEAT = "extension:heartbeat",

	EVENT = "extension:event", // event from extension instance
	RELAYED_EVENT = "extension:relayed_event", // relay from server

	COMMAND = "extension:command", // command from user
	RELAYED_COMMAND = "extension:relayed_command", // relay from server
}

/**
 * TaskSocketEvents
 */

export enum TaskSocketEvents {
	JOIN = "task:join",
	LEAVE = "task:leave",

	EVENT = "task:event", // event from extension task
	RELAYED_EVENT = "task:relayed_event", // relay from server

	COMMAND = "task:command", // command from user
	RELAYED_COMMAND = "task:relayed_command", // relay from server
}

/**
 * `emit()` Response Types
 */

export type JoinResponse = {
	success: boolean
	error?: string
	taskId?: string
	timestamp?: string
}

export type LeaveResponse = {
	success: boolean
	taskId?: string
	timestamp?: string
}

/**
 * UsageStats
 */

export const usageStatsSchema = z.object({
	success: z.boolean(),
	data: z.object({
		dates: z.array(z.string()), // Array of date strings
		tasks: z.array(z.number()), // Array of task counts
		tokens: z.array(z.number()), // Array of token counts
		costs: z.array(z.number()), // Array of costs in USD
		totals: z.object({
			tasks: z.number(),
			tokens: z.number(),
			cost: z.number(), // Total cost in USD
		}),
	}),
	period: z.number(), // Period in days (e.g., 30)
})

export type UsageStats = z.infer<typeof usageStatsSchema>
