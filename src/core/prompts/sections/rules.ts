import type { SystemPromptSettings } from "../types"

import { getShell } from "../../../utils/shell"

/**
 * Returns the appropriate command chaining operator based on the user's shell.
 * - Unix shells (bash, zsh, etc.): `&&` (run next command only if previous succeeds)
 * - PowerShell: `;` (semicolon for command separation)
 * - cmd.exe: `&&` (conditional execution, same as Unix)
 * @internal Exported for testing purposes
 */
export function getCommandChainOperator(): string {
  const shell = getShell().toLowerCase()

  // Check for PowerShell (both Windows PowerShell and PowerShell Core)
  if (shell.includes("powershell") || shell.includes("pwsh")) {
    return ";"
  }

  // Check for cmd.exe
  if (shell.includes("cmd.exe")) {
    return "&&"
  }

  // Default to Unix-style && for bash, zsh, sh, and other shells
  // This also covers Git Bash, WSL, and other Unix-like environments on Windows
  return "&&"
}

/**
 * Returns a shell-specific note about command chaining syntax and platform-specific utilities.
 */
function getCommandChainNote(): string {
  const shell = getShell().toLowerCase()

  // Check for PowerShell
  if (shell.includes("powershell") || shell.includes("pwsh")) {
    return "Note: Using `;` for PowerShell command chaining. For bash/zsh use `&&`, for cmd.exe use `&&`. IMPORTANT: When using PowerShell, avoid Unix-specific utilities like `sed`, `grep`, `awk`, `cat`, `rm`, `cp`, `mv`. Instead use PowerShell equivalents: `Select-String` for grep, `Get-Content` for cat, `Remove-Item` for rm, `Copy-Item` for cp, `Move-Item` for mv, and PowerShell's `-replace` operator or `[regex]` for sed."
  }

  // Check for cmd.exe
  if (shell.includes("cmd.exe")) {
    return "Note: Using `&&` for cmd.exe command chaining (conditional execution). For bash/zsh use `&&`, for PowerShell use `;`. IMPORTANT: When using cmd.exe, avoid Unix-specific utilities like `sed`, `grep`, `awk`, `cat`, `rm`, `cp`, `mv`. Use built-in commands like `type` for cat, `del` for rm, `copy` for cp, `move` for mv, `find`/`findstr` for grep, or consider using PowerShell commands instead."
  }

  // Unix shells
  return ""
}

export function getRulesSection(cwd: string, includeEditRule: boolean, settings?: SystemPromptSettings): string {
  const editRule = includeEditRule
    ? `- When making changes to code, always consider the context in which the code is being used. Ensure that your changes are compatible with the existing codebase and that they follow the project's code and structural patterns.\n`
    : ""

  const editRestrictionRule = includeEditRule
    ? `- Some modes have restrictions on which files they can edit. If you attempt to edit a restricted file, the operation will be rejected with a FileRestrictionError that will specify which file patterns are allowed for the current mode.\n  * For example, in architect mode trying to edit app.js would be rejected because architect mode can only edit files matching "\\.md$"\n`
    : ""

  return `
====

GENERAL RULES

- You are only allowed to ask the user questions using the ask_followup_question tool. When asking, provide 2-4 suggested answers that are specific, actionable, and directly related to the task.
- Prefer using tools over asking questions. For example, use list_files to find a file path rather than asking the user.
- You are STRICTLY FORBIDDEN from starting your messages with "Great", "Certainly", "Okay", "Sure". You should NOT be conversational in your responses, but rather direct and to the point.

- Infer the project type from the file structure and manifest files (e.g., package.json, requirements.txt) to determine appropriate file locations and dependencies.
- environment_details is auto-generated context appended to each user message. Use it to inform your actions, but explain your reasoning when referencing it, as the user may not see it.
- When presented with images, utilize your vision capabilities to thoroughly examine them and extract meaningful information.
- The user may provide a file's contents directly in their message, in which case you shouldn't use the read_file tool to get the file contents again since you already have it.
${editRestrictionRule}${editRule}
- Before executing commands, check the "Actively Running Terminals" section in environment_details. If present, consider how these active processes might impact your task.
- When executing commands, you MUST verify success before proceeding. Use exit code checks (e.g., set -e or && chaining) and follow-up checks (e.g., ls, test -f) for commands that succeed silently.
- If a command is expected to produce significant output (e.g., \`npm test\`, \`docker logs\`), you MUST request the user to paste the output using \`ask_followup_question\` rather than assuming success.
- For long-running or interactive commands, you MUST provide a way for the user to stop them (e.g., \`Ctrl+C\` instructions) and request status updates via \`ask_followup_question\`.
- MCP operations should be used one at a time. Wait for confirmation of success before proceeding with additional operations.

WORKING DIRECTORY & NAVIGATION RULES
- Your absolute working directory is: ${cwd.toPosix()}. It is the project's base directory (the workspace root).
- You MAY navigate into subdirectories within this workspace using \`cd\` or relative paths.
- You MUST NEVER navigate outside this directory (e.g., \`cd ..\`, \`cd ~\`, \`cd /tmp\`, or any path outside the workspace root).
- All file-tool paths (read, edit, write, list) must be relative to this workspace root.
- Terminal sessions reset to the workspace root on creation. If you \`cd\` into a subdirectory, you must chain navigation for every subsequent command: \`cd path/to/subdir && your_command\`. You will automatically return to the workspace root after each terminal session ends.
- If a task requires working outside the workspace root directory, you MUST stop and inform the user that current operation is blocked by security constraints. Request manual user's intervention, and propose an alternative approach if relevant.`
}
