/**
 * Handler Registry
 *
 * Central registry that maps message types to their handlers.
 * This is the main entry point for message dispatch.
 */

import type { HandlerRegistry } from "../types/handlerTypes"
import { newTaskHandler } from "./task/newTask"

/**
 * Handler registry mapping message types to handler functions.
 * Currently only newTask is implemented; more handlers will be added as migration progresses.
 */
export const handlerRegistry: HandlerRegistry = {
  newTask: newTaskHandler,
}
