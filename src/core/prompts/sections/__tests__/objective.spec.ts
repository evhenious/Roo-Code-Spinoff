import { getObjectiveSection } from "../objective"

describe("getObjectiveSection", () => {
	it("should return updated objective section", () => {
		const objective = getObjectiveSection()

		expect(objective).toContain("====")
		expect(objective).toContain("OBJECTIVE")
		expect(objective).toContain("You accomplish tasks iteratively. Follow this workflow:")
		expect(objective).toContain("1. **Analyze** the task")
		expect(objective).toContain("2. **Plan** your approach")
		expect(objective).toContain("3. **Complete** with attempt_completion")
	})
})
