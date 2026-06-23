import type OpenAI from "openai"

const ATTEMPT_COMPLETION_DESCRIPTION = `Present the final result of the task to the user. 
Only use this if you have received results for all tool calls - calling it while still waiting for tool results causes broken code and incomplete work.

Parameters:
- result: (required) Short, concise, final summary of the completed task. Avoid questions or offers for further assistance.`

const RESULT_PARAMETER_DESCRIPTION = `Final task summary message`

export default {
  type: "function",
  function: {
    name: "attempt_completion",
    description: ATTEMPT_COMPLETION_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        result: {
          type: "string",
          description: RESULT_PARAMETER_DESCRIPTION,
        },
      },
      required: ["result"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
