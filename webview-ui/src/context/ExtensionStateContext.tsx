import React, { useEffect } from "react"

import { useExtensionStateStore, mergeExtensionState } from "@src/store/useExtensionStateStore"

// Re-export mergeExtensionState for backward compatibility with tests
export { mergeExtensionState }

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const handleMessage = useExtensionStateStore((state) => state.handleMessage)
	const initialize = useExtensionStateStore((state) => state.initialize)

	// Set up message listener on mount
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			handleMessage(event)
		}

		window.addEventListener("message", handler)
		return () => {
			window.removeEventListener("message", handler)
		}
	}, [handleMessage])

	// Initialize webview on mount
	useEffect(() => {
		initialize()
	}, [initialize])

	return <>{children}</>
}

export const useExtensionState = () => {
	return useExtensionStateStore()
}
