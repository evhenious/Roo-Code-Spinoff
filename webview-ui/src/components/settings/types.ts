import { IExtensionStoreData } from "@/store/defaultState"
import type { ExperimentId } from "@roo-code/types"

export type SetCachedStateField<K extends keyof IExtensionStoreData> = (field: K, value: IExtensionStoreData[K]) => void

export type SetExperimentEnabled = (id: ExperimentId, enabled: boolean) => void
