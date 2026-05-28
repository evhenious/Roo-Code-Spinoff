import path from "path"

import delay from "delay"
import pWaitFor from "p-wait-for"
import * as vscode from "vscode"

import type { ExperimentId } from "@roo-code/types"

import { Terminal } from "../../integrations/terminal/Terminal"
import { TerminalRegistry } from "../../integrations/terminal/TerminalRegistry"
import { formatLanguage } from "../../shared/language"
import { defaultModeSlug, getFullModeDetails } from "../../shared/modes"
import { getGitStatus } from "../../utils/git"

import { Task } from "../task/Task"
import { formatReminderSection } from "./reminder"

export async function getEnvironmentDetails(
  cline: Task,
  includeFileDetails: boolean = false,
  includeEverything: boolean = false,
  modeChanged: boolean = true,
) {
  let details = ""

  const clineProvider = cline.providerRef.deref()
  const state = await clineProvider?.getState()
  const { maxWorkspaceFiles = 200 } = state ?? {}

  // It could be useful for cline to know if the user went from one or no
  // file to another between messages, so we always include this context.
  const visibleFilePaths = vscode.window.visibleTextEditors
    ?.map((editor) => editor.document?.uri?.fsPath)
    .filter(Boolean)
    .map((absolutePath) => path.relative(cline.cwd, absolutePath))
    .slice(0, maxWorkspaceFiles)

  // Filter paths through rooIgnoreController
  const allowedVisibleFiles = cline.rooIgnoreController
    ? cline.rooIgnoreController.filterPaths(visibleFilePaths)
    : visibleFilePaths.map((p) => p.toPosix()).join("\n")

  if (allowedVisibleFiles) {
    details += "\n\n# VSCode Visible Files"
    details += `\n${allowedVisibleFiles}`
  }

  const { maxOpenTabsContext } = state ?? {}
  const maxTabs = maxOpenTabsContext ?? 20
  const openTabPaths = vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .filter((tab) => tab.input instanceof vscode.TabInputText)
    .map((tab) => (tab.input as vscode.TabInputText).uri.fsPath)
    .filter(Boolean)
    .map((absolutePath) => path.relative(cline.cwd, absolutePath).toPosix())
    .slice(0, maxTabs)

  // Filter paths through rooIgnoreController
  const allowedOpenTabs = cline.rooIgnoreController
    ? cline.rooIgnoreController.filterPaths(openTabPaths)
    : openTabPaths.map((p) => p.toPosix()).join("\n")

  if (allowedOpenTabs) {
    details += "\n\n# VSCode Open Tabs"
    details += `\n${allowedOpenTabs}`
  }

  // Get task-specific and background terminals.
  const busyTerminals = [
    ...TerminalRegistry.getTerminals(true, cline.taskId),
    ...TerminalRegistry.getBackgroundTerminals(true),
  ]

  const inactiveTerminals = [
    ...TerminalRegistry.getTerminals(false, cline.taskId),
    ...TerminalRegistry.getBackgroundTerminals(false),
  ]

  if (busyTerminals.length > 0) {
    if (cline.didEditFile) {
      await delay(300) // Delay after saving file to let terminals catch up.
    }

    // Wait for terminals to cool down.
    await pWaitFor(() => busyTerminals.every((t) => !TerminalRegistry.isProcessHot(t.id)), {
      interval: 100,
      timeout: 5_000,
    }).catch(() => {})
  }

  // Reset, this lets us know when to wait for saved files to update terminals.
  cline.didEditFile = false

  // Waiting for updated diagnostics lets terminal output be the most
  // up-to-date possible.
  let terminalDetails = ""

  if (busyTerminals.length > 0) {
    // Terminals are cool, let's retrieve their output.
    terminalDetails += "\n\n# Actively Running Terminals"

    for (const busyTerminal of busyTerminals) {
      const cwd = busyTerminal.getCurrentWorkingDirectory()
      terminalDetails += `\n## Terminal ${busyTerminal.id} (Active)`
      terminalDetails += `\n### Working Directory: \`${cwd}\``
      terminalDetails += `\n### Original command: \`${busyTerminal.getLastCommand()}\``
      let newOutput = TerminalRegistry.getUnretrievedOutput(busyTerminal.id)

      if (newOutput) {
        newOutput = Terminal.compressTerminalOutput(newOutput)
        terminalDetails += `\n### New Output\n${newOutput}`
      }
    }
  }

  // First check if any inactive terminals in this task have completed
  // processes with output.
  const terminalsWithOutput = inactiveTerminals.filter((terminal) => {
    const completedProcesses = terminal.getProcessesWithOutput()
    return completedProcesses.length > 0
  })

  // Only add the header if there are terminals with output.
  if (terminalsWithOutput.length > 0) {
    terminalDetails += "\n\n# Inactive Terminals with Completed Process Output"

    // Process each terminal with output.
    for (const inactiveTerminal of terminalsWithOutput) {
      let terminalOutputs: string[] = []

      // Get output from completed processes queue.
      const completedProcesses = inactiveTerminal.getProcessesWithOutput()

      for (const process of completedProcesses) {
        let output = process.getUnretrievedOutput()

        if (output) {
          output = Terminal.compressTerminalOutput(output)
          terminalOutputs.push(`Command: \`${process.command}\`\n${output}`)
        }
      }

      // Clean the queue after retrieving output.
      inactiveTerminal.cleanCompletedProcessQueue()

      // Add this terminal's outputs to the details.
      if (terminalOutputs.length > 0) {
        const cwd = inactiveTerminal.getCurrentWorkingDirectory()
        terminalDetails += `\n## Terminal ${inactiveTerminal.id} (Inactive)`
        terminalDetails += `\n### Working Directory: \`${cwd}\``
        terminalOutputs.forEach((output) => {
          terminalDetails += `\n### New Output\n${output}`
        })
      }
    }
  }

  // console.log(`[Task#getEnvironmentDetails] terminalDetails: ${terminalDetails}`)

  // Add recently modified files section.
  const recentlyModifiedFiles = cline.fileContextTracker.getAndClearRecentlyModifiedFiles()

  if (recentlyModifiedFiles.length > 0) {
    details +=
      "\n\n# Recently Modified Files\nThese files have been modified since you last accessed them, so you may need to re-read them before editing:"
    for (const filePath of recentlyModifiedFiles) {
      details += `\n${filePath}`
    }
  }

  if (terminalDetails) {
    details += terminalDetails
  }

  // Get settings for time and cost display
  const { includeCurrentTime = true, maxGitStatusFiles = 0 } = state ?? {}

  // Add current time information with timezone (if enabled).
  if (includeCurrentTime && includeEverything) {
    const now = new Date()

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const timeZoneOffset = -now.getTimezoneOffset() / 60 // Convert to hours and invert sign to match conventional notation
    const timeZoneOffsetHours = Math.floor(Math.abs(timeZoneOffset))
    const timeZoneOffsetMinutes = Math.abs(Math.round((Math.abs(timeZoneOffset) - timeZoneOffsetHours) * 60))
    const timeZoneOffsetStr = `${timeZoneOffset >= 0 ? "+" : "-"}${timeZoneOffsetHours}:${timeZoneOffsetMinutes.toString().padStart(2, "0")}`
    details += `\n\n# Current Time\nCurrent time in ISO 8601 UTC format: ${now.toISOString()}\nUser time zone: ${timeZone}, UTC${timeZoneOffsetStr}`
  }

  // Add git status information (if enabled with maxGitStatusFiles > 0).
  if (maxGitStatusFiles > 0 && includeEverything) {
    const gitStatus = await getGitStatus(cline.cwd, maxGitStatusFiles)
    if (gitStatus) {
      details += `\n\n# Git Status\n${gitStatus}`
    }
  }

  // Add current mode and any mode-specific warnings.
  const {
    mode,
    customModes,
    customModePrompts,
    experiments = {} as Record<ExperimentId, boolean>,
    customInstructions: globalCustomInstructions,
    language,
  } = state ?? {}

  if (modeChanged) {
    const currentMode = mode ?? defaultModeSlug

    const modeDetails = await getFullModeDetails(currentMode, customModes, customModePrompts, {
      cwd: cline.cwd,
      globalCustomInstructions,
      language: language ?? formatLanguage(vscode.env.language),
    })

    details += `\n\n# Current Mode\n`
    details += `<slug>${currentMode}</slug>\n`
    details += `<name>${modeDetails.name}</name>\n`
  }

  if (includeFileDetails && includeEverything) {
    details += `\n\n# Current Workspace Directory (${cline.cwd.toPosix()})\n`
    details += "Use the list_files tool to explore workspace files if needed."
  }

  const todoListEnabled =
    state && typeof state.apiConfiguration?.todoListEnabled === "boolean"
      ? state.apiConfiguration.todoListEnabled
      : true
  const reminderSection = todoListEnabled ? formatReminderSection(cline.todoList) : ""
  return `<environment_details>\n${details.trim()}\n${reminderSection}\n</environment_details>`
}
