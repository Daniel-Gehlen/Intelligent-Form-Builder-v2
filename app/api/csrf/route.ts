import { NextResponse } from "next/server"
import crypto from "crypto"

// CSRF simples sem dependências externas
const csrfTokens = new Map<string, { token: string; expires: number }>()

export async function GET() {
  try {
    const token = crypto.randomBytes(32).toString("hex")
    const expires = Date.now() + 3600000 // 1 hora

    // Usar um ID simples para a sessão
    const sessionId = "anonymous"
    csrfTokens.set(`${sessionId}:${token}`, { token, expires })

    return NextResponse.json({ token })
  } catch (error) {
    console.error("CSRF token generation error:", error)
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 })
  }
}
