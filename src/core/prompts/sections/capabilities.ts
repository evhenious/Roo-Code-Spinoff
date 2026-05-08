import { McpHub } from "../../../services/mcp/McpHub"

export function getCapabilitiesSection(cwd: string, mcpHub?: McpHub): string {
	return `
====

CAPABILITIES

- You have tools to list files, read and write files, search file contents with regex, view source code definitions, execute CLI commands, and ask follow-up questions.
- A recursive file listing of the workspace ('${cwd}') is provided in environment_details at task start. Use it to understand project structure and decide which files to inspect.
- You can run interactive and long-running commands via execute_command. Each command runs in a fresh terminal instance.${
		mcpHub ? "\n- MCP servers are available and may provide additional tools and resources." : ""
	}`
}
