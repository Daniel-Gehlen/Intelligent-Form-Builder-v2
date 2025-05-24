/**
 * Serviços de Integração Externa
 * Implementa conexões com CRM e Mailchimp para automação de marketing
 */

interface CRMContact {
  email: string
  name: string
  phone?: string
  company?: string
  source: string
  customFields?: Record<string, any>
}

interface MailchimpContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  tags?: string[]
  mergeFields?: Record<string, any>
}

export class IntegrationService {
  private static instance: IntegrationService
  private crmApiKey: string
  private mailchimpApiKey: string
  private mailchimpListId: string

  private constructor() {
    this.crmApiKey = process.env.CRM_API_KEY || ""
    this.mailchimpApiKey = process.env.MAILCHIMP_API_KEY || ""
    this.mailchimpListId = process.env.MAILCHIMP_LIST_ID || ""
  }

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService()
    }
    return IntegrationService.instance
  }

  /**
   * Adiciona contato ao CRM
   */
  async addToCRM(contact: CRMContact): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!this.crmApiKey) {
        console.log("[CRM] API Key não configurada, pulando integração")
        return { success: true, id: "mock-id" }
      }

      console.log(`[CRM] Adicionando contato: ${contact.email}`)

      const response = await fetch("https://api.crm-example.com/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.crmApiKey}`,
          "User-Agent": "FormBuilder/1.0",
        },
        body: JSON.stringify({
          email: contact.email,
          first_name: contact.name.split(" ")[0] || "",
          last_name: contact.name.split(" ").slice(1).join(" ") || "",
          phone: contact.phone || "",
          company: contact.company || "",
          source: contact.source,
          custom_fields: contact.customFields || {},
          tags: ["form-submission", "lead"],
          created_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`[CRM] Erro na API: ${response.status} - ${errorData}`)
        return { success: false, error: `CRM API Error: ${response.status}` }
      }

      const result = await response.json()
      console.log(`[CRM] Contato adicionado com sucesso: ${result.id}`)

      return { success: true, id: result.id }
    } catch (error) {
      console.error("[CRM] Erro ao adicionar contato:", error)
      return { success: false, error: "Falha na conexão com CRM" }
    }
  }

  /**
   * Adiciona contato ao Mailchimp
   */
  async addToMailchimp(contact: MailchimpContact): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!this.mailchimpApiKey || !this.mailchimpListId) {
        console.log("[MAILCHIMP] Credenciais não configuradas, pulando integração")
        return { success: true, id: "mock-id" }
      }

      console.log(`[MAILCHIMP] Adicionando contato: ${contact.email}`)

      // Extrair datacenter da API key (formato: key-dc)
      const datacenter = this.mailchimpApiKey.split("-")[1]
      if (!datacenter) {
        return { success: false, error: "API Key do Mailchimp inválida" }
      }

      const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${this.mailchimpListId}/members`

      const memberData = {
        email_address: contact.email,
        status: "subscribed",
        merge_fields: {
          FNAME: contact.firstName || "",
          LNAME: contact.lastName || "",
          PHONE: contact.phone || "",
          ...contact.mergeFields,
        },
        tags: contact.tags || ["form-submission"],
        timestamp_signup: new Date().toISOString(),
        ip_signup: "127.0.0.1", // Placeholder - em produção usar IP real
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.mailchimpApiKey}`,
          "User-Agent": "FormBuilder/1.0",
        },
        body: JSON.stringify(memberData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`[MAILCHIMP] Erro na API:`, errorData)

        // Se o email já existe, tenta atualizar
        if (response.status === 400 && errorData.title === "Member Exists") {
          return await this.updateMailchimpContact(contact)
        }

        return { success: false, error: `Mailchimp API Error: ${errorData.detail}` }
      }

      const result = await response.json()
      console.log(`[MAILCHIMP] Contato adicionado com sucesso: ${result.id}`)

      return { success: true, id: result.id }
    } catch (error) {
      console.error("[MAILCHIMP] Erro ao adicionar contato:", error)
      return { success: false, error: "Falha na conexão com Mailchimp" }
    }
  }

  /**
   * Atualiza contato existente no Mailchimp
   */
  private async updateMailchimpContact(
    contact: MailchimpContact,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const datacenter = this.mailchimpApiKey.split("-")[1]
      const emailHash = await this.md5Hash(contact.email.toLowerCase())
      const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${this.mailchimpListId}/members/${emailHash}`

      const updateData = {
        merge_fields: {
          FNAME: contact.firstName || "",
          LNAME: contact.lastName || "",
          PHONE: contact.phone || "",
          ...contact.mergeFields,
        },
        status: "subscribed",
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.mailchimpApiKey}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: `Erro ao atualizar: ${errorData.detail}` }
      }

      const result = await response.json()
      console.log(`[MAILCHIMP] Contato atualizado: ${result.id}`)

      return { success: true, id: result.id }
    } catch (error) {
      console.error("[MAILCHIMP] Erro ao atualizar contato:", error)
      return { success: false, error: "Falha ao atualizar contato" }
    }
  }

  /**
   * Processa submissão de formulário com integrações
   */
  async processFormSubmission(
    formData: Record<string, any>,
    formTitle: string,
  ): Promise<{
    success: boolean
    integrations: {
      crm: { success: boolean; id?: string; error?: string }
      mailchimp: { success: boolean; id?: string; error?: string }
    }
  }> {
    console.log(`[INTEGRATIONS] Processando submissão do formulário: ${formTitle}`)

    // Extrair dados do contato
    const email = formData.email || formData.Email || formData.email_address || ""
    const name = formData.name || formData.Name || formData.nome || ""
    const phone = formData.phone || formData.Phone || formData.telefone || ""
    const company = formData.company || formData.Company || formData.empresa || ""

    if (!email) {
      console.log("[INTEGRATIONS] Email não encontrado, pulando integrações")
      return {
        success: true,
        integrations: {
          crm: { success: true },
          mailchimp: { success: true },
        },
      }
    }

    // Preparar dados para CRM
    const crmContact: CRMContact = {
      email,
      name,
      phone,
      company,
      source: `Form: ${formTitle}`,
      customFields: {
        form_title: formTitle,
        submission_date: new Date().toISOString(),
        raw_data: formData,
      },
    }

    // Preparar dados para Mailchimp
    const nameParts = name.split(" ")
    const mailchimpContact: MailchimpContact = {
      email,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      phone,
      tags: ["form-submission", formTitle.toLowerCase().replace(/\s+/g, "-")],
      mergeFields: {
        COMPANY: company,
        FORMTITLE: formTitle,
        SUBDATE: new Date().toLocaleDateString("pt-BR"),
      },
    }

    // Executar integrações em paralelo
    const [crmResult, mailchimpResult] = await Promise.all([
      this.addToCRM(crmContact),
      this.addToMailchimp(mailchimpContact),
    ])

    const success = crmResult.success && mailchimpResult.success

    console.log(`[INTEGRATIONS] Processamento concluído - Sucesso: ${success}`)

    return {
      success,
      integrations: {
        crm: crmResult,
        mailchimp: mailchimpResult,
      },
    }
  }

  /**
   * Gera hash MD5 para email (necessário para API do Mailchimp)
   */
  private async md5Hash(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest("MD5", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  /**
   * Testa conectividade com as integrações
   */
  async testConnections(): Promise<{
    crm: { connected: boolean; error?: string }
    mailchimp: { connected: boolean; error?: string }
  }> {
    console.log("[INTEGRATIONS] Testando conexões...")

    const results = {
      crm: { connected: false, error: "" },
      mailchimp: { connected: false, error: "" },
    }

    // Teste CRM
    try {
      if (this.crmApiKey) {
        const response = await fetch("https://api.crm-example.com/v1/ping", {
          headers: { Authorization: `Bearer ${this.crmApiKey}` },
        })
        results.crm.connected = response.ok
        if (!response.ok) {
          results.crm.error = `HTTP ${response.status}`
        }
      } else {
        results.crm.error = "API Key não configurada"
      }
    } catch (error) {
      results.crm.error = "Falha na conexão"
    }

    // Teste Mailchimp
    try {
      if (this.mailchimpApiKey && this.mailchimpListId) {
        const datacenter = this.mailchimpApiKey.split("-")[1]
        const response = await fetch(`https://${datacenter}.api.mailchimp.com/3.0/ping`, {
          headers: { Authorization: `Bearer ${this.mailchimpApiKey}` },
        })
        results.mailchimp.connected = response.ok
        if (!response.ok) {
          results.mailchimp.error = `HTTP ${response.status}`
        }
      } else {
        results.mailchimp.error = "Credenciais não configuradas"
      }
    } catch (error) {
      results.mailchimp.error = "Falha na conexão"
    }

    console.log("[INTEGRATIONS] Teste concluído:", results)
    return results
  }
}
