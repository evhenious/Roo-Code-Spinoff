import type OpenAI from "openai"

const EXECUTE_COMMAND_DESCRIPTION = `Request to execute a CLI command on the user's system. 
Prefer complex CLI commands over creating executable scripts for flexibility. 
Use relative paths when possible.
Make sure you use correct syntax for current OS.

Note: When timeout was set and exceeded, the command keeps running in the background and you receive the output so far. Use for long-running processes like dev servers.`

const COMMAND_PARAMETER_DESCRIPTION = `Shell command to execute`

const CWD_PARAMETER_DESCRIPTION = `Working directory for the command`

const TIMEOUT_PARAMETER_DESCRIPTION = `Timeout in seconds`

export default {
  type: "function",
  function: {
    name: "execute_command",
    description: EXECUTE_COMMAND_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: COMMAND_PARAMETER_DESCRIPTION,
        },
        cwd: {
          type: ["string", "null"],
          description: CWD_PARAMETER_DESCRIPTION,
        },
        timeout: {
          type: ["number", "null"],
          description: TIMEOUT_PARAMETER_DESCRIPTION,
        },
      },
      required: ["command", "cwd", "timeout"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
