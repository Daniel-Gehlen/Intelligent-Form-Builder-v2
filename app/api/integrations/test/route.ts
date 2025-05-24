/**
 * API para testar conectividade com integrações externas
 */

import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[API] Testando integrações...")

    // Simular teste de conexões sem dependências externas
    const results = {
      crm: {
        connected: !!process.env.CRM_API_KEY,
        error: !process.env.CRM_API_KEY ? "API Key não configurada" : undefined,
      },
      mailchimp: {
        connected: !!(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID),
        error: !(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID)
          ? "Credenciais não configuradas"
          : undefined,
      },
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      connections: results,
    })
  } catch (error) {
    console.error("[API] Erro ao testar integrações:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao testar integrações",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
