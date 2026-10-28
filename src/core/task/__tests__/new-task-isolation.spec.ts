/**
 * Tests for spawn_subtask tool isolation enforcement.
 *
 * These tests verify the runtime enforcement that prevents tools from executing
 * after `spawn_subtask` in parallel tool calls. When `spawn_subtask` is called alongside
 * other tools, any tools that come after it in the assistant message are truncated
 * and their tool_results are pre-injected with error messages.
 *
 * This prevents orphaned tools when delegation disposes the parent task.
 */

import type { Anthropic } from "@anthropic-ai/sdk"

describe("spawn_subtask Tool Isolation Enforcement", () => {
  /**
   * Simulates the spawn_subtask isolation enforcement logic from Task.ts.
   * This tests the truncation and error injection that happens when building
   * assistant message content for the API.
   */
  const enforceNewTaskIsolation = (
    assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam>,
  ): {
    truncatedContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam>
    injectedToolResults: Anthropic.ToolResultBlockParam[]
  } => {
    const injectedToolResults: Anthropic.ToolResultBlockParam[] = []

    // Find the index of spawn_subtask tool in the assistantContent array
    const newTaskIndex = assistantContent.findIndex(
      (block) => block.type === "tool_use" && block.name === "spawn_subtask",
    )

    if (newTaskIndex !== -1 && newTaskIndex < assistantContent.length - 1) {
      // spawn_subtask found but not last - truncate subsequent tools
      const truncatedTools = assistantContent.slice(newTaskIndex + 1)
      const truncatedContent = assistantContent.slice(0, newTaskIndex + 1)

      // Pre-inject error tool_results for truncated tools
      for (const tool of truncatedTools) {
        if (tool.type === "tool_use" && tool.id) {
          injectedToolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content:
              "This tool was not executed because spawn_subtask was called in the same message turn. The spawn_subtask tool must be the last tool in a message.",
            is_error: true,
          })
        }
      }

      return { truncatedContent, injectedToolResults }
    }

    return { truncatedContent: assistantContent, injectedToolResults: [] }
  }

  describe("spawn_subtask as last tool (no truncation needed)", () => {
    it("should not truncate when spawn_subtask is the only tool", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(1)
      expect(result.injectedToolResults).toHaveLength(0)
    })

    it("should not truncate when spawn_subtask is the last tool", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(2)
      expect(result.injectedToolResults).toHaveLength(0)
    })

    it("should not truncate when there is no spawn_subtask tool", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
        {
          type: "tool_use",
          id: "toolu_write_1",
          name: "write_to_file",
          input: { path: "test.txt", content: "hello" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(2)
      expect(result.injectedToolResults).toHaveLength(0)
    })
  })

  describe("spawn_subtask followed by other tools (truncation required)", () => {
    it("should truncate tools after spawn_subtask", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(1)
      expect(result.truncatedContent[0].type).toBe("tool_use")
      expect((result.truncatedContent[0] as Anthropic.ToolUseBlockParam).name).toBe("spawn_subtask")
    })

    it("should inject error tool_results for truncated tools", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.injectedToolResults).toHaveLength(1)
      expect(result.injectedToolResults[0]).toMatchObject({
        type: "tool_result",
        tool_use_id: "toolu_read_1",
        is_error: true,
      })
      expect(result.injectedToolResults[0].content).toContain("spawn_subtask was called")
    })

    it("should truncate multiple tools after spawn_subtask", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
        {
          type: "tool_use",
          id: "toolu_write_1",
          name: "write_to_file",
          input: { path: "test.txt", content: "hello" },
        },
        {
          type: "tool_use",
          id: "toolu_execute_1",
          name: "execute_command",
          input: { command: "ls" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(1)
      expect(result.injectedToolResults).toHaveLength(3)

      // Verify all truncated tools get error results
      const truncatedIds = result.injectedToolResults.map((r) => r.tool_use_id)
      expect(truncatedIds).toContain("toolu_read_1")
      expect(truncatedIds).toContain("toolu_write_1")
      expect(truncatedIds).toContain("toolu_execute_1")
    })

    it("should preserve tools before spawn_subtask", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_write_1",
          name: "write_to_file",
          input: { path: "test.txt", content: "hello" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      // Should preserve read_file and spawn_subtask, truncate write_to_file
      expect(result.truncatedContent).toHaveLength(2)
      expect((result.truncatedContent[0] as Anthropic.ToolUseBlockParam).name).toBe("read_file")
      expect((result.truncatedContent[1] as Anthropic.ToolUseBlockParam).name).toBe("spawn_subtask")

      // Should inject error for write_to_file only
      expect(result.injectedToolResults).toHaveLength(1)
      expect(result.injectedToolResults[0].tool_use_id).toBe("toolu_write_1")
    })
  })

  describe("Mixed content (text and tools)", () => {
    it("should handle text blocks before spawn_subtask", () => {
      const assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [
        {
          type: "text",
          text: "I will delegate this task.",
        },
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      // Should preserve text and spawn_subtask, truncate read_file
      expect(result.truncatedContent).toHaveLength(2)
      expect(result.truncatedContent[0].type).toBe("text")
      expect((result.truncatedContent[1] as Anthropic.ToolUseBlockParam).name).toBe("spawn_subtask")

      expect(result.injectedToolResults).toHaveLength(1)
      expect(result.injectedToolResults[0].tool_use_id).toBe("toolu_read_1")
    })

    it("should not count text blocks when checking if spawn_subtask is last tool", () => {
      // This is a subtle case - if text comes AFTER spawn_subtask, we need to decide
      // whether that counts as "spawn_subtask is last tool". The implementation only
      // checks array position, so text after spawn_subtask means spawn_subtask is NOT last.
      // However, text blocks don't need tool_results, so this is fine.
      const assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "text",
          text: "Done delegating.",
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      // Text after spawn_subtask gets truncated but doesn't need tool_result
      expect(result.truncatedContent).toHaveLength(1)
      expect(result.injectedToolResults).toHaveLength(0) // Text blocks don't get tool_results
    })
  })

  describe("Edge cases", () => {
    it("should handle empty content array", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = []

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(0)
      expect(result.injectedToolResults).toHaveLength(0)
    })

    it("should handle tool without id (should not inject error result)", () => {
      const assistantContent: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        // Simulating a malformed tool without ID (shouldn't happen, but defensive)
        {
          type: "tool_use",
          name: "read_file",
          input: { path: "test.txt" },
        } as any,
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.truncatedContent).toHaveLength(1)
      // No error result for tool without ID
      expect(result.injectedToolResults).toHaveLength(0)
    })

    it("should only consider the first spawn_subtask if multiple exist", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "First task" },
        },
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_2",
          name: "spawn_subtask",
          input: { mode: "debug", message: "Second task" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      // Should find first spawn_subtask and truncate everything after it
      expect(result.truncatedContent).toHaveLength(2)
      expect((result.truncatedContent[0] as Anthropic.ToolUseBlockParam).name).toBe("read_file")
      expect((result.truncatedContent[1] as Anthropic.ToolUseBlockParam).id).toBe("toolu_spawn_subtask_1")

      // Second spawn_subtask should get error result
      expect(result.injectedToolResults).toHaveLength(1)
      expect(result.injectedToolResults[0].tool_use_id).toBe("toolu_spawn_subtask_2")
    })
  })

  describe("Error message content", () => {
    it("should include descriptive error message", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.injectedToolResults[0].content).toContain("spawn_subtask was called")
      expect(result.injectedToolResults[0].content).toContain("must be the last tool")
    })

    it("should mark error results with is_error: true", () => {
      const assistantContent: Anthropic.ToolUseBlockParam[] = [
        {
          type: "tool_use",
          id: "toolu_spawn_subtask_1",
          name: "spawn_subtask",
          input: { mode: "code", message: "Do something" },
        },
        {
          type: "tool_use",
          id: "toolu_read_1",
          name: "read_file",
          input: { path: "test.txt" },
        },
      ]

      const result = enforceNewTaskIsolation(assistantContent)

      expect(result.injectedToolResults[0].is_error).toBe(true)
    })
  })
})
