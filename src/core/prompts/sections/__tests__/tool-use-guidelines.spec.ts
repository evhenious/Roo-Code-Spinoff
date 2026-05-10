import { getToolUseGuidelinesSection } from "../tool-use-guidelines"

describe("getToolUseGuidelinesSection", () => {
	it("should return empty string (guidelines section removed)", () => {
		const guidelines = getToolUseGuidelinesSection()
		expect(guidelines).toBe("")
	})
})
