import crypto from "crypto"

export class CSRFService {
  private static instance: CSRFService
  private tokens = new Map<string, { token: string; expires: number }>()
  private readonly TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

  static getInstance(): CSRFService {
    if (!CSRFService.instance) {
      CSRFService.instance = new CSRFService()
    }
    return CSRFService.instance
  }

  generateToken(sessionId?: string): string {
    const token = crypto.randomBytes(32).toString("hex")
    const expires = Date.now() + this.TOKEN_EXPIRY

    const key = sessionId || "anonymous"
    this.tokens.set(key, { token, expires })

    // Clean up expired tokens
    this.cleanupExpiredTokens()

    return token
  }

  validateToken(token: string, sessionId?: string): boolean {
    try {
      if (!token || typeof token !== "string") {
        return false
      }

      const key = sessionId || "anonymous"
      const storedToken = this.tokens.get(key)

      if (!storedToken) {
        return false
      }

      // Check if token is expired
      if (Date.now() > storedToken.expires) {
        this.tokens.delete(key)
        return false
      }

      // Validate token using constant-time comparison
      return this.constantTimeCompare(token, storedToken.token)
    } catch (error) {
      console.error("CSRF token validation error:", error)
      return false
    }
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [key, value] of this.tokens.entries()) {
      if (now > value.expires) {
        this.tokens.delete(key)
      }
    }
  }

  revokeToken(sessionId?: string): void {
    const key = sessionId || "anonymous"
    this.tokens.delete(key)
  }

  revokeAllTokens(): void {
    this.tokens.clear()
  }
}
