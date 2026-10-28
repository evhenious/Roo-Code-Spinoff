import * as vscode from "vscode"

import { TodoItem } from "@roo-code/types"

import { getModeBySlug } from "../../shared/modes"
import { Package } from "../../shared/package"
import type { ToolUse } from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import type { Task } from "../task/Task"
import { BaseTool, ToolCallbacks } from "./BaseTool"
import { parseMarkdownChecklist } from "./UpdateTodoListTool"

interface NewTaskParams {
  mode: string
  message: string
  todos?: string
}

export class SpawnSubtaskTool extends BaseTool<"spawn_subtask"> {
  readonly name = "spawn_subtask" as const

  async execute(params: NewTaskParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
    const { mode, message, todos } = params
    const { askApproval, handleError, pushToolResult } = callbacks

    try {
      // Validate required parameters.
      if (!mode) {
        task.consecutiveMistakeCount++
        task.recordToolError("spawn_subtask")
        task.didToolFailInCurrentTurn = true
        pushToolResult(await task.sayAndCreateMissingParamError("spawn_subtask", "mode"))
        return
      }

      if (!message) {
        task.consecutiveMistakeCount++
        task.recordToolError("spawn_subtask")
        task.didToolFailInCurrentTurn = true
        pushToolResult(await task.sayAndCreateMissingParamError("spawn_subtask", "message"))
        return
      }

      // Get the VSCode setting for requiring todos.
      const provider = task.providerRef.deref()

      if (!provider) {
        pushToolResult(formatResponse.toolError("Provider reference lost"))
        return
      }

      const state = await provider.getState()

      // Use Package.name (dynamic at build time) as the VSCode configuration namespace.
      // Supports multiple extension variants (e.g., stable/nightly) without hardcoded strings.
      const requireTodos = vscode.workspace.getConfiguration(Package.name).get<boolean>("newTaskRequireTodos", false)

      // Check if todos are required based on VSCode setting.
      // Note: `undefined` means not provided, empty string is valid.
      if (requireTodos && todos === undefined) {
        task.consecutiveMistakeCount++
        task.recordToolError("spawn_subtask")
        task.didToolFailInCurrentTurn = true
        pushToolResult(await task.sayAndCreateMissingParamError("spawn_subtask", "todos"))
        return
      }

      // Parse todos if provided, otherwise use empty array
      let todoItems: TodoItem[] = []
      if (todos) {
        try {
          todoItems = parseMarkdownChecklist(todos)
        } catch (error) {
          task.consecutiveMistakeCount++
          task.recordToolError("spawn_subtask")
          task.didToolFailInCurrentTurn = true
          pushToolResult(formatResponse.toolError("Invalid todos format: must be a markdown checklist"))
          return
        }
      }

      task.consecutiveMistakeCount = 0

      // Un-escape one level of backslashes before '@' for hierarchical subtasks
      // Un-escape one level: \\@ -> \@ (removes one backslash for hierarchical subtasks)
      const unescapedMessage = message.replace(/\\\\@/g, "\\@")

      // Verify the mode exists
      const targetMode = getModeBySlug(mode, state?.customModes)

      if (!targetMode) {
        pushToolResult(formatResponse.toolError(`Invalid mode: ${mode}`))
        return
      }

      const toolMessage = JSON.stringify({
        tool: "newTask",
        mode: targetMode.name,
        content: message,
        todos: todoItems,
      })

      const didApprove = await askApproval("tool", toolMessage)

      if (!didApprove) {
        return
      }

      // Delegate parent and open child as sole active task
      const child = await (provider as any).delegateParentAndOpenChild({
        parentTaskId: task.taskId,
        message: unescapedMessage,
        initialTodos: todoItems,
        mode,
      })

      // Reflect delegation in tool result (no pause/unpause, no wait)
      pushToolResult(`Delegated to child task ${child.taskId}`)
      return
    } catch (error) {
      await handleError("creating new task", error)
      return
    }
  }

  override async handlePartial(task: Task, block: ToolUse<"spawn_subtask">): Promise<void> {
    const mode: string | undefined = block.params.mode
    const message: string | undefined = block.params.message
    const todos: string | undefined = block.params.todos

    const partialMessage = JSON.stringify({
      tool: "newTask",
      mode: mode ?? "",
      content: message ?? "",
      todos: todos,
    })

    await task.ask("tool", partialMessage, block.partial).catch(() => {})
  }
}

export const spawnSubTaskTool = new SpawnSubtaskTool()
