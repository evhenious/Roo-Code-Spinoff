/**
 * updateTodoList Handler
 *
 * Handles the "updateTodoList" message type - updates the todo list.
 */

import { setPendingTodoList } from "../../../../core/tools/UpdateTodoListTool"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { MessageSchemas } from "../../utils/messageValidators"

/**
 * Handler for updateTodoList messages.
 * Updates the pending todo list.
 */
export const updateTodoListHandler: MessageHandler = async (ctx, message) => {
  // Validate the message type
  if (message.type !== "updateTodoList") {
    return
  }

  // Use the schema directly for validation since the typed validator doesn't handle the payload well
  const result = MessageSchemas.updateTodoList.safeParse(message)
  if (!result.success) {
    return
  }

  const payload = result.data.payload as { todos?: any[] } | undefined
  const todos = payload?.todos
  if (Array.isArray(todos)) {
    await setPendingTodoList(todos)
  }
}
