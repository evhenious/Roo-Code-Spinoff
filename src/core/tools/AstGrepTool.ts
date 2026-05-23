import { spawn } from "child_process"

import { Task } from "../task/Task"
import { formatResponse } from "../prompts/responses"
import type { ToolUse } from "../../shared/tools"

import { BaseTool, ToolCallbacks } from "./BaseTool"

interface AstGrepParams {
  query: string
  path?: string
  file_pattern?: string
}

export class AstGrepTool extends BaseTool<"ast_grep"> {
  readonly name = "ast_grep" as const

  async execute(params: AstGrepParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
    const { askApproval, handleError, pushToolResult } = callbacks
    const { query, path: directoryPrefix, file_pattern } = params

    if (!query) {
      task.consecutiveMistakeCount++
      task.didToolFailInCurrentTurn = true
      pushToolResult(await task.sayAndCreateMissingParamError("ast_grep", "query"))
      return
    }

    const sharedMessageProps = {
      tool: "astGrep",
      query: query,
      path: directoryPrefix,
    }

    const didApprove = await askApproval("tool", JSON.stringify(sharedMessageProps))
    if (!didApprove) {
      pushToolResult(formatResponse.toolDenied())
      return
    }

    task.consecutiveMistakeCount = 0

    try {
      const workspacePath = task.cwd && task.cwd.trim() !== "" ? task.cwd : process.cwd()

      // Run sg with inline YAML rule definition
      let stderr = ""
      let result: { stdout: string } | null = null

      const buildArgs = () => {
        const args = ["scan", "--inline-rules", query, "--json=stream"]
        if (file_pattern) args.push("--globs", file_pattern)
        if (directoryPrefix && directoryPrefix !== ".") args.push(directoryPrefix)
        return args
      }

      result = await new Promise<{ stdout: string }>((resolve, reject) => {
        console.debug("=== SG CALL ====", buildArgs().toString())
        const proc = spawn("sg", buildArgs(), {
          cwd: workspacePath,
          timeout: 30000,
          env: process.env,
        })

        let stdout = ""

        proc.stdout.on("data", (data: Buffer) => {
          stdout += data.toString()
        })

        proc.stderr.on("data", (data: Buffer) => {
          stderr += data.toString()
        })

        proc.on("close", (code: number | null) => {
          if (code === 0 || code === null) {
            resolve({ stdout })
          } else {
            reject(new Error(`ast-grep exited with code ${code}: ${stderr}`))
          }
        })

        proc.on("error", reject)
      })

      if (!result?.stdout?.trim()) {
        pushToolResult(`No matches found for pattern: "${query}"`)
        return
      }

      // Parse JSON output from sg
      const matches = this.parseSgOutput(result.stdout)

      if (matches.length === 0) {
        pushToolResult(`No matches found for pattern: "${query}"`)
        return
      }

      const output = this.formatResults(matches, query)
      pushToolResult(output)
    } catch (error: any) {
      const message = error?.message ?? String(error)
      const code = error?.code
      if (code === "ENOENT" || message.includes("spawn sg")) {
        await handleError(
          "ast_grep",
          new Error(
            "ast-grep (sg) is not installed or not in PATH. Please install it via: npm install -g @ast-grep/cli",
          ),
        )
      } else if (message.includes("timed out") || message.includes("TimeoutError")) {
        await handleError("ast_grep", new Error("ast-grep search timed out after 30 seconds"))
      } else {
        await handleError("ast_grep", error)
      }
    }
  }

  private parseSgOutput(output: string): Array<{ path: string; text: string }> {
    const results: Array<{ path: string; text: string }> = []

    try {
      // sg --json=stream outputs one JSON object per line
      // Fields: file (path), lines (source text), text (matched snippet)
      const lines = output.trim().split("\n")
      for (const line of lines) {
        if (!line.trim()) continue
        const match = JSON.parse(line)
        if (match?.file && match?.lines) {
          results.push({
            path: match.file,
            text: match.lines,
          })
        }
      }
    } catch {
      // Fallback: treat output as plain text
      return [{ path: "unknown", text: output.trim() }]
    }

    return results
  }

  private formatResults(matches: Array<{ path: string; text: string }>, query: string): string {
    const header = `AST Grep Results for pattern: "${query}"
Total matches: ${matches.length}

`

    const body = matches
      .map(
        (match) => `File: ${match.path}
Code: ${match.text}
`,
      )
      .join("\n")

    return header + body
  }

  override async handlePartial(task: Task, block: ToolUse<"ast_grep">): Promise<void> {
    const query: string | undefined = block.params.query
    const directoryPrefix: string | undefined = block.params.path

    await task
      .ask("tool", JSON.stringify({ tool: "astGrep", query, path: directoryPrefix }), block.partial)
      .catch(() => {})
  }
}

export const astGrepTool = new AstGrepTool()
