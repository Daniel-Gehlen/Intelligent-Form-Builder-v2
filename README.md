# 🚀 Form Builder Inteligente

Sistema completo de criação de formulários com integrações automáticas, auto-preenchimento e máxima segurança.

## ✨ Funcionalidades Principais

### 🎯 **Criação de Formulários**
- **Drag & Drop**: Interface intuitiva para criação
- **Campos Inteligentes**: CEP e CNPJ com auto-preenchimento
- **Validação em Tempo Real**: Feedback instantâneo
- **Preview Dinâmico**: Visualização antes da publicação

### 🔗 **Integrações Automáticas**
- **CRM**: Sincronização automática de leads
- **Mailchimp**: Adição automática às listas de email
- **APIs Brasileiras**: ViaCEP e ReceitaWS
- **Webhooks**: Notificações personalizadas

### 🛡️ **Segurança Avançada**
- **Rate Limiting**: Proteção contra spam
- **CSRF Protection**: Tokens seguros
- **Sanitização**: Limpeza automática de inputs
- **Headers de Segurança**: XSS, HSTS, CSP
- **Autenticação JWT**: Sistema seguro de login

### 📊 **Analytics e Exportação**
- **Dashboard Completo**: Métricas em tempo real
- **Exportação HTML**: Formulários standalone
- **Exportação JSON**: Estrutura de dados
- **Relatórios CSV**: Análise de submissões

## 🚀 Deploy Rápido na Vercel

### 1. **Preparação**
```
# Clone o repositório
git clone <seu-repositorio>
cd form-builder-inteligente

# Instale dependências
npm install

# Teste local
npm run dev
```

### 2. **Deploy Automático**
```
# Conecte com a Vercel
npx vercel

# Siga as instruções:
# - Link to existing project? No
# - Project name: form-builder-inteligente
# - Directory: ./
# - Override settings? No

# Deploy será feito automaticamente
```

### 3. **Configurar Variáveis de Ambiente**

No painel da Vercel, adicione:

```
# Obrigatório - Chave de segurança JWT
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-chars

# Opcional - Integrações
CRM_API_KEY=sua-chave-crm
MAILCHIMP_API_KEY=sua-chave-mailchimp
MAILCHIMP_LIST_ID=id-da-lista-mailchimp
```

### 4. **Verificação**
- ✅ Acesse sua URL da Vercel
- ✅ Teste criação de formulário
- ✅ Teste submissão
- ✅ Verifique integrações em `/settings`

## 🔧 Configuração Detalhada

### **Variáveis de Ambiente**

| Variável            | Obrigatória | Descrição                                 |
| ------------------- | ----------- | ----------------------------------------- |
| `JWT_SECRET`        | ✅           | Chave para assinatura JWT (min. 32 chars) |
| `CRM_API_KEY`       | ❌           | Chave da API do seu CRM                   |
| `MAILCHIMP_API_KEY` | ❌           | Chave da API do Mailchimp                 |
| `MAILCHIMP_LIST_ID` | ❌           | ID da lista do Mailchimp                  |

### **Configuração do Mailchimp**

1. **Obter API Key:**
   - Acesse: Account → Extras → API Keys
   - Gere uma nova chave
   - Formato: `key-datacenter` (ex: `abc123-us1`)

2. **Obter List ID:**
   - Audience → Settings → Audience name and defaults
   - Copie o "Audience ID"

### **Configuração do CRM**

O sistema suporta qualquer CRM com API REST. Configure:
- Endpoint de criação de contatos
- Headers de autenticação
- Mapeamento de campos

## 📖 Guia de Uso

### **1. Criando Formulários**

```
// Acesse /builder
// 1. Arraste campos da barra lateral
// 2. Configure propriedades no painel direito
// 3. Teste com Preview
// 4. Salve e publique
```

### **2. Campos Inteligentes**

**CEP com Auto-preenchimento:**
```
// Adicione campo tipo "CEP"
// Sistema busca automaticamente:
// - Endereço
// - Bairro  
// - Cidade
// - Estado
```

**CNPJ com Auto-preenchimento:**
```
// Adicione campo tipo "CNPJ"
// Sistema busca automaticamente:
// - Razão Social
// - Nome Fantasia
// - Endereço da Empresa
// - Telefone
```

### **3. Integrações Automáticas**

Quando um formulário é submetido:

1. **Validação**: Campos obrigatórios e formatos
2. **Sanitização**: Limpeza de dados maliciosos
3. **Salvamento**: Banco de dados local
4. **CRM**: Criação automática de lead
5. **Mailchimp**: Adição à lista de email
6. **Resposta**: Confirmação para o usuário

### **4. Exportação de Formulários**

**HTML Standalone:**
```
// Gera arquivo HTML completo
// - CSS incorporado
// - JavaScript de validação
// - Auto-preenchimento CEP/CNPJ
// - Pronto para usar em qualquer site
```

**JSON Estruturado:**
```
// Exporta estrutura do formulário
// - Campos e validações
// - Metadados
// - Configurações
// - Importável em outros sistemas
```

## 🛡️ Segurança

### **Proteções Implementadas**

1. **Rate Limiting por IP:**
   - Submissões: 5/minuto
   - Login: 3/15 minutos
   - APIs: 100/minuto

2. **CSRF Protection:**
   - Tokens criptográficos
   - Validação de origem
   - Tempo de expiração

3. **Sanitização de Inputs:**
   - Remoção de scripts
   - Validação de tipos
   - Escape de HTML

4. **Headers de Segurança:**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000
   Content-Security-Policy: default-src 'self'
   ```

### **Monitoramento**

- Logs de segurança automáticos
- Detecção de atividade suspeita
- Bloqueio de IPs maliciosos
- Alertas de tentativas de ataque

## 📊 Analytics

### **Métricas Disponíveis**

- Total de formulários criados
- Submissões por período
- Taxa de conversão
- Performance das integrações
- Usuários ativos

### **Vercel Analytics**

Automaticamente ativo para:
- Page views
- Performance metrics
- Error tracking
- User engagement

## 🔧 Desenvolvimento

### **Estrutura do Projeto**

```
├── app/                    # Next.js App Router
│   ├── api/               # Endpoints da API
│   ├── auth/              # Páginas de autenticação
│   ├── builder/           # Construtor de formulários
│   ├── dashboard/         # Dashboard analytics
│   ├── forms/             # Gerenciamento de formulários
│   └── settings/          # Configurações do sistema
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── form-*            # Componentes específicos
├── lib/                  # Utilitários e serviços
│   ├── database.ts       # Configuração SQLite
│   ├── security.ts       # Serviços de segurança
│   ├── integrations.ts   # Integrações externas
│   └── validation.ts     # Validações e schemas
└── middleware.ts         # Middleware de segurança
```

### **Comandos Úteis**

```
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Linting
npm run lint

# Deploy na Vercel
npx vercel --prod
```

### **Tecnologias Utilizadas**

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Next.js API Routes, SQLite
- **Segurança**: JWT, bcrypt, CSRF tokens
- **Validação**: Zod schemas
- **Deploy**: Vercel Platform

## 🚨 Troubleshooting

### **Problemas Comuns**

**1. Build falha na Vercel:**
```
# Verificar logs
npx vercel logs

# Soluções comuns:
# - Verificar dependências no package.json
# - Corrigir erros de TypeScript
# - Verificar variáveis de ambiente
```

**2. Integrações não funcionam:**
```
# Verificar variáveis de ambiente
# Testar conexões em /settings
# Verificar logs da API
```

**3. Banco de dados não persiste:**
```
# Normal na Vercel - usar banco externo para persistência
# Alternativas:
# - Vercel Postgres
# - PlanetScale
# - Supabase
```

**4. Erro de CORS:**
```
# Verificar configuração no vercel.json
# Adicionar headers CORS apropriados
```

### **Logs e Debugging**

```
# Logs em tempo real
npx vercel logs --follow

# Logs de função específica
npx vercel logs --function=api/forms

# Logs de build
npx vercel logs --build
```

## 📞 Suporte

### **Recursos de Ajuda**

1. **Documentação**: Este README completo
2. **Exemplos**: Arquivo `EXAMPLES.md`
3. **Deploy**: Guia `DEPLOY.md`
4. **Issues**: GitHub Issues do projeto

### **Contato**

- **Email**: suporte@formbuilder.com
- **GitHub**: [Repositório do Projeto]
- **Vercel**: [Dashboard da Vercel]

## 🎉 Conclusão

O **Form Builder Inteligente** está pronto para produção com:

- ✅ **Segurança 5-Sigma**: Rate limiting, CSRF, sanitização
- ✅ **Integrações Automáticas**: CRM e Mailchimp
- ✅ **Auto-preenchimento**: CEP e CNPJ brasileiros
- ✅ **Exportação Completa**: HTML e JSON
- ✅ **Deploy Simplificado**: Um comando na Vercel
- ✅ **Documentação Completa**: Guias detalhados
- ✅ **Monitoramento**: Analytics e logs

**Deploy agora e comece a criar formulários inteligentes!** 🚀

---

**Desenvolvido com ❤️ para máxima produtividade e segurança**
