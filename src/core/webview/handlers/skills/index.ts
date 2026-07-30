/**
 * Skill Handlers Index
 *
 * Exports all skill-related handlers.
 * These handlers delegate to existing functions in skillsMessageHandler.ts
 */

import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import {
  handleRequestSkills,
  handleCreateSkill,
  handleDeleteSkill,
  handleMoveSkill,
  handleUpdateSkillModes,
  handleOpenSkillFile,
} from "../../skillsMessageHandler"

export const requestSkillsHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleRequestSkills(ctx.provider)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error requesting skills: ${errorMessage}`)
  }
}

export const createSkillHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleCreateSkill(ctx.provider, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error creating skill: ${errorMessage}`)
  }
}

export const deleteSkillHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleDeleteSkill(ctx.provider, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error deleting skill: ${errorMessage}`)
  }
}

export const moveSkillHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleMoveSkill(ctx.provider, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error moving skill: ${errorMessage}`)
  }
}

export const updateSkillModesHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleUpdateSkillModes(ctx.provider, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error updating skill modes: ${errorMessage}`)
  }
}

export const openSkillFileHandler: MessageHandler = async (ctx, message) => {
  try {
    await handleOpenSkillFile(ctx.provider, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error opening skill file: ${errorMessage}`)
  }
}
