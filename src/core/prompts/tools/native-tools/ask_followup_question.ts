import type OpenAI from "openai"

const ASK_FOLLOWUP_QUESTION_DESCRIPTION = `Ask the user a question when you want to offer predefined choices.`

const QUESTION_PARAMETER_DESCRIPTION = `The question to ask`

const FOLLOW_UP_PARAMETER_DESCRIPTION = `Array of 2-4 suggested answers`

const FOLLOW_UP_TEXT_DESCRIPTION = `Suggested answer text`

export default {
  type: "function",
  function: {
    name: "ask_followup_question",
    description: ASK_FOLLOWUP_QUESTION_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: QUESTION_PARAMETER_DESCRIPTION,
        },
        follow_up: {
          type: "array",
          description: FOLLOW_UP_PARAMETER_DESCRIPTION,
          items: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: FOLLOW_UP_TEXT_DESCRIPTION,
              },
            },
            required: ["text", "mode"],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 4,
        },
      },
      required: ["question", "follow_up"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
