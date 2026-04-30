import { ExtensionStateContextType } from "@/context/stateContextDef"
import type { ExperimentId } from "@roo-code/types"

export type SetCachedStateField<K extends keyof ExtensionStateContextType> = (
	field: K,
	value: ExtensionStateContextType[K],
) => void

export type SetExperimentEnabled = (id: ExperimentId, enabled: boolean) => void
