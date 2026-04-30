import { IExtensionStore } from "@/store/defaultState"
import type { ExperimentId } from "@roo-code/types"

export type SetCachedStateField<K extends keyof IExtensionStore> = (field: K, value: IExtensionStore[K]) => void

export type SetExperimentEnabled = (id: ExperimentId, enabled: boolean) => void
