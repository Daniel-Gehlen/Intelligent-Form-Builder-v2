/**
 * Sistema de Segurança Avançado
 * Implementa rate limiting, CSRF, detecção de atividades suspeitas e proteções gerais
 */

import type { NextRequest } from "next/server"
import crypto from "crypto"

// Interfaces para tipagem
interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

interface SecurityEvent {
  type: string
  ip: string
  timestamp: number
  details: any
}

/**
 * Rate Limiter com configurações específicas por endpoint
 */
export class RateLimiter {
  private static instance: RateLimiter
  private limits = new Map<string, RateLimitEntry>()
  private readonly configs = {
    // Configurações de rate limiting por endpoint
    "/api/submissions": { requests: 5, window: 60000 }, // 5 req/min
    "/api/auth/login": { requests: 3, window: 900000 }, // 3 req/15min
    "/api/auth/register": { requests: 2, window: 3600000 }, // 2 req/hour
    "/api/forms": { requests: 10, window: 60000 }, // 10 req/min
    default: { requests: 100, window: 60000 }, // 100 req/min padrão
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  /**
   * Verifica se uma requisição está dentro dos limites
   */
  checkLimit(
    ip: string,
    endpoint: string,
  ): {
    allowed: boolean
    remaining: number
    resetTime?: number
    message?: string
  } {
    const key = `${ip}:${endpoint}`
    const config = this.configs[endpoint] || this.configs.default
    const now = Date.now()

    let entry = this.limits.get(key)

    // Se não existe entrada ou o tempo resetou, criar nova
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.window,
        blocked: false,
      }
      this.limits.set(key, entry)
      return {
        allowed: true,
        remaining: config.requests - 1,
      }
    }

    // Incrementar contador
    entry.count++

    // Verificar se excedeu o limite
    if (entry.count > config.requests) {
      entry.blocked = true
      console.log(`[RATE_LIMIT] Limite excedido para ${ip} em ${endpoint}: ${entry.count}/${config.requests}`)

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
      }
    }

    return {
      allowed: true,
      remaining: config.requests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Bloqueia um IP temporariamente
   */
  blockIP(ip: string, duration = 3600000): void {
    // 1 hora por padrão
    const endpoints = Object.keys(this.configs)
    endpoints.forEach((endpoint) => {
      const key = `${ip}:${endpoint}`
      this.limits.set(key, {
        count: 999999,
        resetTime: Date.now() + duration,
        blocked: true,
      })
    })
    console.log(`[SECURITY] IP ${ip} bloqueado por ${duration / 1000} segundos`)
  }

  /**
   * Remove entradas expiradas para limpeza de memória
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime && !entry.blocked) {
        this.limits.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[RATE_LIMIT] Limpeza: ${cleaned} entradas removidas`)
    }
  }

  /**
   * Obtém estatísticas do rate limiter
   */
  getStats(): {
    totalEntries: number
    blockedIPs: number
    activeRequests: number
  } {
    const now = Date.now()
    let blockedIPs = 0
    let activeRequests = 0

    for (const entry of this.limits.values()) {
      if (entry.blocked && now < entry.resetTime) {
        blockedIPs++
      }
      if (now < entry.resetTime) {
        activeRequests++
      }
    }

    return {
      totalEntries: this.limits.size,
      blockedIPs,
      activeRequests,
    }
  }
}

/**
 * Proteção CSRF com tokens criptográficos
 */
export class CSRFProtection {
  private static instance: CSRFProtection
  private tokens = new Map<string, { token: string; expires: number; used: boolean }>()
  private readonly TOKEN_EXPIRY = 3600000 // 1 hora
  private readonly MAX_TOKENS_PER_SESSION = 5

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection()
    }
    return CSRFProtection.instance
  }

  /**
   * Gera um token CSRF seguro
   */
  generateToken(sessionId = "anonymous"): string {
    try {
      // Limpar tokens expirados da sessão
      this.cleanupExpiredTokens(sessionId)

      // Verificar limite de tokens por sessão
      const sessionTokens = Array.from(this.tokens.entries()).filter(([key]) => key.startsWith(`${sessionId}:`))

      if (sessionTokens.length >= this.MAX_TOKENS_PER_SESSION) {
        // Remover o token mais antigo
        const oldestKey = sessionTokens.sort(([, a], [, b]) => a.expires - b.expires)[0][0]
        this.tokens.delete(oldestKey)
      }

      // Gerar novo token
      const token = crypto.randomBytes(32).toString("hex")
      const expires = Date.now() + this.TOKEN_EXPIRY
      const key = `${sessionId}:${token}`

      this.tokens.set(key, {
        token,
        expires,
        used: false,
      })

      console.log(`[CSRF] Token gerado para sessão: ${sessionId}`)
      return token
    } catch (error) {
      console.error("[CSRF] Erro ao gerar token:", error)
      throw new Error("Failed to generate CSRF token")
    }
  }

  /**
   * Valida um token CSRF
   */
  validateToken(token: string, sessionId = "anonymous"): boolean {
    try {
      if (!token || typeof token !== "string" || token.length !== 64) {
        console.log("[CSRF] Token inválido: formato incorreto")
        return false
      }

      const key = `${sessionId}:${token}`
      const storedToken = this.tokens.get(key)

      if (!storedToken) {
        console.log("[CSRF] Token não encontrado")
        return false
      }

      // Verificar se expirou
      if (Date.now() > storedToken.expires) {
        this.tokens.delete(key)
        console.log("[CSRF] Token expirado")
        return false
      }

      // Verificar se já foi usado (proteção contra replay)
      if (storedToken.used) {
        console.log("[CSRF] Token já utilizado")
        return false
      }

      // Marcar como usado
      storedToken.used = true

      // Comparação segura (constant-time)
      const isValid = this.constantTimeCompare(token, storedToken.token)

      if (isValid) {
        console.log(`[CSRF] Token válido para sessão: ${sessionId}`)
      } else {
        console.log("[CSRF] Token inválido: comparação falhou")
      }

      return isValid
    } catch (error) {
      console.error("[CSRF] Erro na validação:", error)
      return false
    }
  }

  /**
   * Comparação de strings em tempo constante (previne timing attacks)
   */
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

  /**
   * Remove tokens expirados
   */
  private cleanupExpiredTokens(sessionId?: string): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, value] of this.tokens.entries()) {
      const shouldClean = now > value.expires || value.used

      if (sessionId) {
        // Limpar apenas tokens da sessão específica
        if (key.startsWith(`${sessionId}:`) && shouldClean) {
          this.tokens.delete(key)
          cleaned++
        }
      } else {
        // Limpar todos os tokens expirados
        if (shouldClean) {
          this.tokens.delete(key)
          cleaned++
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[CSRF] Limpeza: ${cleaned} tokens removidos`)
    }
  }

  /**
   * Revoga todos os tokens de uma sessão
   */
  revokeSessionTokens(sessionId: string): void {
    let revoked = 0

    for (const key of this.tokens.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.tokens.delete(key)
        revoked++
      }
    }

    console.log(`[CSRF] ${revoked} tokens revogados para sessão: ${sessionId}`)
  }

  /**
   * Limpeza geral de tokens
   */
  cleanup(): void {
    this.cleanupExpiredTokens()
  }
}

/**
 * Extrai o IP real do cliente considerando proxies
 */
export function getClientIP(request: NextRequest): string {
  // Tentar diferentes headers de proxy
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip") // Cloudflare
  const xClientIP = request.headers.get("x-client-ip")

  // Priorizar Cloudflare se disponível
  if (cfConnectingIP) {
    return cfConnectingIP.split(",")[0].trim()
  }

  // X-Forwarded-For pode conter múltiplos IPs
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  // Outros headers
  if (realIP) return realIP
  if (xClientIP) return xClientIP

  // Fallback para IP da conexão (pode ser do proxy)
  return request.ip || "unknown"
}

/**
 * Lista de IPs bloqueados (pode ser expandida com banco de dados)
 */
const BLOCKED_IPS = new Set([
  // IPs conhecidos por atividade maliciosa
  "0.0.0.0",
  "127.0.0.1", // Apenas para teste - remover em produção
])

/**
 * Verifica se um IP está na lista de bloqueados
 */
export function isIPBlocked(ip: string): boolean {
  // Verificar lista estática
  if (BLOCKED_IPS.has(ip)) {
    return true
  }

  // Verificar padrões suspeitos
  if (ip === "unknown" || ip === "") {
    return true
  }

  // Verificar se é IP privado em produção (opcional)
  if (process.env.NODE_ENV === "production") {
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/
    if (privateIPRegex.test(ip)) {
      console.log(`[SECURITY] IP privado detectado em produção: ${ip}`)
      // Não bloquear, apenas logar
    }
  }

  return false
}

/**
 * Detecta atividade suspeita baseada em padrões
 */
export function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || ""
  const referer = request.headers.get("referer") || ""
  const ip = getClientIP(request)

  // Padrões suspeitos no User-Agent
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
    /go-http/i,
    /postman/i,
    /insomnia/i,
  ]

  // Verificar User-Agent suspeito
  if (!userAgent || userAgent.length < 10) {
    console.log(`[SECURITY] User-Agent suspeito: ${userAgent} - IP: ${ip}`)
    return true
  }

  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      console.log(`[SECURITY] User-Agent bloqueado: ${userAgent} - IP: ${ip}`)
      return true
    }
  }

  // Verificar headers maliciosos
  const maliciousHeaders = ["x-forwarded-host", "x-originating-ip", "x-remote-ip", "x-cluster-client-ip"]

  for (const header of maliciousHeaders) {
    if (request.headers.get(header)) {
      console.log(`[SECURITY] Header suspeito detectado: ${header} - IP: ${ip}`)
      // Não bloquear automaticamente, apenas logar
    }
  }

  // Verificar tentativas de SQL injection nos parâmetros
  const url = request.url
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /script\s*>/i,
    /<\s*script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
  ]

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(url)) {
      console.log(`[SECURITY] Tentativa de injeção detectada: ${url} - IP: ${ip}`)
      return true
    }
  }

  // Verificar múltiplas requisições muito rápidas (possível DDoS)
  const rateLimiter = RateLimiter.getInstance()
  const stats = rateLimiter.getStats()

  // Se há muitos IPs bloqueados, pode ser um ataque coordenado
  if (stats.blockedIPs > 10) {
    console.log(`[SECURITY] Possível ataque DDoS detectado: ${stats.blockedIPs} IPs bloqueados`)
    // Não bloquear este IP específico, apenas logar
  }

  return false
}

/**
 * Registra evento de segurança
 */
export function logSecurityEvent(event: SecurityEvent): void {
  console.log(`[SECURITY_LOG] ${event.type} - IP: ${event.ip} - ${JSON.stringify(event.details)}`)

  // Em produção, salvar no banco de dados
  if (process.env.NODE_ENV === "production") {
    // TODO: Implementar salvamento no banco
    // await db.run("INSERT INTO security_logs (event_type, ip_address, details) VALUES (?, ?, ?)",
    //   [event.type, event.ip, JSON.stringify(event.details)])
  }
}

/**
 * Sanitiza input para prevenir XSS e injeções
 */
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
      .replace(/javascript:/gi, "") // Remove javascript:
      .replace(/vbscript:/gi, "") // Remove vbscript:
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim()
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}

/**
 * Valida origem da requisição
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const host = request.headers.get("host")

  // Lista de origens permitidas
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // Apenas para desenvolvimento
    "http://localhost:3000", // Desenvolvimento local
    "https://localhost:3000",
  ]

  // Se não há origin (requisições diretas), verificar referer
  if (!origin) {
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        return allowedOrigins.some((allowed) => refererUrl.origin === allowed)
      } catch {
        return false
      }
    }
    // Permitir requisições diretas (sem origin nem referer) apenas em desenvolvimento
    return process.env.NODE_ENV === "development"
  }

  return allowedOrigins.includes(origin)
}

/**
 * Inicialização e limpeza automática
 */
let cleanupInterval: NodeJS.Timeout | null = null

export function initializeSecurity(): void {
  console.log("[SECURITY] Inicializando sistema de segurança...")

  // Limpeza automática a cada 5 minutos
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      try {
        RateLimiter.getInstance().cleanup()
        CSRFProtection.getInstance().cleanup()
      } catch (error) {
        console.error("[SECURITY] Erro na limpeza automática:", error)
      }
    }, 300000) // 5 minutos
  }

  console.log("[SECURITY] Sistema de segurança inicializado")
}

export function shutdownSecurity(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
  console.log("[SECURITY] Sistema de segurança finalizado")
}

// Inicializar automaticamente
if (typeof window === "undefined") {
  // Apenas no servidor
  initializeSecurity()
}
