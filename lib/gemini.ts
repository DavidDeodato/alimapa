type GeminiGenerateTextInput = {
  system: string
  user: string
}

export async function geminiGenerateText(input: GeminiGenerateTextInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada")
  }

  // Model choice: keep stable/default. If it fails, caller should fallback.
  const model = "gemini-1.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${input.system}\n\n---\n\n${input.user}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 300,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Gemini falhou (${res.status}): ${text}`)
    }

    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text || typeof text !== "string") throw new Error("Resposta do Gemini sem texto")
    return text.trim()
  } finally {
    clearTimeout(timeout)
  }
}



