"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, CheckCircle, XCircle, RefreshCw, Database, Shield, Zap } from "lucide-react"
import { toast } from "sonner"

interface ConnectionStatus {
  crm: { connected: boolean; error?: string }
  mailchimp: { connected: boolean; error?: string }
}

interface SystemStats {
  totalForms: number
  totalSubmissions: number
  activeUsers: number
  integrationSuccess: number
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<ConnectionStatus | null>(null)
  const [testing, setTesting] = useState(false)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([testConnections(), loadSystemStats()])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const testConnections = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/integrations/test")
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections)
        toast.success("Teste de conexões concluído")
      } else {
        toast.error("Erro ao testar conexões")
      }
    } catch (error) {
      console.error("Erro ao testar conexões:", error)
      toast.error("Falha na comunicação com o servidor")
    } finally {
      setTesting(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const getStatusIcon = (connected: boolean) => {
    return connected ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusBadge = (connected: boolean) => {
    return <Badge variant={connected ? "default" : "destructive"}>{connected ? "Conectado" : "Desconectado"}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configurações do Sistema
            </h1>
            <p className="text-gray-600">Gerencie integrações e configurações avançadas</p>
          </div>
          <Button onClick={testConnections} disabled={testing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testando..." : "Testar Conexões"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Banco de Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {connections && getStatusIcon(connections.crm.connected)}
                        Integração CRM
                      </CardTitle>
                      <CardDescription>Sincronização automática de leads e contatos</CardDescription>
                    </div>
                    {connections && getStatusBadge(connections.crm.connected)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={connections?.crm.connected ? "text-green-600" : "text-red-600"}>
                        {connections?.crm.connected ? "Funcionando" : "Erro de conexão"}
                      </span>
                    </div>
                    {connections?.crm.error && (
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Erro:</strong> {connections.crm.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {connections && getStatusIcon(connections.mailchimp.connected)}
                        Integração Mailchimp
                      </CardTitle>
                      <CardDescription>Automação de email marketing e listas</CardDescription>
                    </div>
                    {connections && getStatusBadge(connections.mailchimp.connected)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={connections?.mailchimp.connected ? "text-green-600" : "text-red-600"}>
                        {connections?.mailchimp.connected ? "Funcionando" : "Erro de conexão"}
                      </span>
                    </div>
                    {connections?.mailchimp.error && (
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Erro:</strong> {connections.mailchimp.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proteções Ativas</CardTitle>
                <CardDescription>Status das proteções de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Limiting</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Proteção CSRF</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Headers de Segurança</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL/HTTPS</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do Banco</CardTitle>
                <CardDescription>Informações sobre o banco de dados</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de Formulários:</span>
                      <span className="font-medium">{stats.totalForms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de Submissões:</span>
                      <span className="font-medium">{stats.totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usuários Ativos:</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
