import type OpenAI from "openai"

const GENERATE_IMAGE_DESCRIPTION = `Request to generate or edit an image using AI models through OpenRouter API.
This tool can create new images from text prompts or modify existing images based on your instructions.
When an input image is provided, the AI will apply the requested edits, transformations, or enhancements to that image.`

const PROMPT_PARAMETER_DESCRIPTION = `Text description of the image to generate or the edits to apply`

const PATH_PARAMETER_DESCRIPTION = `Filesystem path (relative to the workspace) where the resulting image should be saved`

const IMAGE_PARAMETER_DESCRIPTION = `Optional path (relative to the workspace) to an existing image to edit; supports PNG, JPG, JPEG, GIF, and WEBP`

export default {
  type: "function",
  function: {
    name: "generate_image",
    description: GENERATE_IMAGE_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: PROMPT_PARAMETER_DESCRIPTION,
        },
        path: {
          type: "string",
          description: PATH_PARAMETER_DESCRIPTION,
        },
        image: {
          type: ["string", "null"],
          description: IMAGE_PARAMETER_DESCRIPTION,
        },
      },
      required: ["prompt", "path", "image"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
