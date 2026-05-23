import { spawn } from "child_process"
import { AstGrepTool } from "../core/tools/AstGrepTool"
import { Task } from "../core/task/Task"
import type { ToolCallbacks } from "../core/tools/BaseTool"
import { formatResponse } from "../core/prompts/responses"

vi.mock("child_process", () => ({
  spawn: vi.fn(),
}))

describe("AstGrepTool", () => {
  let tool: AstGrepTool
  let mockCallbacks: ToolCallbacks
  let mockTask: Partial<Task>
  let mockSpawn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    tool = new AstGrepTool()
    mockSpawn = vi.mocked(spawn)
    mockCallbacks = {
      askApproval: vi.fn().mockResolvedValue(true),
      handleError: vi.fn(),
      pushToolResult: vi.fn(),
    }
    mockTask = {
      cwd: "/test/workspace",
      consecutiveMistakeCount: 0,
      didToolFailInCurrentTurn: false,
      sayAndCreateMissingParamError: vi.fn().mockResolvedValue("Missing parameter error"),
      say: vi.fn().mockResolvedValue(undefined),
      providerRef: {
        deref: () => undefined,
        [Symbol.toStringTag]: "WeakRef",
      },
    }
    vi.clearAllMocks()
  })

  describe("execute", () => {
    it("should return error when query is missing", async () => {
      await tool.execute({ query: "" }, mockTask as Task, mockCallbacks)

      expect(mockTask.consecutiveMistakeCount).toBe(1)
      expect(mockCallbacks.pushToolResult).toHaveBeenCalledWith("Missing parameter error")
    })

    it("should deny execution when approval is not granted", async () => {
      mockCallbacks.askApproval = vi.fn().mockResolvedValue(false)

      await tool.execute({ query: "console.log" }, mockTask as Task, mockCallbacks)

      expect(mockCallbacks.askApproval).toHaveBeenCalledWith("tool", expect.any(String))
      expect(mockCallbacks.pushToolResult).toHaveBeenCalledWith(formatResponse.toolDenied())
    })

    it("should execute sg command with correct parameters", async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      // Simulate stdout data event
      const stdoutData = JSON.stringify({
        file: "src/test.ts",
        lines: "console.log('hello')",
      })

      mockProc.stdout.on.mockImplementation((event: string, cb: any) => {
        if (event === "data") {
          cb(Buffer.from(stdoutData))
        }
      })

      // Simulate successful close
      mockProc.on.mockImplementation((event: string, cb: any) => {
        if (event === "close") {
          cb(0)
        }
        if (event === "error") {
          // no error
        }
      })

      mockSpawn.mockReturnValue(mockProc)

      await tool.execute(
        { query: 'id: test\nrule:\n  pattern: "console.log($$)"', path: "src", file_pattern: "*.ts" },
        mockTask as Task,
        mockCallbacks,
      )

      expect(mockSpawn).toHaveBeenCalledWith(
        "sg",
        expect.arrayContaining(["scan", "--inline-rules", expect.stringContaining("console.log")]),
        expect.any(Object),
      )
      expect(mockCallbacks.pushToolResult).toHaveBeenCalledWith(expect.stringContaining("console.log"))
    })

    it("should handle sg not found error", async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockProc.on.mockImplementation((event: string, cb: any) => {
        if (event === "error") {
          const error = new Error("command not found") as NodeJS.ErrnoException
          error.code = "ENOENT"
          cb(error)
        }
      })

      mockSpawn.mockReturnValue(mockProc)

      await tool.execute({ query: "console.log" }, mockTask as Task, mockCallbacks)

      expect(mockCallbacks.handleError).toHaveBeenCalledWith(
        "ast_grep",
        expect.objectContaining({
          message: expect.stringContaining("ast-grep (sg) is not installed"),
        }),
      )
    })

    it("should handle empty results", async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      mockProc.on.mockImplementation((event: string, cb: any) => {
        if (event === "close") {
          cb(0)
        }
      })

      mockSpawn.mockReturnValue(mockProc)

      await tool.execute({ query: "nonexistent" }, mockTask as Task, mockCallbacks)

      expect(mockCallbacks.pushToolResult).toHaveBeenCalledWith(expect.stringContaining("No matches found"))
    })

    it("should include optional parameters in command", async () => {
      const mockProc: any = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
      }

      const stdoutData = JSON.stringify({
        file: "src/test.ts",
        lines: "test code",
      })

      mockProc.stdout.on.mockImplementation((event: string, cb: any) => {
        if (event === "data") {
          cb(Buffer.from(stdoutData))
        }
      })

      mockProc.on.mockImplementation((event: string, cb: any) => {
        if (event === "close") {
          cb(0)
        }
      })

      mockSpawn.mockReturnValue(mockProc)

      await tool.execute(
        { query: 'id: test\nrule:\n  pattern: "test"', path: "src", file_pattern: "*.ts" },
        mockTask as Task,
        mockCallbacks,
      )

      const spawnCallArgs = mockSpawn.mock.calls[0]?.[1] as string[]
      expect(spawnCallArgs).toContain("scan")
      expect(spawnCallArgs).toContain("--inline-rules")
      expect(spawnCallArgs).toContain("--json=stream")
      expect(spawnCallArgs).toContain("src")
      expect(spawnCallArgs).toContain("--include")
      expect(spawnCallArgs).toContain("*.ts")
    })
  })

  describe("handlePartial", () => {
    it("should send partial message to task", async () => {
      const mockAsk = vi.fn().mockResolvedValue(undefined)
      mockTask.ask = mockAsk

      await tool.handlePartial(mockTask as Task, {
        type: "tool_use",
        name: "ast_grep",
        params: {
          query: "console.log",
        },
        partial: true,
      })

      expect(mockAsk).toHaveBeenCalledWith("tool", expect.stringContaining("console.log"), true)
    })
  })

  describe("parseSgOutput", () => {
    it("should parse JSON output from sg", () => {
      const output = JSON.stringify({
        file: "src/test.ts",
        lines: "console.log('hello')",
      })

      const parsed = (tool as any).parseSgOutput(output)

      expect(parsed).toHaveLength(1)
      expect(parsed[0].path).toBe("src/test.ts")
      expect(parsed[0].text).toBe("console.log('hello')")
    })

    it("should handle multiple JSON lines", () => {
      const output = `${JSON.stringify({ file: "src/a.ts", lines: "code1" })}
${JSON.stringify({ file: "src/b.ts", lines: "code2" })}`

      const parsed = (tool as any).parseSgOutput(output)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].path).toBe("src/a.ts")
      expect(parsed[1].path).toBe("src/b.ts")
    })

    it("should fallback to plain text on parse error", () => {
      const output = "This is not JSON"

      const parsed = (tool as any).parseSgOutput(output)

      expect(parsed).toHaveLength(1)
      expect(parsed[0].text).toBe("This is not JSON")
    })
  })

  describe("formatResults", () => {
    it("should format results with header and body", () => {
      const matches = [
        { path: "src/a.ts", text: "code1" },
        { path: "src/b.ts", text: "code2" },
      ]

      const formatted = (tool as any).formatResults(matches, "test pattern")

      expect(formatted).toContain("AST Grep Results")
      expect(formatted).toContain("test pattern")
      expect(formatted).toContain("Total matches: 2")
      expect(formatted).toContain("src/a.ts")
      expect(formatted).toContain("src/b.ts")
    })

    it("should handle single match", () => {
      const matches = [{ path: "src/single.ts", text: "single code" }]

      const formatted = (tool as any).formatResults(matches, "single pattern")

      expect(formatted).toContain("Total matches: 1")
      expect(formatted).toContain("src/single.ts")
      expect(formatted).toContain("single code")
    })
  })
})
