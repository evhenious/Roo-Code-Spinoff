import type OpenAI from "openai"

const ATTEMPT_COMPLETION_DESCRIPTION = `Present the brief summary of the finished task to the user. 
Only use this if you have received results for all tool calls.`

const RESULT_PARAMETER_DESCRIPTION = `The final task summary outlining key points of job done`

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
