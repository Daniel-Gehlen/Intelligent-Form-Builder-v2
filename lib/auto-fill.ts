interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface CNPJData {
  status: string
  nome: string
  fantasia: string
  logradouro: string
  numero: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
}

export class AutoFillService {
  private static instance: AutoFillService
  private cepCache = new Map<string, CEPData>()
  private cnpjCache = new Map<string, CNPJData>()
  private requestQueue = new Map<string, Promise<any>>()

  static getInstance(): AutoFillService {
    if (!AutoFillService.instance) {
      AutoFillService.instance = new AutoFillService()
    }
    return AutoFillService.instance
  }

  async fetchCEPData(cep: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validate CEP format
      const cleanCep = cep.replace(/\D/g, "")
      if (cleanCep.length !== 8) {
        return { success: false, error: "CEP must have 8 digits" }
      }

      // Check cache first
      if (this.cepCache.has(cleanCep)) {
        const cachedData = this.cepCache.get(cleanCep)!
        if (cachedData.erro) {
          return { success: false, error: "CEP not found" }
        }
        return { success: true, data: this.formatCEPData(cachedData) }
      }

      // Check if request is already in progress
      if (this.requestQueue.has(`cep-${cleanCep}`)) {
        const result = await this.requestQueue.get(`cep-${cleanCep}`)
        return result
      }

      // Create new request
      const requestPromise = this.performCEPRequest(cleanCep)
      this.requestQueue.set(`cep-${cleanCep}`, requestPromise)

      try {
        const result = await requestPromise
        return result
      } finally {
        this.requestQueue.delete(`cep-${cleanCep}`)
      }
    } catch (error) {
      console.error("CEP fetch error:", error)
      return { success: false, error: "Failed to fetch CEP data" }
    }
  }

  private async performCEPRequest(cep: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CEPData = await response.json()

      // Cache the result
      this.cepCache.set(cep, data)

      if (data.erro) {
        return { success: false, error: "CEP not found" }
      }

      return { success: true, data: this.formatCEPData(data) }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Request timeout" }
      }
      console.error("CEP API error:", error)
      return { success: false, error: "Failed to fetch CEP data" }
    }
  }

  private formatCEPData(data: CEPData) {
    return {
      address: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      complement: data.complemento || "",
    }
  }

  async fetchCNPJData(cnpj: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validate CNPJ format
      const cleanCnpj = cnpj.replace(/\D/g, "")
      if (cleanCnpj.length !== 14) {
        return { success: false, error: "CNPJ must have 14 digits" }
      }

      // Validate CNPJ algorithm
      if (!this.validateCNPJ(cleanCnpj)) {
        return { success: false, error: "Invalid CNPJ" }
      }

      // Check cache first
      if (this.cnpjCache.has(cleanCnpj)) {
        const cachedData = this.cnpjCache.get(cleanCnpj)!
        if (cachedData.status !== "OK") {
          return { success: false, error: "CNPJ not found" }
        }
        return { success: true, data: this.formatCNPJData(cachedData) }
      }

      // Check if request is already in progress
      if (this.requestQueue.has(`cnpj-${cleanCnpj}`)) {
        const result = await this.requestQueue.get(`cnpj-${cleanCnpj}`)
        return result
      }

      // Create new request
      const requestPromise = this.performCNPJRequest(cleanCnpj)
      this.requestQueue.set(`cnpj-${cleanCnpj}`, requestPromise)

      try {
        const result = await requestPromise
        return result
      } finally {
        this.requestQueue.delete(`cnpj-${cleanCnpj}`)
      }
    } catch (error) {
      console.error("CNPJ fetch error:", error)
      return { success: false, error: "Failed to fetch CNPJ data" }
    }
  }

  private async performCNPJRequest(cnpj: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CNPJData = await response.json()

      // Cache the result
      this.cnpjCache.set(cnpj, data)

      if (data.status !== "OK") {
        return { success: false, error: "CNPJ not found or invalid" }
      }

      return { success: true, data: this.formatCNPJData(data) }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Request timeout" }
      }
      console.error("CNPJ API error:", error)
      return { success: false, error: "Failed to fetch CNPJ data" }
    }
  }

  private formatCNPJData(data: CNPJData) {
    return {
      companyName: data.nome || "",
      fantasyName: data.fantasia || "",
      companyAddress: data.logradouro || "",
      companyNumber: data.numero || "",
      companyCity: data.municipio || "",
      companyState: data.uf || "",
      companyCep: data.cep || "",
      companyPhone: data.telefone || "",
      companyEmail: data.email || "",
    }
  }

  private validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14) return false

    // Check for known invalid patterns
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    // Calculate first check digit
    let sum = 0
    let weight = 5
    for (let i = 0; i < 12; i++) {
      sum += Number.parseInt(cnpj[i]) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    // Calculate second check digit
    sum = 0
    weight = 6
    for (let i = 0; i < 13; i++) {
      sum += Number.parseInt(cnpj[i]) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    return Number.parseInt(cnpj[12]) === digit1 && Number.parseInt(cnpj[13]) === digit2
  }

  clearCache(): void {
    this.cepCache.clear()
    this.cnpjCache.clear()
    this.requestQueue.clear()
  }
}
