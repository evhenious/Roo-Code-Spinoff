import { getSharedToolUseSection } from "../tool-use"

describe("getSharedToolUseSection", () => {
	it("should include native tool-calling instructions", () => {
		const section = getSharedToolUseSection()

		expect(section).toContain("provider-native tool-calling mechanism")
		// "Do not include XML markup or examples" was removed from the tool use section
	})

	it("should include multiple tools per message guidance", () => {
		const section = getSharedToolUseSection()

		expect(section).toContain("You must call at least one tool per response")
		// "Prefer calling as many tools as are reasonably needed" was removed from the tool use section
	})

	it("should NOT include single tool per message restriction", () => {
		const section = getSharedToolUseSection()

		expect(section).not.toContain("You must use exactly one tool call per assistant response")
		expect(section).not.toContain("Do not call zero tools or more than one tool")
	})

	it("should NOT include XML formatting instructions", () => {
		const section = getSharedToolUseSection()

		expect(section).not.toContain("<actual_tool_name>")
		expect(section).not.toContain("</actual_tool_name>")
	})
})
