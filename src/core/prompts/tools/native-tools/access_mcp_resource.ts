import type OpenAI from "openai"

const ACCESS_MCP_RESOURCE_DESCRIPTION = `Request to access a resource provided by a connected MCP server.

Example: Accessing a weather resource
{ "server_name": "weather-server", "uri": "weather://san-francisco/current" }`

const SERVER_NAME_PARAMETER_DESCRIPTION = `The name of the MCP server`

const URI_PARAMETER_DESCRIPTION = `URI of the resource`

export default {
  type: "function",
  function: {
    name: "access_mcp_resource",
    description: ACCESS_MCP_RESOURCE_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        server_name: {
          type: "string",
          description: SERVER_NAME_PARAMETER_DESCRIPTION,
        },
        uri: {
          type: "string",
          description: URI_PARAMETER_DESCRIPTION,
        },
      },
      required: ["server_name", "uri"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
