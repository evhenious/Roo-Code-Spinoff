import Anthropic from "@anthropic-ai/sdk"
import { ContentBlockParam } from "@anthropic-ai/sdk/resources/index.mjs"
import type { Task } from "../Task"

export type RooContentBlockParam = ContentBlockParam & {
  _type?: "roo_err" | "env" | "roo_notify_closed"
  _roo_emulated?: boolean
}

export interface RooMessageExtended extends Anthropic.Messages.MessageParam {
  content: string | RooContentBlockParam[]
}

/**
 *
 * @param validatedMessage NEW message NOT saved to apiConversationHistory yet
 * @param task
 */
export const removePreviousEnvDetailsBlock = (validatedMessage: RooMessageExtended, task: Task) => {
  if (!Array.isArray(validatedMessage.content)) {
    return
  }

  // no new env details - exit, don't do anything
  if (validatedMessage.content.some((c) => c._type === "env") === false) {
    return
  }

  // if we try to add new env details
  // need to remove old env details from history. Looking for only one prev entry as we expect to keep only one
  const lastEnvItemIndx = task.apiConversationHistory.findLastIndex(
    (ach) =>
      ach.role === "user" &&
      Array.isArray(ach.content) &&
      ach.content.some((c: RooContentBlockParam) => c._type === "env"),
  )

  if (lastEnvItemIndx < 0) {
    return // no prev env found - no cleanup needed
  }

  task.apiConversationHistory[lastEnvItemIndx].content = (
    task.apiConversationHistory[lastEnvItemIndx].content as RooContentBlockParam[]
  ).filter((c) => c._type !== "env")
}

/**
 *
 * @param validatedMessage NEW message NOT saved to apiConversationHistory yet
 * @param task
 */
export const removeCompletionToolCalls = (validatedMessage: RooMessageExtended, task: Task) => {
  if (!Array.isArray(validatedMessage.content)) {
    return
  }

  // if current user's message DOESN'T start with "roo_notify_closed" - skip
  if (validatedMessage.content[0]._type !== "roo_notify_closed") {
    return
  }

  // when user sends message where the first content entry is a tool call,
  // and it is 'roo_notify_closed' - means it is immediate answer to
  // 'notify' or 'attempt_completion' tools called by LLM.
  const prevEntry = task.apiConversationHistory[task.apiConversationHistory.length - 1]
  const isPrevEntryAssistantToolCompletionCall =
    prevEntry.role === "assistant" &&
    Array.isArray(prevEntry.content) &&
    !!prevEntry.content.find((c) => c.type === "tool_use" && ["notify", "attempt_completion"].includes(c.name))

  if (!isPrevEntryAssistantToolCompletionCall) {
    return // unexpected case, which we just skip for now
  }

  // case 1. we have emulated 'notify' call which could be cleaned up
  const isPrevToolCallEmulatedNotify = (prevEntry.content as Array<RooContentBlockParam>).find(
    (c) => c.type === "tool_use" && c.name === "notify" && c._roo_emulated === true,
  )

  if (isPrevToolCallEmulatedNotify) {
    prevEntry.content = (prevEntry.content as Array<RooContentBlockParam>).filter((c) => c._roo_emulated !== true)
    validatedMessage.content.shift() // "roo_notify_closed" tag goes first, so we drop it too, to avoid orphaned tool result

    return
  }

  // case 2. user: YOU FORGOT THE TOOL => assistant: calls the tool => user answers right after 'notify' or 'attempt_completion' result
  const prePrevEntry: RooMessageExtended = task.apiConversationHistory[task.apiConversationHistory.length - 2]
  const isPrePrevRooError =
    prePrevEntry.role === "user" && Array.isArray(prePrevEntry.content) && prePrevEntry.content[0]._type === "roo_err" // automated SYSTEM ERROR goes always alone, no env_det or anything

  if (isPrePrevRooError) {
    task.apiConversationHistory.pop() // roo tool call forsed by SYSTEM ERROR
    task.apiConversationHistory.pop() // automated SYSTEM ERROR itselt

    validatedMessage.content.shift() // "roo_notify_closed" tag goes first, so we drop it too, to avoid orphaned tool result

    return
  }

  // case 3. ??? to be continued ?
}
