import { Anthropic } from "@anthropic-ai/sdk"
import pWaitFor from "p-wait-for"
import { serializeError } from "serialize-error"

import {
  type ClineApiReqCancelReason,
  type ClineApiReqInfo,
  type ToolName,
  getApiProtocol,
  getModelId,
  isRetiredProvider,
} from "@roo-code/types"

import { GroundingSource } from "../../api/transform/stream"
import { getEnvironmentDetails } from "../environment/getEnvironmentDetails"

import { t } from "../../i18n"
import { sanitizeToolUseId } from "../../utils/tool-id"
import { NativeToolCallParser } from "../assistant-message/NativeToolCallParser"
import { formatResponse } from "../prompts/responses"

import { calculateApiCostAnthropic, calculateApiCostOpenAI } from "../../shared/cost"
import type { McpToolUse, ToolUse } from "../../shared/tools"
import { processUserContentMentions } from "../mentions/processUserContentMentions"
import { TaskWorkflowDependencies } from "./interface"

// Constants TODO cleanup?
const MAX_EXPONENTIAL_BACKOFF_SECONDS = 600
const DEFAULT_USAGE_COLLECTION_TIMEOUT_MS = 5000
const FORCED_CONTEXT_REDUCTION_PERCENT = 75
const MAX_CONTEXT_WINDOW_RETRIES = 3

export class TaskWorkflow {
  constructor(private deps: TaskWorkflowDependencies) {}

  /** Tracks the mode slug last sent in environment details. Used to avoid re-sending mode details on every turn. */
  private _lastSentMode: string | undefined

  /**
   * Executes the agentic loop: builds user content, makes API requests,
   * streams responses, assembles assistant messages, executes tools, and
   * loops until the task ends or the stack is empty.
   */
  async execute(
    userContent: Anthropic.Messages.ContentBlockParam[],
    includeFileDetails: boolean = false,
  ): Promise<boolean> {
    interface StackItem {
      userContent: Anthropic.Messages.ContentBlockParam[]
      includeFileDetails: boolean
      retryAttempt?: number
      userMessageWasRemoved?: boolean
    }

    const stack: StackItem[] = [{ userContent, includeFileDetails, retryAttempt: 0 }]

    // Cache API protocol once per iteration (optimization)
    const modelId = getModelId(this.deps.apiConfiguration)
    const apiProvider = this.deps.apiConfiguration.apiProvider
    const apiProtocol = getApiProtocol(
      apiProvider && !isRetiredProvider(apiProvider) ? apiProvider : undefined,
      modelId,
    )

    while (stack.length > 0) {
      const currentItem = stack.pop()!
      const currentUserContent = currentItem.userContent
      const currentIncludeFileDetails = currentItem.includeFileDetails

      if (this.deps.abort) {
        throw new Error(`[RooCode#recursivelyMakeRooRequests] task ${this.deps.taskId}.${this.deps.instanceId} aborted`)
      }

      if (
        this.deps.consecutiveMistakeLimit > 0 &&
        this.deps.consecutiveMistakeCount >= this.deps.consecutiveMistakeLimit
      ) {
        const { response, text, images } = await this.deps.ask(
          "mistake_limit_reached",
          t("common:errors.mistake_limit_guidance"),
        )

        if (response === "messageResponse") {
          currentUserContent.push(
            ...[
              { type: "text" as const, text: formatResponse.tooManyMistakes(text) },
              ...formatResponse.imageBlocks(images),
            ],
          )

          await this.deps.say("user_feedback", text, images)
        }

        this.deps.setConsecutiveMistakeCount(0)
      }

      // Respect user-configured provider rate limiting BEFORE we emit api_req_started.
      await this.deps.backoffAndAnnounce(currentItem.retryAttempt ?? 0, null)
      this.deps.setLastGlobalApiRequestTime(performance.now())

      await this.deps.say(
        "api_req_started",
        JSON.stringify({
          apiProtocol,
        }),
      )

      const provider = await this.deps.getProvider()

      const state = await this.deps.getState()

      const showRooIgnoredFiles = state?.showRooIgnoredFiles ?? false
      // Fetch state once per iteration (optimization - consolidate state fetches)
      const includeDiagnosticMessages = state?.includeDiagnosticMessages ?? true
      const maxDiagnosticMessages = state?.maxDiagnosticMessages ?? 50
      const currentMode = state?.mode ?? "default"

      const { content: parsedUserContent, mode: slashCommandMode } = await processUserContentMentions({
        userContent: currentUserContent,
        cwd: this.deps.cwd,
        fileContextTracker: this.deps.fileContextTracker,
        rooIgnoreController: this.deps.rooIgnoreController,
        showRooIgnoredFiles,
        includeDiagnosticMessages,
        maxDiagnosticMessages,
        skillsManager: provider.getSkillsManager(),
        currentMode,
      })

      // Switch mode if specified in a slash command's frontmatter
      const customModes = state?.customModes
      if (slashCommandMode) {
        const { getModeBySlug } = await import("../../shared/modes")
        const targetMode = getModeBySlug(slashCommandMode, customModes)
        if (targetMode) {
          await provider.handleModeSwitch(slashCommandMode)
        }
      }

      // Track mode changes to avoid re-sending mode details on every turn
      const modeChanged = this._lastSentMode !== currentMode
      if (modeChanged) {
        this._lastSentMode = currentMode
      }

      const environmentDetails = await getEnvironmentDetails(
        //
        this.deps.taskForEnvironmentDetails,
        currentIncludeFileDetails,
        currentIncludeFileDetails, // controlling git history and some more stuff visibility
        modeChanged, // controlling mode details visibility
      )

      // Remove any existing environment_details blocks before adding fresh ones.
      const contentWithoutEnvDetails = parsedUserContent.filter((block) => {
        if (block.type === "text" && typeof block.text === "string") {
          const isEnvironmentDetailsBlock =
            block.text.trim().startsWith("<environment_details>") &&
            block.text.trim().endsWith("</environment_details>")
          return !isEnvironmentDetailsBlock
        }
        return true
      })

      // Add environment details as its own text block, separate from tool results.
      // TODO: what if we added system info only once
      let finalUserContent = [...contentWithoutEnvDetails, { type: "text" as const, text: environmentDetails }]
      // Only add user message to conversation history if:
      // 1. This is the first attempt (retryAttempt === 0), AND
      // 2. The original userContent was not empty, OR
      // 3. The message was removed in a previous iteration
      const isEmptyUserContent = currentUserContent.length === 0
      const shouldAddUserMessage =
        ((currentItem.retryAttempt ?? 0) === 0 && !isEmptyUserContent) || currentItem.userMessageWasRemoved
      if (shouldAddUserMessage) {
        await this.deps.addToApiConversationHistory({ role: "user", content: finalUserContent })
      }

      // Update the api_req_started message with full info
      const lastApiReqIndex = this.deps.clineMessages.findLastIndex((m) => m.say === "api_req_started")

      this.deps.clineMessages[lastApiReqIndex].text = JSON.stringify({
        apiProtocol,
      } satisfies ClineApiReqInfo)

      await this.deps.saveClineMessages()
      await this.deps.postStateToWebviewWithoutTaskHistory()

      try {
        // Track if assistant message was saved for conditional state update
        let assistantMessageSaved = false

        let cacheWriteTokens = 0
        let cacheReadTokens = 0

        let inputTokens = 0
        let outputTokens = 0
        let totalCost: number | undefined

        const updateApiReqMsg = (cancelReason?: ClineApiReqCancelReason, streamingFailedMessage?: string) => {
          if (lastApiReqIndex < 0 || !this.deps.clineMessages[lastApiReqIndex]) {
            return
          }

          const existingData = JSON.parse(this.deps.clineMessages[lastApiReqIndex].text || "{}")

          // Use cached apiProtocol from outer scope (optimization)
          const modelInfo = this.deps.cachedStreamingModel?.info
          const costResult =
            modelInfo && apiProtocol === "anthropic"
              ? calculateApiCostAnthropic(modelInfo, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens)
              : modelInfo
                ? calculateApiCostOpenAI(modelInfo, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens)
                : { totalInputTokens: inputTokens, totalOutputTokens: outputTokens, totalCost: 0 }

          this.deps.clineMessages[lastApiReqIndex].text = JSON.stringify({
            ...existingData,
            tokensIn: costResult.totalInputTokens,
            tokensOut: costResult.totalOutputTokens,
            cacheWrites: cacheWriteTokens,
            cacheReads: cacheReadTokens,
            cost: totalCost ?? costResult.totalCost,
            cancelReason,
            streamingFailedMessage,
          } satisfies ClineApiReqInfo)
        }

        const abortStream = async (cancelReason: ClineApiReqCancelReason, streamingFailedMessage?: string) => {
          if (this.deps.diffViewProviderIsEditing) {
            await this.deps.diffViewProviderRevertChanges()
          }

          const lastMessage = this.deps.clineMessages.at(-1)

          if (lastMessage && lastMessage.partial) {
            lastMessage.partial = false
          }

          updateApiReqMsg(cancelReason, streamingFailedMessage)
          await this.deps.saveClineMessages()

          this.deps.didFinishAbortingStream = true
        }

        // Reset streaming state for each new API request
        this.deps.setCurrentStreamingContentIndex(0)
        this.deps.setCurrentStreamingDidCheckpoint(false)
        this.deps.setAssistantMessageContent([])
        this.deps.setDidCompleteReadingStream(false)
        this.deps.setUserMessageContent([])
        this.deps.setUserMessageContentReady(false)
        this.deps.setDidRejectTool(false)
        this.deps.setDidAlreadyUseTool(false)
        this.deps.setAssistantMessageSavedToHistory(false)
        this.deps.setDidToolFailInCurrentTurn(false)
        this.deps.setPresentAssistantMessageLocked(false)
        this.deps.setPresentAssistantMessageHasPendingUpdates(false)
        this.deps.streamingToolCallIndices.clear()
        NativeToolCallParser.clearAllStreamingToolCalls()
        NativeToolCallParser.clearRawChunkState()

        await this.deps.diffViewProviderReset()

        // Cache model info once per API request
        this.deps.setCachedStreamingModel(this.deps.cachedStreamingModel)
        const streamModelInfo = this.deps.cachedStreamingModel?.info

        // Yields only if the first chunk is successful
        const stream = this.deps.attemptApiRequest(currentItem.retryAttempt ?? 0, {
          skipProviderRateLimit: true,
        })
        let assistantMessage = ""
        let reasoningMessage = ""
        let pendingGroundingSources: GroundingSource[] = []
        this.deps.setIsStreaming(true)

        try {
          const iterator = stream[Symbol.asyncIterator]()

          // Helper to race iterator.next() with abort signal
          const nextChunkWithAbort = async () => {
            const nextPromise = iterator.next()

            if (this.deps.currentRequestAbortController) {
              const abortPromise = new Promise<never>((_, reject) => {
                const signal = this.deps.currentRequestAbortController!.signal
                if (signal.aborted) {
                  reject(new Error("Request cancelled by user"))
                } else {
                  signal.addEventListener("abort", () => {
                    reject(new Error("Request cancelled by user"))
                  })
                }
              })
              return await Promise.race([nextPromise, abortPromise])
            }

            return await nextPromise
          }

          let item = await nextChunkWithAbort()
          while (!item.done) {
            const chunk = item.value
            item = await nextChunkWithAbort()
            if (!chunk) {
              continue
            }

            switch (chunk.type) {
              case "reasoning": {
                reasoningMessage += chunk.text
                let formattedReasoning = reasoningMessage
                if (reasoningMessage.includes("**")) {
                  formattedReasoning = reasoningMessage.replace(/([.!?])\*\*([^*\n]+)\*\*/g, "$1\n\n**$2**")
                }
                await this.deps.say("reasoning", formattedReasoning, undefined, true)
                break
              }

              case "usage":
                inputTokens += chunk.inputTokens
                outputTokens += chunk.outputTokens
                cacheWriteTokens += chunk.cacheWriteTokens ?? 0
                cacheReadTokens += chunk.cacheReadTokens ?? 0
                totalCost = chunk.totalCost
                break

              case "grounding":
                if (chunk.sources && chunk.sources.length > 0) {
                  pendingGroundingSources.push(...chunk.sources)
                }
                break

              case "tool_call_partial": {
                const events = NativeToolCallParser.processRawChunk({
                  index: chunk.index,
                  id: chunk.id,
                  name: chunk.name,
                  arguments: chunk.arguments,
                })

                for (const event of events) {
                  if (event.type === "tool_call_start") {
                    if (this.deps.streamingToolCallIndices.has(event.id)) {
                      console.warn(
                        `[Task#${this.deps.taskId}] Ignoring duplicate tool_call_start for ID: ${event.id} (tool: ${event.name})`,
                      )
                      continue
                    }

                    NativeToolCallParser.startStreamingToolCall(event.id, event.name as ToolName)

                    const lastBlock = this.deps.assistantMessageContent[this.deps.assistantMessageContent.length - 1]
                    if (lastBlock?.type === "text" && (lastBlock as any).partial) {
                      ;(lastBlock as any).partial = false
                    }

                    const toolUseIndex = this.deps.assistantMessageContent.length
                    this.deps.streamingToolCallIndices.set(event.id, toolUseIndex)

                    const partialToolUse: ToolUse = {
                      type: "tool_use",
                      name: event.name as ToolName,
                      params: {},
                      partial: true,
                    }

                    ;(partialToolUse as any).id = event.id

                    this.deps.assistantMessageContent.push(partialToolUse)
                    this.deps.setUserMessageContentReady(false)
                    await this.deps.presentAssistantMessage()
                  } else if (event.type === "tool_call_delta") {
                    const partialToolUse = NativeToolCallParser.processStreamingChunk(event.id, event.delta)

                    if (partialToolUse) {
                      const toolUseIndex = this.deps.streamingToolCallIndices.get(event.id)
                      if (toolUseIndex !== undefined) {
                        ;(partialToolUse as any).id = event.id
                        this.deps.assistantMessageContent[toolUseIndex] = partialToolUse
                        await this.deps.presentAssistantMessage()
                      }
                    }
                  } else if (event.type === "tool_call_end") {
                    const finalToolUse = NativeToolCallParser.finalizeStreamingToolCall(event.id)
                    const toolUseIndex = this.deps.streamingToolCallIndices.get(event.id)

                    if (finalToolUse) {
                      ;(finalToolUse as any).id = event.id
                      if (toolUseIndex !== undefined) {
                        this.deps.assistantMessageContent[toolUseIndex] = finalToolUse
                      }
                      this.deps.streamingToolCallIndices.delete(event.id)
                      this.deps.setUserMessageContentReady(false)
                      await this.deps.presentAssistantMessage()
                    } else if (toolUseIndex !== undefined) {
                      const existingToolUse = this.deps.assistantMessageContent[toolUseIndex]
                      if (existingToolUse && existingToolUse.type === "tool_use") {
                        existingToolUse.partial = false
                        ;(existingToolUse as any).id = event.id
                      }
                      this.deps.streamingToolCallIndices.delete(event.id)
                      this.deps.setUserMessageContentReady(false)
                      await this.deps.presentAssistantMessage()
                    }
                  }
                }
                break
              }

              case "tool_call": {
                const toolUse = NativeToolCallParser.parseToolCall({
                  id: chunk.id,
                  name: chunk.name as ToolName,
                  arguments: chunk.arguments,
                })

                if (!toolUse) {
                  console.error(`Failed to parse tool call for task ${this.deps.taskId}:`, chunk)
                  break
                }

                toolUse.id = chunk.id
                this.deps.assistantMessageContent.push(toolUse)
                this.deps.setUserMessageContentReady(false)
                await this.deps.presentAssistantMessage()
                break
              }

              case "text": {
                assistantMessage += chunk.text

                const lastBlock = this.deps.assistantMessageContent[this.deps.assistantMessageContent.length - 1]
                if (lastBlock?.type === "text" && (lastBlock as any).partial) {
                  ;(lastBlock as any).content = assistantMessage
                } else {
                  this.deps.assistantMessageContent.push({
                    type: "text",
                    content: assistantMessage,
                    partial: true,
                  })
                  this.deps.setUserMessageContentReady(false)
                }
                await this.deps.presentAssistantMessage()
                break
              }
            }

            if (this.deps.abort) {
              console.log(`aborting stream, this.abandoned = ${this.deps.abandoned}`)

              if (!this.deps.abandoned) {
                await abortStream("user_cancelled")
              }

              break
            }

            if (this.deps.didRejectTool) {
              assistantMessage += "\n\n[Response interrupted by user feedback]"
              break
            }

            if (this.deps.didAlreadyUseTool) {
              assistantMessage +=
                "\n\n[Response interrupted by a tool use result. Only one tool may be used at a time and should be placed at the end of the message.]"
              break
            }
          }

          // update gathered token counts
          updateApiReqMsg()
          await this.deps.saveClineMessages()

          const apiReqMessage = this.deps.clineMessages[lastApiReqIndex]
          if (apiReqMessage) {
            await this.deps.updateClineMessage(apiReqMessage)
          }
        } catch (error) {
          if (!this.deps.abandoned) {
            const cancelReason: ClineApiReqCancelReason = this.deps.abort ? "user_cancelled" : "streaming_failed"

            const rawErrorMessage = error.message ?? JSON.stringify(serializeError(error), null, 2)
            const streamingFailedMessage = this.deps.abort
              ? undefined
              : `${t("common:interruption.streamTerminatedByProvider")}: ${rawErrorMessage}`

            await abortStream(cancelReason, streamingFailedMessage)

            if (this.deps.abort) {
              this.deps.setAbortReason(cancelReason)
              await this.deps.abortTask()
            } else {
              console.error(
                `[Task#${this.deps.taskId}.${this.deps.instanceId}] Stream failed, will retry: ${streamingFailedMessage}`,
              )

              const stateForBackoff = await this.deps.getState()
              if (stateForBackoff?.autoApprovalEnabled) {
                await this.deps.backoffAndAnnounce(currentItem.retryAttempt ?? 0, error)

                if (this.deps.abort) {
                  console.log(
                    `[Task#${this.deps.taskId}.${this.deps.instanceId}] Task aborted during mid-stream retry backoff`,
                  )
                  this.deps.setAbortReason("user_cancelled")
                  await this.deps.abortTask()
                  break
                }
              }

              stack.push({
                userContent: currentUserContent,
                includeFileDetails: false,
                retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
              })

              continue
            }
          }
        } finally {
          this.deps.setIsStreaming(false)
          this.deps.setCurrentRequestAbortController(undefined)
        }

        // Need to call here in case the stream was aborted.
        if (this.deps.abort || this.deps.abandoned) {
          throw new Error(
            `[RooCode#recursivelyMakeRooRequests] task ${this.deps.taskId}.${this.deps.instanceId} aborted`,
          )
        }

        this.deps.setDidCompleteReadingStream(true)

        // Finalize any remaining streaming tool calls
        const finalizeEvents = NativeToolCallParser.finalizeRawChunks()
        for (const event of finalizeEvents) {
          if (event.type === "tool_call_end") {
            const finalToolUse = NativeToolCallParser.finalizeStreamingToolCall(event.id)
            const toolUseIndex = this.deps.streamingToolCallIndices.get(event.id)

            if (finalToolUse) {
              ;(finalToolUse as any).id = event.id
              if (toolUseIndex !== undefined) {
                this.deps.assistantMessageContent[toolUseIndex] = finalToolUse
              }
              this.deps.streamingToolCallIndices.delete(event.id)
              this.deps.setUserMessageContentReady(false)
              await this.deps.presentAssistantMessage()
            } else if (toolUseIndex !== undefined) {
              const existingToolUse = this.deps.assistantMessageContent[toolUseIndex]
              if (existingToolUse && existingToolUse.type === "tool_use") {
                existingToolUse.partial = false
                ;(existingToolUse as any).id = event.id
              }
              this.deps.streamingToolCallIndices.delete(event.id)
              this.deps.setUserMessageContentReady(false)
              await this.deps.presentAssistantMessage()
            }
          }
        }

        const partialBlocks = this.deps.assistantMessageContent.filter((block) => block.partial)
        partialBlocks.forEach((block) => (block.partial = false))

        // Complete the reasoning message if it exists
        if (reasoningMessage) {
          const lastReasoningIndex = this.deps.clineMessages.findLastIndex(
            (m) => m.type === "say" && m.say === "reasoning",
          )

          if (lastReasoningIndex !== -1 && this.deps.clineMessages[lastReasoningIndex].partial) {
            this.deps.clineMessages[lastReasoningIndex].partial = false
            await this.deps.updateClineMessage(this.deps.clineMessages[lastReasoningIndex])
          }
        }

        await this.deps.saveClineMessages()

        // Conditional state update - only update if assistant message was saved (optimization)
        if (assistantMessageSaved) {
          await this.deps.postStateToWebviewWithoutTaskHistory()
        }

        // CRITICAL: Save assistant message to API history BEFORE executing tools.
        const hasTextContent = assistantMessage.length > 0

        const hasToolUses = this.deps.assistantMessageContent.some(
          (block) => block.type === "tool_use" || block.type === "mcp_tool_use",
        )

        if (hasTextContent || hasToolUses) {
          this.deps.setConsecutiveNoAssistantMessagesCount(0)

          if (pendingGroundingSources.length > 0) {
            const citationLinks = pendingGroundingSources.map((source, i) => `[${i + 1}](${source.url})`)
            const sourcesText = `${t("common:gemini.sources")} ${citationLinks.join(", ")}`

            await this.deps.say("text", sourcesText, undefined, false, undefined, undefined, {
              isNonInteractive: true,
            })
          }

          const assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = []

          if (assistantMessage) {
            assistantContent.push({
              type: "text" as const,
              text: assistantMessage,
            })
          }

          const seenToolUseIds = new Set<string>()
          const toolUseBlocks = this.deps.assistantMessageContent.filter(
            (block) => block.type === "tool_use" || block.type === "mcp_tool_use",
          )
          for (const block of toolUseBlocks) {
            if (block.type === "mcp_tool_use") {
              const mcpBlock = block as McpToolUse
              if (mcpBlock.id) {
                const sanitizedId = sanitizeToolUseId(mcpBlock.id)
                if (seenToolUseIds.has(sanitizedId)) {
                  console.warn(
                    `[Task#${this.deps.taskId}] Pre-flight deduplication: Skipping duplicate MCP tool_use ID: ${sanitizedId} (tool: ${mcpBlock.name})`,
                  )
                  continue
                }
                seenToolUseIds.add(sanitizedId)
                assistantContent.push({
                  type: "tool_use" as const,
                  id: sanitizedId,
                  name: mcpBlock.name,
                  input: mcpBlock.arguments,
                })
              }
            } else {
              const toolUse = block as ToolUse
              const toolCallId = toolUse.id
              if (toolCallId) {
                const sanitizedId = sanitizeToolUseId(toolCallId)
                if (seenToolUseIds.has(sanitizedId)) {
                  console.warn(
                    `[Task#${this.deps.taskId}] Pre-flight deduplication: Skipping duplicate tool_use ID: ${sanitizedId} (tool: ${toolUse.name})`,
                  )
                  continue
                }
                seenToolUseIds.add(sanitizedId)
                const input = toolUse.nativeArgs || toolUse.params
                const toolNameForHistory = (toolUse as any).originalName ?? toolUse.name

                assistantContent.push({
                  type: "tool_use" as const,
                  id: sanitizedId,
                  name: toolNameForHistory,
                  input,
                })
              }
            }
          }

          // Enforce new_task isolation
          const newTaskIndex = assistantContent.findIndex(
            (block) => block.type === "tool_use" && block.name === "new_task",
          )

          if (newTaskIndex !== -1 && newTaskIndex < assistantContent.length - 1) {
            const truncatedTools = assistantContent.slice(newTaskIndex + 1)
            assistantContent.length = newTaskIndex + 1

            const executionNewTaskIndex = this.deps.assistantMessageContent.findIndex(
              (block) => block.type === "tool_use" && block.name === "new_task",
            )
            if (executionNewTaskIndex !== -1) {
              this.deps.assistantMessageContent.length = executionNewTaskIndex + 1
            }

            for (const tool of truncatedTools) {
              if (tool.type === "tool_use" && (tool as Anthropic.ToolUseBlockParam).id) {
                this.deps.pushToolResultToUserContent({
                  type: "tool_result",
                  tool_use_id: (tool as Anthropic.ToolUseBlockParam).id,
                  content:
                    "This tool was not executed because new_task was called in the same message turn. The new_task tool must be the last tool in a message.",
                  is_error: true,
                })
              }
            }
          }

          await this.deps.addToApiConversationHistory(
            { role: "assistant", content: assistantContent },
            reasoningMessage || undefined,
          )
          this.deps.setAssistantMessageSavedToHistory(true)
        }

        if (partialBlocks.length > 0) {
          assistantMessageSaved = true
          await this.deps.presentAssistantMessage()
        }

        if (hasTextContent || hasToolUses) {
          await pWaitFor(() => this.deps.userMessageContentReady)

          const usedSomeTools = this.deps.assistantMessageContent.some(
            (block) => block.type === "tool_use" || block.type === "mcp_tool_use",
          )

          if (!usedSomeTools) {
            this.deps.setConsecutiveNoToolUseCount(this.deps.consecutiveNoToolUseCount + 1)
            this.deps.setConsecutiveMistakeCount(this.deps.consecutiveMistakeCount + 1)

            if (this.deps.consecutiveNoToolUseCount >= 3) {
              await this.deps.say("error", "MODEL_NO_TOOLS_USED")
            }

            this.deps.setUserMessageContent([
              ...this.deps.userMessageContent,
              {
                type: "text",
                text: formatResponse.noToolsUsed(),
              },
            ])
          } else {
            this.deps.setConsecutiveNoToolUseCount(0)
          }

          if (this.deps.userMessageContent.length > 0 || this.deps.isPaused) {
            stack.push({
              userContent: [...this.deps.userMessageContent],
              includeFileDetails: false,
            })

            // ensures the UI can render messages and the extension remains responsive while the loop continues processing.
            await new Promise((resolve) => setImmediate(resolve))
          }

          continue
        } else {
          this.deps.setConsecutiveNoAssistantMessagesCount(this.deps.consecutiveNoAssistantMessagesCount + 1)

          if (this.deps.consecutiveNoAssistantMessagesCount >= 1) {
            await this.deps.say("error", "MODEL_NO_ASSISTANT_MESSAGES")
          }

          let state = await this.deps.getState()
          if (this.deps.apiConversationHistory.length > 0) {
            const lastMessage = this.deps.apiConversationHistory[this.deps.apiConversationHistory.length - 1]
            if (lastMessage.role === "user") {
              this.deps.apiConversationHistory = this.deps.apiConversationHistory.slice(0, -1)
            }
          }

          if (state?.autoApprovalEnabled) {
            await this.deps.backoffAndAnnounce(
              currentItem.retryAttempt ?? 0,
              new Error("Unexpected API Response: The language model did not provide any assistant messages."),
            )

            if (this.deps.abort) {
              console.log(
                `[Task#${this.deps.taskId}.${this.deps.instanceId}] Task aborted during empty-assistant retry backoff`,
              )
              break
            }

            stack.push({
              userContent: currentUserContent,
              includeFileDetails: false,
              retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
              userMessageWasRemoved: true,
            })

            continue
          } else {
            const { response } = await this.deps.ask(
              "api_req_failed",
              "The model returned no assistant messages. This may indicate an issue with the API or the model's output.",
            )

            if (response === "yesButtonClicked") {
              await this.deps.say("api_req_retried")

              stack.push({
                userContent: currentUserContent,
                includeFileDetails: false,
                retryAttempt: (currentItem.retryAttempt ?? 0) + 1,
              })

              continue
            } else {
              await this.deps.addToApiConversationHistory({
                role: "user",
                content: currentUserContent,
              })

              await this.deps.say(
                "error",
                "Unexpected API Response: The language model did not provide any assistant messages.",
              )

              await this.deps.addToApiConversationHistory({
                role: "assistant",
                content: [{ type: "text", text: "Failure: I did not provide a response." }],
              })
            }
          }
        }

        return false
      } catch (error) {
        return true
      }
    }

    return false
  }
}
