type GeminiGenerateTextInput = {
  system: string
  user: string
}

type GeminiGenerateTextOptions = {
  responseMimeType?: "text/plain" | "application/json"
  maxOutputTokens?: number
  temperature?: number
}

let cachedModelId: string | null = null
let cachedAt = 0

function normalizeModelId(nameOrId: string): string {
  return nameOrId.startsWith("models/") ? nameOrId.slice("models/".length) : nameOrId
}

async function listModels(apiKey: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, { method: "GET" })
  if (!res.ok) return []
  const json = await res.json().catch(() => null)
  const models = Array.isArray(json?.models) ? json.models : []

  const candidates = models
    .filter((m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m: any) => String(m?.name || ""))
    .filter(Boolean)
    .map(normalizeModelId)

  // prefer "flash", depois "pro", depois qualquer
  const flash = candidates.filter((m) => /flash/i.test(m))
  const pro = candidates.filter((m) => /pro/i.test(m))
  const other = candidates.filter((m) => !/flash|pro/i.test(m))

  return [...new Set([...flash, ...pro, ...other])]
}

async function resolveModelId(apiKey: string): Promise<string> {
  const now = Date.now()
  if (cachedModelId && now - cachedAt < 10 * 60 * 1000) return cachedModelId

  const envModel = process.env.GEMINI_MODEL
  if (envModel && envModel.trim()) {
    cachedModelId = normalizeModelId(envModel.trim())
    cachedAt = now
    return cachedModelId
  }

  // fallback: buscar modelos disponíveis pela própria API (evita suposições)
  const list = await listModels(apiKey)
  cachedModelId = list[0] || "gemini-1.5-flash"
  cachedAt = now
  return cachedModelId
}

export async function geminiGenerateText(input: GeminiGenerateTextInput): Promise<string> {
  return geminiGenerateTextWithOptions(input, {})
}

export async function geminiGenerateTextWithOptions(
  input: GeminiGenerateTextInput,
  opts: GeminiGenerateTextOptions,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada")
  }

  const primaryModel = await resolveModelId(apiKey)
  const fallbackModels = [
    primaryModel,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
  ].map(normalizeModelId)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    let lastErr: any = null

    for (const modelId of fallbackModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: input.system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.user }],
            },
          ],
          generationConfig: {
            temperature: typeof opts.temperature === "number" ? opts.temperature : 0.4,
            topP: 0.9,
            maxOutputTokens: typeof opts.maxOutputTokens === "number" ? opts.maxOutputTokens : 600,
            ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
          },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        // se o modelo não existe, tenta o próximo (e invalida cache)
        if (res.status === 404) {
          cachedModelId = null
          cachedAt = 0
          // tenta repopular lista uma vez antes de continuar
          const discovered = await listModels(apiKey)
          if (discovered.length) {
            const merged = [...new Set([...discovered, ...fallbackModels])]
            fallbackModels.splice(0, fallbackModels.length, ...merged)
          }
        }
        lastErr = new Error(`Gemini falhou (${res.status}) no modelo ${modelId}: ${text}`)
        continue
      }

      const json = await res.json().catch(() => null)
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && typeof text === "string") {
        cachedModelId = modelId
        cachedAt = Date.now()
        return text.trim()
      }

      lastErr = new Error(`Resposta do Gemini sem texto (modelo ${modelId})`)
    }

    throw lastErr || new Error("Gemini falhou: sem modelos disponíveis")
  } finally {
    clearTimeout(timeout)
  }
}



