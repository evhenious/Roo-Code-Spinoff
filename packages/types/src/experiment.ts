import { z } from "zod"

import type { Keys, Equals, AssertEqual } from "./type-fu.js"

/**
 * Experiments
 */

export const experimentsSchema = z.object({
	preventFocusDisruption: z.boolean().optional().default(true),
	imageGeneration: z.boolean().optional().default(false),
	runSlashCommand: z.boolean().optional().default(false),
	customTools: z.boolean().optional().default(false),
})

export type Experiments = z.infer<typeof experimentsSchema>

/**
 * ExperimentId
 */

export const experimentIdsSchema = experimentsSchema.keyof()

export type ExperimentId = z.infer<typeof experimentIdsSchema>

type _AssertExperiments = AssertEqual<Equals<ExperimentId, Keys<Experiments>>>
