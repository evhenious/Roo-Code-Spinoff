/**
 * createCommand Handler
 *
 * Handles the "createCommand" message type - creates a command.
 */

import * as os from "os"
import * as path from "path"
import * as fs from "fs/promises"
import * as vscode from "vscode"
import { t } from "../../../../i18n"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { openFile } from "../../../../integrations/misc/open-file"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("createCommand", message)
  const { text, values } = validated

  try {
    const source = values?.source as "global" | "project"
    const fileName = text // Custom filename from user input

    if (!source) {
      ctx.log("Missing source for createCommand")
      return
    }

    // Determine the commands directory based on source
    let commandsDir: string
    if (source === "global") {
      const globalConfigDir = path.join(os.homedir(), ".roo")
      commandsDir = path.join(globalConfigDir, "commands")
    } else {
      // Project commands
      const workspaceRoot = ctx.provider.getCurrentTask()?.cwd || ctx.provider.cwd
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(t("common:errors.no_workspace_for_project_command"))
        return
      }
      commandsDir = path.join(workspaceRoot, ".roo", "commands")
    }

    // Ensure the commands directory exists
    await fs.mkdir(commandsDir, { recursive: true })

    // Use provided filename or generate a unique one
    let commandName: string
    if (fileName && fileName.trim()) {
      let cleanFileName = fileName.trim()

      // Strip leading slash if present
      if (cleanFileName.startsWith("/")) {
        cleanFileName = cleanFileName.substring(1)
      }

      // Remove .md extension if present BEFORE slugification
      if (cleanFileName.toLowerCase().endsWith(".md")) {
        cleanFileName = cleanFileName.slice(0, -3)
      }

      // Slugify the command name: lowercase, replace spaces with dashes, remove special characters
      commandName = cleanFileName
        .toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with dashes
        .replace(/[^a-z0-9-]/g, "") // Remove special characters except dashes
        .replace(/-+/g, "-") // Replace multiple dashes with single dash
        .replace(/^-|-$/g, "") // Remove leading/trailing dashes

      // Ensure we have a valid command name
      if (!commandName || commandName.length === 0) {
        commandName = "new-command"
      }
    } else {
      // Generate a unique command name
      commandName = "new-command"
      let counter = 1
      let filePath = path.join(commandsDir, `${commandName}.md`)

      while (
        await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false)
      ) {
        commandName = `new-command-${counter}`
        filePath = path.join(commandsDir, `${commandName}.md`)
        counter++
      }
    }

    const filePath = path.join(commandsDir, `${commandName}.md`)

    // Check if file already exists
    if (
      await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false)
    ) {
      vscode.window.showErrorMessage(t("common:errors.command_already_exists", { commandName }))
      return
    }

    // Create the command file with template content
    const templateContent = t("common:errors.command_template_content")

    await fs.writeFile(filePath, templateContent, "utf8")
    ctx.log(`Created new command file: ${filePath}`)

    // Open the new file in the editor
    openFile(filePath)

    // Refresh commands list
    const { getCommands } = await import("../../../../services/command/commands")
    const commands = await getCommands(ctx.provider.getCurrentTask()?.cwd || "")
    const commandList = commands.map((command) => ({
      name: command.name,
      source: command.source,
      filePath: command.filePath,
      description: command.description,
      argumentHint: command.argumentHint,
    }))
    ctx.postMessage({
      type: "commands",
      commands: commandList,
    })
  } catch (error) {
    ctx.log(`Error creating command: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
    vscode.window.showErrorMessage(t("common:errors.create_command_failed"))
  }
}

export const createCommandHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error creating command: ${errorMessage}`)
  }
}
