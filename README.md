# 🏫 Sistema de Registro de Ocorrências Escolares PEI
### E.E. Coronel Ary Gomes — Governo do Estado de São Paulo

Sistema web moderno e institucional desenvolvido para facilitar, padronizar e agilizar o registro de ocorrências disciplinares por professores, gerando documentos em PDF oficiais com formatação padronizada e realizando o despacho automático por e-mail com anexo para a coordenação pedagógica.

---

## 📌 Sumário
1. [Visão Geral e Objetivos](#-visão-geral-e-objetivos)
2. [Como o Sistema Funciona](#-como-o-sistema-funciona)
3. [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
4. [Estrutura de Pastas e Arquivos](#-estrutura-de-pastas-e-arquivos)
5. [Segurança e Resiliência](#-segurança-e-resiliência)
6. [Guia de Configuração e Execução](#-guia-de-configuração-e-execução)
7. [Deploy na Vercel](#-deploy-na-vercel)

---

## 🎯 Visão Geral e Objetivos

O sistema foi concebido para resolver os principais gargalos no processo tradicional de registro de ocorrências escolares (papel, arquivos manuais ou preenchimentos despadronizados):
- **Padronização Visual e Jurídica**: Gera um documento PDF oficial de alta fidelidade com os cabeçalhos oficiais do Estado de SP, Diretoria de Ensino de Guarulhos Sul e logotipos institucionais.
- **Economia de Tempo para o Professor**: Sugestões rápidas de motivos comuns de ocorrência, preenchimento automático de data/hora e salvamento do nome do professor no navegador.
- **Comunicação Instantânea com a Coordenação**: Envio automático e direto da ocorrência para a caixa de entrada da coordenação (`arygomescoord2026@gmail.com`) com o documento PDF já anexado.
- **Histórico e Segurança**: O professor baixa uma cópia em PDF no seu computador no mesmo instante em que a mensagem é despachada.

---

## ⚙️ Como o Sistema Funciona

O fluxo operacional do sistema é dividido em 4 etapas contínuas:

```
 ┌──────────────────────────┐
 │ 1. Preenchimento Web     │  -> Interface moderna com templates rápidos, validação
 └─────────────┬────────────┘     e auto-save no navegador (localStorage).
               │
 ┌─────────────▼────────────┐
 │ 2. Geração do PDF        │  -> Motor jsPDF processa layout milimétrico vetorial
 └─────────────┬────────────┘     com cabeçalho oficial SP e assinaturas.
               │
 ┌─────────────▼────────────┐
 │ 3. Download Local        │  -> Baixa cópia imediata no dispositivo do usuário
 └─────────────┬────────────┘     com nome formatado: Ocorrencia_[Aluno]_[Data].pdf
               │
 ┌─────────────▼────────────┐
 │ 4. Despacho por E-mail   │  -> Nodemailer / SMTP dispara e-mail HTML institucional
 └──────────────────────────┘     com o PDF anexado diretamente para a coordenação.
```

### 1. Entrada de Dados e Auto-Save
- O professor informa seu nome, seleciona a turma (Fundamental II ou Ensino Médio) e o tipo de infração.
- O campo de data e hora é preenchido automaticamente com o momento atual do sistema.
- **Rascunho Automático**: Tudo o que é digitado é sincronizado em tempo real no `localStorage`. Se a página for atualizada ou fechada por engano, nenhum dado é perdido.
- **Botão "Limpar Aluno"**: Permite iniciar uma nova ocorrência com 1 clique mantendo o nome do professor intacto.

### 2. Geração e Pré-visualização do PDF Oficial
- O motor [`src/utils/pdfGenerator.js`](file:///c:/Projetos/ocorrencias/src/utils/pdfGenerator.js) desenha o documento A4 diretamente na memória do navegador.
- O documento inclui:
  - Cabeçalho oficial do Governo do Estado de São Paulo e Diretoria Guarulhos Sul.
  - Brasão institucional e logotipo da E.E. Coronel Ary Gomes em alta resolução.
  - Grid de metadados em caixas arredondadas sem risco de sobreposição de texto.
  - Caixa de texto com quebra automática de linhas e paginação dinâmica se o texto for longo.
  - Linhas de assinatura para o Professor e Visto da Coordenação.

### 3. Disparo Direto de E-mail
- O usuário clica em **"Enviar por E-mail e Baixar PDF"**.
- O frontend envia a requisição para a rota `/api/send-email`:
  - Em **Ambiente Local**: Processado pelo servidor Express ([`server.js`](file:///c:/Projetos/ocorrencias/server.js)).
  - Em **Ambiente Vercel / Produção**: Processado nativamente pela Serverless Function ([`api/send-email.js`](file:///c:/Projetos/ocorrencias/api/send-email.js)).
- O e-mail chega na caixa da coordenação com formatação HTML elegante e o PDF oficial anexado.

---

## 🛠️ Arquitetura e Tecnologias

### **Frontend**
- **React 19**: Biblioteca para construção de interfaces reativas baseadas em componentes funcionais e hooks.
- **Vite 6**: Bundler moderno com Hot Module Replacement (HMR) ultrarrápido e otimização de chunks (`manualChunks`).
- **Vanilla CSS (Design Tokens & Glassmorphism)**: Estilização personalizada com modo escuro nativo, sombras suaves, gradientes HSL e micro-animações.
- **jsPDF**: Motor cliente para compilação vetorial de arquivos PDF sem dependência de renderizadores de terceiros.
- **Lucide React**: Ícones SVG leves e acessíveis.
- **Canvas Confetti**: Feedback visual com animação de celebração ao concluir o envio.

### **Backend / Serverless**
- **Node.js & Express 4**: Servidor local leve para testes e desenvolvimento offline.
- **Vercel Serverless Functions**: Funções em nuvem executadas sob demanda na infraestrutura da Vercel.
- **Nodemailer 9**: Biblioteca para transporte SMTP com suporte a SSL/TLS, autenticação segura e anexos multipart.
- **Dotenv**: Gerenciamento seguro de variáveis de ambiente.

---

## 📁 Estrutura de Pastas e Arquivos

```
ocorrencias/
├── api/
│   └── send-email.js         # Serverless Function da Vercel para envio de e-mails
├── public/                   # Arquivos públicos e ícones estáticos
├── src/
│   ├── assets/
│   │   ├── logo-ary.jpg      # Logo oficial da escola
│   │   ├── logo-sp.jpg       # Brasão do Estado de SP
│   │   └── logos.js          # Imagens otimizadas em Base64 para inclusão no PDF
│   ├── components/
│   │   ├── Header.jsx        # Cabeçalho com alternador de tema e títulos
│   │   ├── OccurrenceForm.jsx# Formulário completo com templates e auto-save
│   │   ├── PdfPreviewModal.jsx# Modal para visualização prévia do PDF
│   │   └── Toast.jsx         # Notificações visuais de sucesso, info e erro
│   ├── utils/
│   │   ├── emailService.js   # Serviço de comunicação frontend com a API de e-mails
│   │   └── pdfGenerator.js   # Algoritmo de desenho e paginação do PDF oficial
│   ├── App.jsx               # Componente raiz, gerenciamento de estado e fluxo
│   ├── index.css             # Design system completo com variáveis CSS e temas
│   └── main.jsx              # Ponto de entrada do React
├── .env.example              # Modelo documentado de variáveis de ambiente
├── .gitignore                # Regras para ignorar .env, logs e node_modules
├── package.json              # Dependências e scripts de execução
├── server.js                 # Servidor Express local para desenvolvimento
├── vercel.json               # Configurações de deploy, rotas e headers de segurança
└── vite.config.js            # Configurações do Vite, proxy local e chunk splitting
```

---

## 🔒 Segurança e Resiliência

1. **Proteção Anti-CRLF Injection**: Todos os campos que compõem o cabeçalho do e-mail são sanitizados para remover quebras de linha (`\r`, `\n`, `\t`), neutralizando ataques de injeção SMTP.
2. **Prevenção contra XSS**: Os campos de texto são tratados e sanitizados antes de serem inseridos no HTML do e-mail.
3. **Limitação de Payload (8MB)**: O servidor Express e as APIs limitam o corpo da requisição a 8MB, prevenindo ataques de DoS por exaustão de memória.
4. **Rate Limiting em Memória**: Limite de até 20 disparos por minuto por endereço IP para evitar abusos automatizados.
5. **Headers de Segurança HTTP no `vercel.json`**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
6. **Fallback de Envio em Camadas**:
   - Camada 1: API Serverless / Local (`/api/send-email`).
   - Camada 2: Web3Forms (fallback de contingência).
   - Camada 3: Abertura do cliente de e-mail local do usuário (`mailto:`).

---

## 🚀 Guia de Configuração e Execução Local

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/Artemis-Sales/ocorrencias-escolares.git
cd ocorrencias-escolares
npm install
```

### 2. Configurar o Arquivo `.env`
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=arygomescoord2026@gmail.com
SMTP_PASS=sua_senha_de_aplicativo_de_16_digitos

VITE_WEB3FORMS_KEY=89e47268-2943-4c91-9134-c2c61e404b86
```

> **Como gerar a senha de aplicativo no Gmail:**
> 1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) logado na conta Google.
> 2. Crie uma nova senha de aplicativo chamada `Ocorrências Escolares`.
> 3. Copie a senha de 16 caracteres gerada e cole em `SMTP_PASS`.

### 3. Iniciar o Projeto
```bash
npm run start
```
*(Inicia simultaneamente o frontend Vite em `http://localhost:3000` e o backend Express em `http://localhost:3001`).*

---

## ☁️ Deploy na Vercel

O projeto está 100% preparado para deploy contínuo na Vercel:

1. Importe o repositório na [Vercel](https://vercel.com).
2. Em **Project Settings > Environment Variables**, cadastre as seguintes variáveis:
   - `SMTP_USER`: `arygomescoord2026@gmail.com`
   - `SMTP_PASS`: sua senha de app de 16 dígitos
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_SECURE`: `true`
3. Execute o Deploy. A Vercel provisionará a Serverless Function `/api/send-email` e servirá o frontend estático otimizado globalmente.
