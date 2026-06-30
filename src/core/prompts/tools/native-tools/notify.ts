import type OpenAI from "openai"

const NOTIFY_DESCRIPTION = `Let the user know you have finished your turn in conversation.`

export default {
  type: "function",
  function: {
    name: "notify",
    description: NOTIFY_DESCRIPTION,
  },
} satisfies OpenAI.Chat.ChatCompletionTool
