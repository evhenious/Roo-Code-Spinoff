import type OpenAI from "openai"

const UPDATE_TODO_LIST_DESCRIPTION = `Manage a step-by-step task checklist. The system replaces the entire list on each call — always provide the complete, current state.

Format Rules:
- Single-level markdown checklist only (no nesting, no subtasks)
- One item per line, separated by literal newline characters (\n in JSON strings)
- Status symbols: [ ] pending, [-] in progress, [x] completed
- Items listed in execution order

State Management:
- Always include ALL items: completed, in-progress, and pending
- Do not remove completed items unless explicitly instructed
- Add new items as they are discovered
- Only mark [x] when an item is fully done

Examples:
Initial: { "todos": "[ ] Analyze requirements\\n[ ] Design architecture\\n[ ] Implement core logic" }
After first two done: { "todos": "[x] Analyze requirements\\n[x] Design architecture\\n[-] Implement core logic\\n[ ] Write tests" }

Use when:
- The task has 2+ actionable steps
- Progress needs to be tracked across turns
- New subtasks emerge during execution

Do not use when:
- There is only a single, atomic action to perform
- The response contains no actionable items`

const TODOS_PARAMETER_DESCRIPTION = `Complete checklist as a single string. Each line is one item with status prefix ([ ], [-], [x]). Use \\n for newlines within the JSON string. Include all items — do not omit completed ones.`

export default {
  type: "function",
  function: {
    name: "update_todo_list",
    description: UPDATE_TODO_LIST_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        todos: {
          type: "string",
          description: TODOS_PARAMETER_DESCRIPTION,
        },
      },
      required: ["todos"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
