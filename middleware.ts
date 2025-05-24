import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Importar apenas as funções necessárias para evitar problemas de compilação
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Implementar funções básicas diretamente no middleware para evitar dependências circulares
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (cfConnectingIP) return cfConnectingIP.split(",")[0].trim()
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  if (realIP) return realIP

  return request.ip || "unknown"
}

function isIPBlocked(ip: string): boolean {
  const blockedIPs = ["0.0.0.0"]
  return blockedIPs.includes(ip) || ip === "unknown" || ip === ""
}

function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || ""

  if (!userAgent || userAgent.length < 10) return true

  const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i]
  return suspiciousPatterns.some((pattern) => pattern.test(userAgent))
}

// Rate limiting simples
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; resetTime?: number; message?: string } {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const limit = endpoint.includes("/auth/") ? 3 : 10
  const window = 60000 // 1 minuto

  const entry = rateLimitMap.get(key)

  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + window })
    return { allowed: true }
  }

  entry.count++

  if (entry.count > limit) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
    }
  }

  return { allowed: true }
}

// CSRF simples
const csrfTokens = new Map<string, { token: string; expires: number }>()

function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!token) return false

  const key = `${sessionId}:${token}`
  const entry = csrfTokens.get(key)

  if (!entry || Date.now() > entry.expires) {
    csrfTokens.delete(key)
    return false
  }

  return true
}

// Rotas que requerem autenticação
const PROTECTED_ROUTES = ["/api/forms", "/api/dashboard", "/api/export"]
const CSRF_PROTECTED_ROUTES = ["/api/forms", "/api/submissions", "/api/auth/login", "/api/auth/register"]
const RATE_LIMITED_ROUTES = ["/api/submissions", "/api/forms", "/api/auth/login", "/api/auth/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = getClientIP(request)

  console.log(`[MIDDLEWARE] ${request.method} ${pathname} - IP: ${clientIP}`)

  try {
    // 1. Verificação de IP bloqueado
    if (isIPBlocked(clientIP)) {
      console.log(`[SECURITY] IP bloqueado: ${clientIP}`)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // 2. Detecção de atividade suspeita
    if (detectSuspiciousActivity(request)) {
      console.log(`[SECURITY] Atividade suspeita detectada: ${clientIP}`)
      return NextResponse.json({ error: "Suspicious activity detected" }, { status: 403 })
    }

    // 3. Rate Limiting
    if (RATE_LIMITED_ROUTES.some((route) => pathname.startsWith(route))) {
      const limitCheck = checkRateLimit(clientIP, pathname)

      if (!limitCheck.allowed) {
        console.log(`[RATE_LIMIT] Limite excedido para ${clientIP} em ${pathname}`)
        return NextResponse.json(
          {
            error: limitCheck.message,
            resetTime: limitCheck.resetTime,
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(((limitCheck.resetTime || 0) - Date.now()) / 1000).toString(),
            },
          },
        )
      }
    }

    // 4. Proteção CSRF para métodos de mutação
    if (
      (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") &&
      CSRF_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
    ) {
      const csrfToken = request.headers.get("x-csrf-token")

      if (!csrfToken) {
        console.log(`[CSRF] Token CSRF ausente para ${pathname}`)
        return NextResponse.json({ error: "CSRF token required" }, { status: 403 })
      }

      // Validação simplificada do CSRF
      if (!validateCSRFToken(csrfToken, clientIP)) {
        console.log(`[CSRF] Token CSRF inválido para ${pathname}`)
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
      }
    }

    // 5. Verificação de autenticação
    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
      const token = request.cookies.get("auth-token")?.value

      if (!token) {
        console.log(`[AUTH] Token de autenticação ausente para ${pathname}`)
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log(`[AUTH] Usuário autenticado: ${decoded.email}`)

        const response = NextResponse.next()
        response.headers.set("x-user-id", decoded.userId)
        response.headers.set("x-user-email", decoded.email)
        response.headers.set("x-user-role", decoded.role)

        return response
      } catch (error) {
        console.log(`[AUTH] Token JWT inválido para ${pathname}`)
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    // 6. Headers de segurança para todas as respostas
    const response = NextResponse.next()

    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://viacep.com.br https://www.receitaws.com.br",
      "frame-ancestors 'none'",
    ].join("; ")

    response.headers.set("Content-Security-Policy", csp)

    if (process.env.NODE_ENV === "production") {
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }

    return response
  } catch (error) {
    console.error(`[MIDDLEWARE] Erro no middleware:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
