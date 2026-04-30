export const PRODUCTION_ROO_CODE_API_URL = "https://app.roocode.com"

export const getRooCodeApiUrl = () => process.env.ROO_CODE_API_URL || PRODUCTION_ROO_CODE_API_URL
