/**
 * updateSettings Handler
 *
 * Handles the "updateSettings" message type - updates multiple settings at once.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import { Package } from "../../../../shared/package"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { changeLanguage } from "../../../../i18n"
import { Terminal } from "../../../../integrations/terminal/Terminal"
import { experimentDefault } from "../../../../shared/experiments"

/**
 * Handler for updateSettings messages.
 * Updates multiple settings at once based on the updatedSettings object.
 */
export const updateSettingsHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("updateSettings", message)
  const { updatedSettings } = validated

  if (updatedSettings) {
    for (const [key, value] of Object.entries(updatedSettings)) {
      let newValue = value

      if (key === "language") {
        newValue = value ?? "en"
        changeLanguage(newValue as any)
      } else if (key === "allowedCommands") {
        const commands = value ?? []
        newValue = Array.isArray(commands)
          ? commands.filter((cmd) => typeof cmd === "string" && cmd.trim().length > 0)
          : []

        await vscode.workspace
          .getConfiguration(Package.name)
          .update("allowedCommands", newValue, vscode.ConfigurationTarget.Global)
      } else if (key === "deniedCommands") {
        const commands = value ?? []
        newValue = Array.isArray(commands)
          ? commands.filter((cmd) => typeof cmd === "string" && cmd.trim().length > 0)
          : []

        await vscode.workspace
          .getConfiguration(Package.name)
          .update("deniedCommands", newValue, vscode.ConfigurationTarget.Global)
      } else if (key === "terminalShellIntegrationTimeout") {
        if (value !== undefined) {
          Terminal.setShellIntegrationTimeout(value as number)
        }
      } else if (key === "terminalShellIntegrationDisabled") {
        if (value !== undefined) {
          Terminal.setShellIntegrationDisabled(value as boolean)
        }
      } else if (key === "terminalCommandDelay") {
        if (value !== undefined) {
          Terminal.setCommandDelay(value as number)
        }
      } else if (key === "terminalPowershellCounter") {
        if (value !== undefined) {
          Terminal.setPowershellCounter(value as boolean)
        }
      } else if (key === "terminalZshClearEolMark") {
        if (value !== undefined) {
          Terminal.setTerminalZshClearEolMark(value as boolean)
        }
      } else if (key === "terminalZshOhMy") {
        if (value !== undefined) {
          Terminal.setTerminalZshOhMy(value as boolean)
        }
      } else if (key === "terminalZshP10k") {
        if (value !== undefined) {
          Terminal.setTerminalZshP10k(value as boolean)
        }
      } else if (key === "terminalZdotdir") {
        if (value !== undefined) {
          Terminal.setTerminalZdotdir(value as boolean)
        }
      } else if (key === "execaShellPath") {
        Terminal.setExecaShellPath(value as string | undefined)
      } else if (key === "mcpEnabled") {
        newValue = value ?? true
        const mcpHub = ctx.provider.getMcpHub()
        if (mcpHub) {
          await mcpHub.handleMcpEnabledChange(newValue as boolean)
        }
      } else if (key === "experiments") {
        if (!value) {
          continue
        }
        newValue = {
          ...((await ctx.getState("experiments")) ?? experimentDefault),
          ...(value as Record<string, boolean>),
        }
      } else if (key === "customSupportPrompts") {
        if (!value) {
          continue
        }
      }

      await ctx.provider.contextProxy.setValue(key as any, newValue)
    }

    await ctx.provider.postStateToWebview()
  }
}
