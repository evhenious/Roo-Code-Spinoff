import { ClineAsk, ModeConfig, ToolName, ToolProgressStatus } from "@roo-code/types"
import type { Task } from "../../task/Task"

import { accessMcpResourceTool } from "../../tools/accessMcpResourceTool"
import { applyDiffTool as applyDiffToolClass } from "../../tools/ApplyDiffTool"
import { applyPatchTool } from "../../tools/ApplyPatchTool"
import { askFollowupQuestionTool } from "../../tools/AskFollowupQuestionTool"
import { astGrepTool } from "../../tools/AstGrepTool"
import { AttemptCompletionCallbacks, attemptCompletionTool } from "../../tools/AttemptCompletionTool"
import { codebaseSearchTool } from "../../tools/CodebaseSearchTool"
import { editFileTool } from "../../tools/EditFileTool"
import { editTool } from "../../tools/EditTool"
import { executeCommandTool } from "../../tools/ExecuteCommandTool"
import { generateImageTool } from "../../tools/GenerateImageTool"
import { listFilesTool } from "../../tools/ListFilesTool"
import { newTaskTool } from "../../tools/NewTaskTool"
import { readCommandOutputTool } from "../../tools/ReadCommandOutputTool"
import { readFileTool } from "../../tools/ReadFileTool"
import { runSlashCommandTool } from "../../tools/RunSlashCommandTool"
import { searchFilesTool } from "../../tools/SearchFilesTool"
import { searchReplaceTool } from "../../tools/SearchReplaceTool"
import { skillTool } from "../../tools/SkillTool"
import { switchModeTool } from "../../tools/SwitchModeTool"
import { updateTodoListTool } from "../../tools/UpdateTodoListTool"
import { useMcpToolTool } from "../../tools/UseMcpToolTool"
import { isValidToolName, validateToolUse } from "../../tools/validateToolUse"
import { writeToFileTool } from "../../tools/WriteToFileTool"
import { notifyTool } from "../../tools/NotifyTool"

import Anthropic from "@anthropic-ai/sdk"
import { customToolRegistry } from "@roo-code/core"
import { serializeError } from "serialize-error"
import { t } from "../../../i18n"
import { defaultModeSlug, getModeBySlug } from "../../../shared/modes"
import { ToolResponse } from "../../../shared/tools"
import { sanitizeToolUseId } from "../../../utils/tool-id"
import { formatResponse } from "../../prompts/responses"
import { AskIgnoredError } from "../../task/AskIgnoredError"
import { BaseTool, ToolCallbacks } from "../../tools/BaseTool"

type StandardTool = Exclude<ToolName, "custom_tool" | "attempt_completion" | "new_task">
type StdSpecialTool = Extract<ToolName, "attempt_completion" | "new_task">

type StdToolDefinition = {
  tool: BaseTool<any>
  needsCheckpoint?: boolean
}

type SpecialToolDefinition = {
  tool: BaseTool<any>
  needsCheckpoint?: boolean
  params?: Partial<ToolCallbacks & AttemptCompletionCallbacks>
}

const handleToolCallIdError = async (taskInstance: Task, block: any) => {
  const errorMessage =
    "Invalid tool call: missing tool_use.id. XML tool calls are no longer supported. Remove any XML tool markup (e.g. <read_file>...</read_file>) and use native tool calling instead."

  // Record a tool error for visibility. Use the reported tool name if present.
  try {
    if (typeof taskInstance.recordToolError === "function" && typeof block?.name === "string") {
      taskInstance.recordToolError(block.name as ToolName, errorMessage)
    }
  } catch {
    // Best-effort only
    // todo: improve shomehow
  }

  taskInstance.consecutiveMistakeCount++
  await taskInstance.renderUIMessage("error", errorMessage)
  taskInstance.userMessageContent.push({ type: "text", text: errorMessage })
  taskInstance.didAlreadyUseTool = true
}

const toolMap = {
  write_to_file: {
    tool: writeToFileTool,
    needsCheckpoint: true,
  },
  update_todo_list: {
    tool: updateTodoListTool,
  },
  apply_diff: {
    tool: applyDiffToolClass,
    needsCheckpoint: true,
  },
  edit: {
    tool: editTool,
    needsCheckpoint: true,
  },
  search_and_replace: {
    tool: editTool,
    needsCheckpoint: true,
  },
  search_replace: {
    tool: searchReplaceTool,
    needsCheckpoint: true,
  },
  edit_file: {
    tool: editFileTool,
    needsCheckpoint: true,
  },
  apply_patch: {
    tool: applyPatchTool,
    needsCheckpoint: true,
  },
  read_file: {
    tool: readFileTool,
  },
  list_files: {
    tool: listFilesTool,
  },
  codebase_search: {
    tool: codebaseSearchTool,
  },
  ast_grep: {
    tool: astGrepTool,
  },
  search_files: {
    tool: searchFilesTool,
  },
  notify: {
    tool: notifyTool,
  },
  execute_command: {
    tool: executeCommandTool,
  },
  read_command_output: {
    tool: readCommandOutputTool,
  },
  use_mcp_tool: {
    tool: useMcpToolTool,
  },
  access_mcp_resource: {
    tool: accessMcpResourceTool,
  },
  ask_followup_question: {
    tool: askFollowupQuestionTool,
  },
  switch_mode: {
    tool: switchModeTool,
  },
  run_slash_command: {
    tool: runSlashCommandTool,
  },
  skill: {
    tool: skillTool,
  },
  generate_image: {
    tool: generateImageTool,
    needsCheckpoint: true,
  },
} as const satisfies Partial<Record<StandardTool, StdToolDefinition>>

const toolDescription = (block: any, customModes: ModeConfig[] | undefined): string => {
  switch (block.name) {
    case "execute_command":
      return `[${block.name} for '${block.params.command}']`
    case "read_file":
      // Prefer native typed args when available; fall back to legacy params
      // Check if nativeArgs exists (native protocol)
      if (block.nativeArgs) {
        return readFileTool.getReadFileToolDescription(block.name, block.nativeArgs)
      }
      return readFileTool.getReadFileToolDescription(block.name, block.params)
    case "write_to_file":
      return `[${block.name} for '${block.params.path}']`
    case "apply_diff":
      // Native-only: tool args are structured (no XML payloads).
      return block.params?.path ? `[${block.name} for '${block.params.path}']` : `[${block.name}]`
    case "search_files":
      return `[${block.name} for '${block.params.regex}'${
        block.params.file_pattern ? ` in '${block.params.file_pattern}'` : ""
      }]`
    case "edit":
    case "search_and_replace":
      return `[${block.name} for '${block.params.file_path}']`
    case "search_replace":
      return `[${block.name} for '${block.params.file_path}']`
    case "edit_file":
      return `[${block.name} for '${block.params.file_path}']`
    case "apply_patch":
      return `[${block.name}]`
    case "list_files":
      return `[${block.name} for '${block.params.path}']`
    case "use_mcp_tool":
      return `[${block.name} for '${block.params.server_name}']`
    case "access_mcp_resource":
      return `[${block.name} for '${block.params.server_name}']`
    case "ask_followup_question":
      return `[${block.name} for '${block.params.question}']`
    case "attempt_completion":
    case "notify":
      return `[${block.name}]`
    case "switch_mode":
      return `[${block.name} to '${block.params.mode_slug}'${block.params.reason ? ` because: ${block.params.reason}` : ""}]`
    case "codebase_search":
      return `[${block.name} for '${block.params.query}']`
    case "ast_grep":
      return `[${block.name} for '${block.params.query}'${block.params.lang ? ` in '${block.params.lang}'` : ""}]`
    case "read_command_output":
      return `[${block.name} for '${block.params.artifact_id}']`
    case "update_todo_list":
      return `[${block.name}]`
    case "new_task": {
      const mode = block.params.mode ?? defaultModeSlug
      const message = block.params.message ?? "(no message)"
      const modeName = getModeBySlug(mode, customModes)?.name ?? mode
      return `[${block.name} in ${modeName} mode: '${message}']`
    }
    case "run_slash_command":
      return `[${block.name} for '${block.params.command}'${block.params.args ? ` with args: ${block.params.args}` : ""}]`
    case "skill":
      return `[${block.name} for '${block.params.skill}'${block.params.args ? ` with args: ${block.params.args}` : ""}]`
    case "generate_image":
      return `[${block.name} for '${block.params.path}']`
    default:
      return `[${block.name}]`
  }
}

export async function handleToolUse(taskInstance: Task, block: any) {
  // Native tool calling is the only supported tool calling mechanism.
  // A tool_use block without an id is invalid and cannot be executed.
  const toolCallId = block?.id as string | undefined
  if (!toolCallId) {
    return handleToolCallIdError(taskInstance, block)
  }

  // Fetch state early so it's available for toolDescription and validation
  const state = await taskInstance.providerRef.deref()?.getState()
  const { mode, customModes, experiments: stateExperiments, disabledTools } = state ?? {}

  if (taskInstance.didRejectTool) {
    // Ignore any tool content after user has rejected tool once.
    // For native tool calling, we must send a tool_result for every tool_use to avoid API errors
    const toolDescr = toolDescription(block, customModes)
    const errorMessage = !block.partial
      ? `Skipping tool ${toolDescr} due to user rejecting a previous tool.`
      : `Tool ${toolDescr} was interrupted and not executed due to user rejecting a previous tool.`

    taskInstance.pushToolResultToUserContent({
      type: "tool_result",
      tool_use_id: sanitizeToolUseId(toolCallId),
      content: errorMessage,
      is_error: true,
    })

    return
  }

  // Track if we've already pushed a tool result for this tool call (native tool calling only)
  let hasToolResult = false

  // If this is a native tool call but the parser couldn't construct nativeArgs
  // (e.g., malformed/unfinished JSON in a streaming tool call), we must NOT attempt to
  // execute the tool. Instead, emit exactly one structured tool_result so the provider
  // receives a matching tool_result for the tool_use_id.
  //
  // This avoids executing an invalid tool_use block and prevents duplicate/fragmented
  // error reporting.
  if (!block.partial) {
    const customTool = stateExperiments?.customTools ? customToolRegistry.get(block.name) : undefined
    const isKnownTool = isValidToolName(String(block.name), stateExperiments)
    if (isKnownTool && !block.nativeArgs && !customTool) {
      const errorMessage =
        `Invalid tool call for '${block.name}': missing nativeArgs. ` +
        `This usually means the model streamed invalid or incomplete arguments and the call could not be finalized.`

      taskInstance.consecutiveMistakeCount++
      try {
        taskInstance.recordToolError(block.name as ToolName, errorMessage)
      } catch {
        // Best-effort only
      }

      // Push tool_result directly without setting didAlreadyUseTool so streaming can
      // continue gracefully.
      taskInstance.pushToolResultToUserContent({
        type: "tool_result",
        tool_use_id: sanitizeToolUseId(toolCallId),
        content: formatResponse.toolError(errorMessage),
        is_error: true,
      })

      return
    }
  }

  // Store approval feedback to merge into tool result (GitHub #10465)
  let approvalFeedback: { text: string; images?: string[] } | undefined

  const pushToolResult = (content: ToolResponse, rooTag?: string) => {
    // Native tool calling: only allow ONE tool_result per tool call
    if (hasToolResult) {
      console.warn(`[presentAssistantMessage] Skipping duplicate tool_result for tool_use_id: ${toolCallId}`)
      return
    }

    let resultContent: string
    let imageBlocks: Anthropic.ImageBlockParam[] = []

    if (typeof content === "string") {
      resultContent = content || "(tool did not return anything)"
    } else {
      const textBlocks = content.filter((item) => item.type === "text")
      imageBlocks = content.filter((item) => item.type === "image") as Anthropic.ImageBlockParam[]
      resultContent =
        textBlocks.map((item) => (item as Anthropic.TextBlockParam).text).join("\n") || "(tool did not return anything)"
    }

    // Merge approval feedback into tool result (GitHub #10465)
    if (approvalFeedback) {
      const feedbackText = formatResponse.toolApprovedWithFeedback(approvalFeedback.text)
      resultContent = `${feedbackText}\n\n${resultContent}`
      if (approvalFeedback.images) {
        const feedbackImageBlocks = formatResponse.imageBlocks(approvalFeedback.images)
        imageBlocks = [...feedbackImageBlocks, ...imageBlocks]
      }
    }

    taskInstance.pushToolResultToUserContent({
      type: "tool_result",
      tool_use_id: sanitizeToolUseId(toolCallId),
      content: resultContent,
      ...(rooTag ? { _type: rooTag } : {}),
    })

    if (imageBlocks.length > 0) {
      taskInstance.userMessageContent.push(...imageBlocks)
    }

    hasToolResult = true
  }

  const askApproval = async (
    type: ClineAsk,
    partialMessage?: string,
    progressStatus?: ToolProgressStatus,
    isProtected?: boolean,
  ) => {
    const { response, text, images } = await taskInstance.ask(
      type,
      partialMessage,
      false,
      progressStatus,
      isProtected || false,
    )

    if (response !== "yesButtonClicked") {
      // Handle both messageResponse and noButtonClicked with text.
      if (text) {
        await taskInstance.renderUIMessage("user_feedback", text, images)
        pushToolResult(formatResponse.toolResult(formatResponse.toolDeniedWithFeedback(text), images))
      } else {
        pushToolResult(formatResponse.toolDenied())
      }
      taskInstance.didRejectTool = true
      return false
    }

    // Store approval feedback to be merged into tool result (GitHub #10465)
    // Don't push it as a separate tool_result here - that would create duplicates.
    // The tool will call pushToolResult, which will merge the feedback into the actual result.
    if (text) {
      await taskInstance.renderUIMessage("user_feedback", text, images)
      approvalFeedback = { text, images }
    }

    return true
  }

  const handleError = async (action: string, error: Error) => {
    // Silently ignore AskIgnoredError - this is an internal control flow
    // signal, not an actual error. It occurs when a newer ask supersedes an older one.
    if (error instanceof AskIgnoredError) {
      return
    }
    const errorString = `Error ${action}: ${JSON.stringify(serializeError(error))}`

    await taskInstance.renderUIMessage(
      "error",
      `Error ${action}:\n${error.message ?? JSON.stringify(serializeError(error), null, 2)}`,
    )

    pushToolResult(formatResponse.toolError(errorString))
  }

  if (!block.partial) {
    // Check if this is a custom tool - if so, record as "custom_tool" (like MCP tools)
    const isCustomTool = stateExperiments?.customTools && customToolRegistry.has(block.name)
    const recordName = isCustomTool ? "custom_tool" : block.name
    taskInstance.recordToolUsage(recordName)
  }

  // Validate tool use before execution - ONLY for complete (non-partial) blocks.
  // Validating partial blocks would cause validation errors to be thrown repeatedly
  // during streaming, pushing multiple tool_results for the same tool_use_id and
  // potentially causing the stream to appear frozen.
  if (!block.partial) {
    const modelInfo = taskInstance.api.getModel()
    // Resolve aliases in includedTools before validation
    // e.g., "edit_file" should resolve to "apply_diff"
    const rawIncludedTools = modelInfo?.info?.includedTools
    const { resolveToolAlias } = await import("../../prompts/tools/filter-tools-for-mode")
    const includedTools = rawIncludedTools?.map((tool) => resolveToolAlias(tool))

    try {
      const toolRequirements =
        disabledTools?.reduce(
          (acc: Record<string, boolean>, tool: string) => {
            acc[tool] = false
            const resolvedToolName = resolveToolAlias(tool)
            acc[resolvedToolName] = false
            return acc
          },
          {} as Record<string, boolean>,
        ) ?? {}

      validateToolUse(
        block.name as ToolName,
        mode ?? defaultModeSlug,
        customModes ?? [],
        toolRequirements,
        block.params,
        stateExperiments,
        includedTools,
      )
    } catch (error) {
      taskInstance.consecutiveMistakeCount++
      // For validation errors (unknown tool, tool not allowed for mode), we need to:
      // 1. Send a tool_result with the error (required for native tool calling)
      // 2. NOT set didAlreadyUseTool = true (the tool was never executed, just failed validation)
      // This prevents the stream from being interrupted with "Response interrupted by tool use result"
      // which would cause the extension to appear to hang
      const errorContent = formatResponse.toolError(error.message)
      // Push tool_result directly without setting didAlreadyUseTool
      taskInstance.pushToolResultToUserContent({
        type: "tool_result",
        tool_use_id: sanitizeToolUseId(toolCallId),
        content: typeof errorContent === "string" ? errorContent : "(validation error)",
        is_error: true,
      })

      return
    }
  }

  // Check for identical consecutive tool calls.
  if (!block.partial) {
    // Use the detector to check for repetition, passing the ToolUse
    // block directly.
    const repetitionCheck = taskInstance.toolRepetitionDetector.check(block)

    // If execution is not allowed, notify user and break.
    if (!repetitionCheck.allowExecution && repetitionCheck.askUser) {
      // Handle repetition similar to mistake_limit_reached pattern.
      const { response, text, images } = await taskInstance.ask(
        repetitionCheck.askUser.messageKey as ClineAsk,
        repetitionCheck.askUser.messageDetail.replace("{toolName}", block.name),
      )

      if (response === "messageResponse") {
        // Add user feedback to userContent.
        taskInstance.userMessageContent.push(
          {
            type: "text" as const,
            text: `Tool repetition limit reached. User feedback: ${text}`,
          },
          ...formatResponse.imageBlocks(images),
        )

        // Add user feedback to chat.
        await taskInstance.renderUIMessage("user_feedback", text, images)
      }

      // Return tool result message about the repetition
      pushToolResult(
        formatResponse.toolError(
          `Tool call repetition limit reached for ${block.name}. Please try a different approach.`,
        ),
      )
      return
    }
  }

  //! 1. Handle partial calls
  // This is critical for native tool calling where every tool_use MUST have a tool_result

  // CRITICAL: Don't process partial blocks for unknown tools - just let them stream in.
  // If we try to show errors for partial blocks, we'd show the error on every streaming chunk,
  // creating a loop that appears to freeze the extension. Only handle complete blocks.
  if (block.partial) {
    return
  }

  //! 2. handle std plain tools
  const stdCallbacks = {
    askApproval,
    handleError,
    pushToolResult,
  }

  if (block.name in toolMap) {
    const { tool, needsCheckpoint = false } = toolMap[block.name as StandardTool] as StdToolDefinition

    if (needsCheckpoint) await checkpointSaveAndMark(taskInstance)
    return tool.handle(taskInstance, block, { ...stdCallbacks })
  }

  //! 3. some tools require special care, but we don't initiate this map until we sure we need it (not std tool!)
  const specialToolMap = {
    new_task: {
      tool: newTaskTool,
      needsCheckpoint: true,
      params: { toolCallId: block.id },
    },
    attempt_completion: {
      tool: attemptCompletionTool,
      params: {
        askFinishSubTaskApproval: () => {
          // Ask the user to approve this task has completed, and he has
          // reviewed it, and we can declare task is finished and return
          // control to the parent task to continue running the rest of
          // the sub-tasks.
          const toolMessage = JSON.stringify({ tool: "finishTask" })
          return askApproval("tool", toolMessage)
        },
        toolDescription: () => toolDescription(block, customModes),
      },
    },
  } as const satisfies Partial<Record<StdSpecialTool, SpecialToolDefinition>>

  if (block.name in specialToolMap) {
    const {
      tool,
      needsCheckpoint = false,
      params = {},
    } = specialToolMap[block.name as StdSpecialTool] as SpecialToolDefinition

    if (needsCheckpoint) await checkpointSaveAndMark(taskInstance)
    return tool.handle(taskInstance, block, { ...stdCallbacks, ...params })
  }

  //! 4. should be custom or unknown tool now
  const customTool = stateExperiments?.customTools ? customToolRegistry.get(block.name) : undefined
  if (customTool) {
    try {
      let customToolArgs

      if (customTool.parameters) {
        try {
          customToolArgs = customTool.parameters.parse(block.nativeArgs || block.params || {})
        } catch (parseParamsError) {
          const message = `Custom tool "${block.name}" argument validation failed: ${parseParamsError.message}`
          console.error(message)
          taskInstance.consecutiveMistakeCount++
          await taskInstance.renderUIMessage("error", message)
          pushToolResult(formatResponse.toolError(message))
          return
        }
      }

      const result = await customTool.execute(customToolArgs, {
        mode: mode ?? defaultModeSlug,
        task: taskInstance,
      })

      console.log(`${customTool.name}.execute(): ${JSON.stringify(customToolArgs)} -> ${JSON.stringify(result)}`)

      pushToolResult(result)
      taskInstance.consecutiveMistakeCount = 0
    } catch (executionError: any) {
      taskInstance.consecutiveMistakeCount++
      // Record custom tool error with static name
      taskInstance.recordToolError("custom_tool", executionError.message)
      await handleError(`executing custom tool "${block.name}"`, executionError)
    }

    return
  }

  //! Not a custom tool - handle as unknown tool error
  const errorMessage = `Unknown tool "${block.name}". This tool does not exist. Please use one of the available tools.`
  taskInstance.consecutiveMistakeCount++
  taskInstance.recordToolError(block.name as ToolName, errorMessage)

  await taskInstance.renderUIMessage("error", t("tools:unknownToolError", { toolName: block.name }))
  // Push tool_result directly WITHOUT setting didAlreadyUseTool
  // This prevents the stream from being interrupted with "Response interrupted by tool use result"
  taskInstance.pushToolResultToUserContent({
    type: "tool_result",
    tool_use_id: sanitizeToolUseId(toolCallId),
    content: formatResponse.toolError(errorMessage),
    is_error: true,
  })
}

/**
 * save checkpoint and mark done in the current streaming task.
 * @param task The Task instance to checkpoint save and mark.
 * @returns
 */
async function checkpointSaveAndMark(task: Task) {
  if (task.currentStreamingDidCheckpoint) {
    return
  }
  try {
    await task.checkpointSave(true)
    task.currentStreamingDidCheckpoint = true
  } catch (error) {
    console.error(`[Task#presentAssistantMessage] Error saving checkpoint: ${error.message}`, error)
  }
}
