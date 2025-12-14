import crypto from "crypto"

type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
}

function parseCloudinaryUrl(url: string): { cloudName: string; apiKey: string; apiSecret: string } {
  // cloudinary://<api_key>:<api_secret>@<cloud_name>
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/)
  if (!m) throw new Error("CLOUDINARY_URL inválida")
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] }
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  if (!cloudinaryUrl) throw new Error("CLOUDINARY_URL não configurada")
  const parsed = parseCloudinaryUrl(cloudinaryUrl)
  const apiSecret = process.env.CLOUDINARY_API_SECRET || parsed.apiSecret
  return { cloudName: parsed.cloudName, apiKey: parsed.apiKey, apiSecret }
}

export function cloudinarySign(params: Record<string, string | number | undefined | null>, apiSecret: string): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b))

  const toSign = entries.map(([k, v]) => `${k}=${v}`).join("&") + apiSecret
  return crypto.createHash("sha1").update(toSign).digest("hex")
}



