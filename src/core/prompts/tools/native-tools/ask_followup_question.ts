import type OpenAI from "openai"

const ASK_FOLLOWUP_QUESTION_DESCRIPTION = `Ask the user a question when you need structured follow-up or want to offer predefined choices.

Example: Asking for preferred coding language
{ "question": "What should we use for the new project?", "follow_up": [{ "text": "JavaScript", "mode": null }, { "text": "TypeScript", "mode": null }] }

Example: Asking with mode switch
{ "question": "Would you like me to implement this feature?", "follow_up": [{ "text": "Yes, please do", "mode": "code" }, { "text": "No, just plan it out", "mode": "architect" }] }`

const QUESTION_PARAMETER_DESCRIPTION = `The question to ask`

const FOLLOW_UP_PARAMETER_DESCRIPTION = `Array of 2-4 suggested answers`

const FOLLOW_UP_TEXT_DESCRIPTION = `Suggested answer text`

const FOLLOW_UP_MODE_DESCRIPTION = `Optional mode slug to switch to (e.g 'code', 'architect')`

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
              mode: {
                type: ["string", "null"],
                description: FOLLOW_UP_MODE_DESCRIPTION,
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
