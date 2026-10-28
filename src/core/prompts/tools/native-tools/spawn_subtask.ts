import type OpenAI from "openai"

const SUBTASK_DESCRIPTION = `Spawn a subtask — a self-contained unit of work that runs in a different mode.

**CRITICAL:** This tool MUST be called alone. Do NOT call this tool alongside other tools in the same message turn. If you need to gather information before spawning a subtask, use other tools in a separate turn first.`

const MODE_PARAMETER_DESCRIPTION = `Slug of the mode to run the subtask in (e.g., code, ask)`

const MESSAGE_PARAMETER_DESCRIPTION = `Detailed instructions and context for the subtask. Include a link to the implementation plan *.md file if one was created.`

const TODOS_PARAMETER_DESCRIPTION = `Initial todo list written as a markdown checklist. Required when the task involves multiple steps or the target workspace mandates them. Omit (null) for simple single-step tasks.`

export default {
  type: "function",
  function: {
    name: "spawn_subtask",
    description: SUBTASK_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          description: MODE_PARAMETER_DESCRIPTION,
        },
        message: {
          type: "string",
          description: MESSAGE_PARAMETER_DESCRIPTION,
        },
        todos: {
          type: ["string", "null"],
          description: TODOS_PARAMETER_DESCRIPTION,
        },
      },
      required: ["mode", "message", "todos"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
