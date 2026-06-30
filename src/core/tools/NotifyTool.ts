import * as vscode from "vscode"

import { RooCodeEventName, type HistoryItem } from "@roo-code/types"

import type { Task } from "../task/Task"
import { formatResponse } from "../prompts/responses"
import { Package } from "../../shared/package"
import type { ToolUse } from "../../shared/tools"
import { t } from "../../i18n"

import { BaseTool, ToolCallbacks } from "./BaseTool"

export class NotifyTool extends BaseTool<"notify"> {
  readonly name = "notify" as const
  readonly result = "finished answering turn"

  async execute(params: any, task: Task, callbacks: ToolCallbacks): Promise<void> {
    const { handleError, pushToolResult } = callbacks

    // Prevent attempt_completion if any tool failed in the current turn
    if (task.didToolFailInCurrentTurn) {
      const errorMsg = t("common:errors.notify_tool_failed")

      await task.say("error", errorMsg)
      pushToolResult(formatResponse.toolError(errorMsg))
      return
    }

    const preventCompletionWithOpenTodos = vscode.workspace
      .getConfiguration(Package.name)
      .get<boolean>("preventCompletionWithOpenTodos", false)

    const hasIncompleteTodos = task.todoList && task.todoList.some((todo) => todo.status !== "completed")

    if (preventCompletionWithOpenTodos && hasIncompleteTodos) {
      task.consecutiveMistakeCount++
      task.recordToolError("notify")

      pushToolResult(
        formatResponse.toolError("Cannot end answering turn with incomplete todos. Please finish all todos first."),
      )

      return
    }

    try {
      task.consecutiveMistakeCount = 0

      await task.say("completion_result", undefined, undefined, false)

      const { response, text, images } = await task.ask("completion_result", "", false)

      if (response === "yesButtonClicked") {
        this.emitTaskCompleted(task)
        return
      }

      // User provided feedback - push tool result to continue the conversation
      await task.say("user_feedback", text ?? "", images) // <- this is shown in the chat

      const feedbackText = `<usr>\n${text}\n</usr>`
      pushToolResult(formatResponse.toolResult(feedbackText, images))
    } catch (error) {
      await handleError("inspecting site", error as Error)
    }
  }

  override async handlePartial(task: Task, block: ToolUse<"notify">): Promise<void> {
    // tool expects NO params
    await task.say("completion_result", undefined, undefined, block.partial)
  }

  private emitTaskCompleted(task: Task): void {
    // Force final token usage update before emitting TaskCompleted.
    // This ensures the latest stats are captured regardless of throttle timer.
    task.emitFinalTokenUsageUpdate()

    task.emit(RooCodeEventName.TaskCompleted, task.taskId, task.getTokenUsage(), task.toolUsage)
  }
}

export const notifyTool = new NotifyTool()
