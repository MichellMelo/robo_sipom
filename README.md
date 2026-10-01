# 🤖 Robô SIPOM — Automação de Registro de Ocorrências

Bot do Telegram integrado a automação web para **extração, estruturação e preenchimento automatizado de relatórios operacionais no sistema SIPOM**.

A aplicação recebe um relatório em texto pelo Telegram, realiza o parsing das informações e utiliza automação de navegador para preencher os campos correspondentes no SIPOM.

> ⚠️ **Uso restrito:** este projeto deve ser utilizado somente por operadores autorizados. Não compartilhe credenciais do SIPOM, tokens do Telegram ou dados operacionais em repositórios públicos.

---

# 📌 Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Funcionalidades](#2-funcionalidades)
- [3. Tecnologias](#3-tecnologias)
- [4. Arquitetura](#4-arquitetura)
- [5. Estrutura do projeto](#5-estrutura-do-projeto)
- [6. Pré-requisitos](#6-pré-requisitos)
- [7. Criando o Bot do Telegram](#7-criando-o-bot-do-telegram)
- [8. Obtendo o TELEGRAM_TOKEN](#8-obtendo-o-telegram_token)
- [9. Obtendo o TELEGRAM_CHAT_ID](#9-obtendo-o-telegram_chat_id)
- [10. Criando o arquivo .env](#10-criando-o-arquivo-env)
- [11. Instalando o projeto](#11-instalando-o-projeto)
- [12. Executando o Robô](#12-executando-o-robô)
- [13. Primeiro teste](#13-primeiro-teste)
- [14. Fluxo de utilização](#14-fluxo-de-utilização)
- [15. Arquitetura dos módulos](#15-arquitetura-dos-módulos)
- [16. Automação SIPOM](#16-automação-sipom)
- [17. Segurança](#17-segurança)
- [18. .gitignore](#18-gitignore)
- [19. Solução de problemas](#19-solução-de-problemas)
- [20. Comandos úteis](#20-comandos-úteis)

---

# 1. Visão geral

O **Robô SIPOM** automatiza parte do processo de registro de ocorrências no SIPOM.

O fluxo principal é:

```text
┌─────────────────────┐
│     Telegram        │
│                     │
│ Relatório em texto  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     server.js       │
│                     │
│ Bot Telegram        │
│ Gerenciamento       │
│ das sessões         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   parserSipom.js    │
│                     │
│ Extração dos dados  │
│ Estruturação JSON   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ sipomAutomation.js  │
│                     │
│ Playwright/Chrome   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       SIPOM         │
│                     │
│ Preenchimento       │
│ automatizado        │
└─────────────────────┘
```

---

# 2. Funcionalidades

## 🤖 Parser de relatórios

O parser realiza a extração de informações como:

- Ficha CIOPS;
- Natureza da ocorrência;
- Data;
- Horário;
- Endereço;
- OPM;
- Viatura;
- Pessoas;
- Qualificação das partes;
- Delegado;
- Delegacia;
- Procedimento;
- Materiais;
- Histórico;
- Composição.

---

## 📱 Bot do Telegram

O sistema disponibiliza interação através do Telegram.

O usuário pode:

1. iniciar o bot;
2. enviar o relatório;
3. visualizar as opções disponíveis;
4. selecionar quais partes deseja preencher;
5. acompanhar a execução da automação.

---

## ⚙️ Automação modular

O projeto permite executar diferentes etapas individualmente.

Exemplo:

```text
👥 Pessoas
⚖️ Procedimento
📝 Histórico
📦 Materiais
🚔 Composição
```

Também pode executar o preenchimento completo.

---

# 3. Tecnologias

## Backend

- Node.js
- Express.js
- dotenv

## Telegram

- grammY

## Automação

- Playwright
- Google Chrome

## Parsing

- JavaScript
- Expressões regulares (Regex)

---

# 4. Arquitetura

A arquitetura principal pode ser representada assim:

```text
                   ┌──────────────────────┐
                   │   Usuário Telegram   │
                   └──────────┬───────────┘
                              │
                              │ Relatório
                              ▼
                   ┌──────────────────────┐
                   │      server.js       │
                   │                      │
                   │ Telegram Bot         │
                   │ Sessões de usuários  │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   parserSipom.js     │
                   │                      │
                   │ Regex / Parsing      │
                   │ Objeto estruturado   │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ sipomAutomation.js   │
                   │                      │
                   │ Playwright           │
                   │ Navegador            │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │         SIPOM        │
                   └──────────────────────┘
```

---

# 5. Estrutura do projeto

A estrutura recomendada:

```text
robo-sipom/
│
├── server.js
├── parserSipom.js
├── sipomAutomation.js
│
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

### `server.js`

Responsável por:

- inicializar o servidor;
- inicializar o bot Telegram;
- receber mensagens;
- controlar as sessões;
- apresentar os menus;
- iniciar a automação.

### `parserSipom.js`

Responsável por:

- interpretar o relatório;
- extrair os campos;
- normalizar informações;
- gerar o objeto estruturado utilizado pela automação.

### `sipomAutomation.js`

Responsável por:

- abrir o navegador;
- acessar o SIPOM;
- preencher o formulário;
- preencher pessoas;
- preencher procedimento;
- preencher histórico;
- preencher materiais;
- preencher composição.

---

# 6. Pré-requisitos

Antes de iniciar, instale:

## Node.js

Recomenda-se Node.js 20 ou superior.

Verifique:

```bash
node --version
```

Exemplo:

```text
v20.x.x
```

Também é possível utilizar versões mais recentes do Node.js, desde que sejam compatíveis com as dependências do projeto.

---

## Google Chrome

O computador utilizado para executar a automação deve possuir o Google Chrome instalado.

Verifique se o navegador está instalado e funcionando normalmente.

---

## Conta do Telegram

Você precisa possuir uma conta do Telegram para:

- criar o bot;
- testar o bot;
- obter o `CHAT_ID`.

---

# 7. Criando o Bot do Telegram

A criação do bot é realizada pelo **BotFather**, ferramenta oficial do Telegram para gerenciamento de bots.

### Passo 1 — Abra o Telegram

Abra o aplicativo Telegram.

Na busca, procure:

```text
@BotFather
```

Confirme que está utilizando o BotFather oficial.

---

### Passo 2 — Inicie o BotFather

Envie:

```text
/start
```

O BotFather apresentará os comandos disponíveis.

---

### Passo 3 — Criar um novo bot

Envie:

```text
/newbot
```

O BotFather solicitará um nome para o bot.

Exemplo:

```text
Robo SIPOM
```

Depois será solicitado o username.

O username precisa terminar com:

```text
bot
```

Exemplo:

```text
robo_sipom_bot
```

Se o username estiver disponível, o BotFather criará o bot.

---

# 8. Obtendo o TELEGRAM_TOKEN

Depois da criação, o BotFather fornecerá um token semelhante a:

```text
123456789:AAExampleTokenXXXXXXXXXXXXXXXX
```

Esse valor é o:

```text
TELEGRAM_TOKEN
```

### ⚠️ IMPORTANTE

O token é uma credencial.

**Não publique o token no GitHub.**

Não coloque:

```js
const token = "123456789:AAExampleToken";
```

diretamente no código.

Utilize o arquivo `.env`.

---

# 9. Obtendo o TELEGRAM_CHAT_ID

O `TELEGRAM_CHAT_ID` identifica o chat que será utilizado pelo sistema.

Existem diferentes situações.

---

## Opção 1 — Chat privado

Abra o bot que você acabou de criar.

Clique em:

```text
Start
```

ou envie:

```text
/start
```

Depois você poderá utilizar a API do Telegram para consultar as atualizações recebidas pelo bot.

Uma forma prática é acessar:

```text
https://api.telegram.org/botSEU_TOKEN/getUpdates
```

Substitua:

```text
SEU_TOKEN
```

pelo token real.

Exemplo:

```text
https://api.telegram.org/bot123456789:AAExampleToken/getUpdates
```

Procure no resultado algo semelhante a:

```json
{
  "message": {
    "chat": {
      "id": 123456789,
      "type": "private"
    }
  }
}
```

O valor:

```text
123456789
```

é o:

```text
TELEGRAM_CHAT_ID
```

---

## ⚠️ Segurança

Não compartilhe publicamente uma URL contendo seu token.

Por exemplo, não publique:

```text
https://api.telegram.org/bot123456789:SEU_TOKEN/getUpdates
```

O token permite controlar o bot.

---

## Opção 2 — Grupo do Telegram

Se o bot estiver sendo utilizado em um grupo:

1. adicione o bot ao grupo;
2. envie uma mensagem no grupo;
3. consulte novamente `getUpdates`;
4. procure:

```json
"chat": {
  "id": -1001234567890,
  "title": "Nome do Grupo",
  "type": "supergroup"
}
```

Nesse caso, o `TELEGRAM_CHAT_ID` normalmente será um número negativo, frequentemente iniciado por:

```text
-100
```

Exemplo:

```text
TELEGRAM_CHAT_ID=-1001234567890
```

---

# 10. Criando o arquivo `.env`

Na raiz do projeto, crie:

```text
.env
```

Estrutura:

```text
robo-sipom/
├── server.js
├── parserSipom.js
├── sipomAutomation.js
├── package.json
├── .env
└── README.md
```

Dentro do `.env`:

```env
PORT=10000

TELEGRAM_TOKEN=SEU_TOKEN_AQUI

TELEGRAM_CHAT_ID=SEU_CHAT_ID_AQUI
```

Exemplo:

```env
PORT=10000

TELEGRAM_TOKEN=123456789:AAExampleTokenXXXXXXXXXXXXXXXX

TELEGRAM_CHAT_ID=123456789
```

---

# 11. Configuração segura do `.env`

O arquivo `.env` contém informações sensíveis.

Por isso, ele **não deve ser enviado para o GitHub**.

Crie um arquivo:

```text
.gitignore
```

Com:

```gitignore
node_modules/
.env
.env.local
.env.*.local
playwright-report/
test-results/
```

---

# 12. Criando o projeto

Abra o terminal.

Crie ou acesse a pasta:

```bash
mkdir robo-sipom
cd robo-sipom
```

Caso o projeto já exista:

```bash
cd robo-sipom
```

---

# 13. Inicializando o Node.js

Se ainda não existir `package.json`:

```bash
npm init -y
```

---

# 14. Instalando as dependências

Instale o Express:

```bash
npm install express
```

Instale o grammY:

```bash
npm install grammy
```

Instale dotenv:

```bash
npm install dotenv
```

Instale Playwright:

```bash
npm install playwright
```

---

# 15. Instalação dos navegadores do Playwright

Depois de instalar o Playwright:

```bash
npx playwright install
```

Caso o projeto utilize especificamente Chromium:

```bash
npx playwright install chromium
```

---

# 16. Verificando o package.json

Um `package.json` básico poderá conter:

```json
{
  "name": "robo-sipom",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "dotenv": "^17.0.0",
    "express": "^5.0.0",
    "grammy": "^1.0.0",
    "playwright": "^1.0.0"
  }
}
```

As versões exatas serão determinadas pelo `npm install`.

---

# 17. Configuração do `server.js`

O sistema deve carregar as variáveis do `.env`.

Exemplo:

```js
import "dotenv/config";

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log("Telegram configurado:", Boolean(token));
console.log("Chat ID configurado:", Boolean(chatId));
```

Não coloque o token diretamente no código.

---

# 18. Testando as variáveis de ambiente

Antes de executar toda a aplicação, confirme se o Node consegue ler o `.env`.

Execute:

```bash
node -e "import('dotenv/config').then(() => console.log({PORT: process.env.PORT, TOKEN_CONFIGURADO: !!process.env.TELEGRAM_TOKEN, CHAT_ID_CONFIGURADO: !!process.env.TELEGRAM_CHAT_ID}))"
```

O resultado esperado será semelhante a:

```text
{
  PORT: '10000',
  TOKEN_CONFIGURADO: true,
  CHAT_ID_CONFIGURADO: true
}
```

Não imprima o token real no terminal ou nos logs de produção.

---

# 19. Executando o Robô

Execute:

```bash
npm start
```

ou:

```bash
node server.js
```

Se tudo estiver correto, o bot deverá iniciar.

---

# 20. Primeiro teste

Abra o Telegram.

Procure pelo username criado anteriormente.

Exemplo:

```text
@robo_sipom_bot
```

Clique:

```text
Start
```

ou envie:

```text
/start
```

Depois:

```text
/menu
```

O bot deverá apresentar as opções disponíveis.

---

# 21. Fluxo de utilização

O fluxo esperado é:

```text
1. Usuário abre o bot
        ↓
2. /start
        ↓
3. /menu
        ↓
4. Usuário envia o relatório
        ↓
5. server.js recebe o texto
        ↓
6. parserSipom.js interpreta o relatório
        ↓
7. Dados são transformados em objeto
        ↓
8. Usuário seleciona a operação
        ↓
9. sipomAutomation.js inicia o navegador
        ↓
10. SIPOM é aberto
        ↓
11. Dados são preenchidos
```

---

# 22. Menu de operações

O projeto pode disponibilizar:

```text
🚀 1. Criar Ocorrência Completa

👥 2. Apenas Pessoas

⚖️ 3. Apenas Procedimento

📝 4. Apenas Histórico

📦 5. Apenas Materiais

🚔 6. Apenas Composição

⚡ 7. PREENCHER TUDO (Modais)
```

---

# 23. Parser do relatório

O `parserSipom.js` recebe o texto e transforma as informações em uma estrutura semelhante a:

```js
{
  fichaCiops: "...",
  naturezaSipom: "...",
  dataHoraFormatada: "...",
  rua: "...",
  numero: "...",
  bairro: "...",
  cidade: "...",
  opmLocal: "...",
  opmAtendeu: "...",
  viatura: "...",
  historico: "...",
  pessoas: [],
  procedimento: {},
  materiais: [],
  composicao: []
}
```

Essa estrutura é utilizada posteriormente pelo módulo de automação.

---

# 24. Automação com Playwright

O arquivo:

```text
sipomAutomation.js
```

é responsável pela interação com o navegador.

A automação pode:

- abrir o SIPOM;
- acessar a tela de ocorrência;
- preencher natureza;
- preencher data;
- preencher horário;
- preencher endereço;
- preencher viatura;
- preencher ficha CIOPS;
- preencher pessoas;
- preencher procedimento;
- preencher histórico;
- preencher materiais;
- preencher composição.

---

# 25. Navegador persistente

O projeto utiliza uma sessão persistente do navegador para permitir continuidade da interação.

Isso permite manter:

- cookies;
- sessão;
- autenticação;
- estado do navegador.

A ideia é evitar que o usuário precise realizar login novamente a cada etapa, desde que a sessão continue válida.

---

# 26. Fluxo manual de confirmação

Quando configurado para operação manual no Formulário 1, o comportamento é:

```text
Abrir SIPOM
      ↓
Preencher Formulário 1
      ↓
⏸️ Robô aguarda
      ↓
Usuário revisa
      ↓
Usuário avança manualmente
      ↓
Robô detecta as abas
      ↓
Preenche Pessoas
      ↓
Preenche Procedimento
      ↓
Preenche Histórico
      ↓
Preenche Materiais
      ↓
Preenche Composição
      ↓
⏸️ Robô aguarda revisão final
```

Esse modelo evita que o robô registre automaticamente uma ocorrência sem a conferência do operador.

---

# 27. Health Check

O servidor disponibiliza uma rota:

```text
GET /ping
```

Exemplo:

```text
http://localhost:10000/ping
```

Resposta esperada:

```json
{
  "status": "ok"
}
```

Essa rota pode ser utilizada por serviços de monitoramento para verificar se a aplicação está respondendo.

---

# 28. Executando em ambiente local

Para executar localmente:

```bash
npm install
```

Depois:

```bash
npx playwright install chromium
```

Configure:

```text
.env
```

E execute:

```bash
node server.js
```

---

# 29. Solução de problemas

## ❌ `TELEGRAM_TOKEN` não definido

Erro típico:

```text
TELEGRAM_TOKEN is undefined
```

Verifique:

```env
TELEGRAM_TOKEN=seu_token
```

Confirme também que o `.env` está na raiz do projeto.

---

## ❌ `TELEGRAM_CHAT_ID` não definido

Verifique:

```env
TELEGRAM_CHAT_ID=123456789
```

Se estiver utilizando grupo:

```env
TELEGRAM_CHAT_ID=-1001234567890
```

---

## ❌ Bot não responde

Verifique:

1. se o bot foi criado;
2. se o token está correto;
3. se o processo Node está executando;
4. se o usuário iniciou o bot com `/start`;
5. se não existe outro processo utilizando o mesmo bot;
6. se o token não foi revogado pelo BotFather.

---

## ❌ `getUpdates` não retorna mensagens

Primeiro envie uma mensagem para o bot:

```text
/start
```

Depois consulte novamente:

```text
https://api.telegram.org/botSEU_TOKEN/getUpdates
```

Não compartilhe essa URL contendo o token.

---

## ❌ Playwright não encontra o navegador

Execute:

```bash
npx playwright install chromium
```

Depois tente novamente:

```bash
node server.js
```

---

## ❌ Erro de importação

Se estiver utilizando:

```js
import { chromium } from "playwright";
```

o `package.json` deve possuir:

```json
{
  "type": "module"
}
```

---

## ❌ `viaturaMatch is not defined`

Esse erro ocorre quando o parser utiliza:

```js
viatura: viaturaMatch ? `Vtr ${viaturaMatch}` : "",
```

sem declarar previamente `viaturaMatch`.

A variável deve ser criada antes do `return`:

```js
const viaturaMatch =
  texto.match(/(?:Vtr|Viatura|VTR)\s*[:\-]?\s*([A-Za-z0-9\-]+)/i)?.[1] || "";
```

---

# 30. Segurança

## Nunca faça isso

```js
const TELEGRAM_TOKEN = "123456789:SECRET";
```

Também não faça commit de:

```text
.env
```

ou arquivos contendo:

- tokens;
- senhas;
- cookies;
- sessões;
- credenciais;
- dados operacionais;
- informações pessoais.

---

# 31. `.gitignore`

Recomenda-se:

```gitignore
node_modules/

.env
.env.local
.env.*.local

playwright-report/
test-results/

*.log

sessions/
session/
browser-data/
```

Se a automação criar uma pasta de perfil persistente do Chrome, ela também deve ser protegida e, conforme o caso, incluída no `.gitignore`.

---

# 32. Publicação no GitHub

Inicialize o Git:

```bash
git init
```

Adicione os arquivos:

```bash
git add .
```

Faça o primeiro commit:

```bash
git commit -m "Initial commit"
```

Adicione o repositório remoto:

```bash
git remote add origin URL_DO_REPOSITORIO
```

Envie:

```bash
git branch -M main
git push -u origin main
```

### Antes do `git push`

Execute:

```bash
git status
```

Confirme que:

```text
.env
```

**não aparece entre os arquivos que serão enviados.**

---

# 33. Desenvolvimento recomendado

Durante o desenvolvimento:

```text
Telegram
   ↓
server.js
   ↓
parserSipom.js
   ↓
dados estruturados
   ↓
sipomAutomation.js
   ↓
SIPOM
```

Evite misturar essas responsabilidades.

### `server.js`

Responsável pela comunicação.

### `parserSipom.js`

Responsável pela interpretação.

### `sipomAutomation.js`

Responsável pela automação.

Essa separação facilita manutenção, testes e identificação de erros.

---

# 34. Comandos úteis

### Instalar dependências

```bash
npm install
```

### Instalar Chromium

```bash
npx playwright install chromium
```

### Executar

```bash
npm start
```

ou:

```bash
node server.js
```

### Ver versão do Node

```bash
node -v
```

### Ver versão do npm

```bash
npm -v
```

### Verificar sintaxe de um arquivo

```bash
node --check server.js
```

Exemplo:

```bash
node --check parserSipom.js
```

```bash
node --check sipomAutomation.js
```

---

# 35. Checklist de instalação

Antes de considerar o Robô SIPOM configurado, confirme:

```text
[ ] Node.js instalado
[ ] Google Chrome instalado
[ ] Projeto clonado
[ ] npm install executado
[ ] Playwright instalado
[ ] Chromium instalado
[ ] Bot criado no BotFather
[ ] TELEGRAM_TOKEN obtido
[ ] Bot iniciado com /start
[ ] TELEGRAM_CHAT_ID obtido
[ ] Arquivo .env criado
[ ] TELEGRAM_TOKEN configurado
[ ] TELEGRAM_CHAT_ID configurado
[ ] .env incluído no .gitignore
[ ] server.js configurado
[ ] parserSipom.js configurado
[ ] sipomAutomation.js configurado
[ ] node server.js executado
[ ] Bot respondeu no Telegram
[ ] /ping respondeu corretamente
[ ] Teste de relatório realizado
```

---

# 36. Exemplo completo do `.env`

```env
PORT=10000

TELEGRAM_TOKEN=123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxx

TELEGRAM_CHAT_ID=123456789
```

> Substitua os valores pelos seus dados reais.

**Nunca publique esses valores em um repositório público.**

---

# 37. Fluxo completo do sistema

```text
                         ┌───────────────────┐
                         │      TELEGRAM     │
                         └─────────┬─────────┘
                                   │
                            Relatório
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     server.js     │
                         │                   │
                         │ Bot + Sessões    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  parserSipom.js   │
                         │                   │
                         │ Regex / Parsing   │
                         └─────────┬─────────┘
                                   │
                           Dados estruturados
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │  sipomAutomation.js     │
                     │                         │
                     │      Playwright         │
                     └────────────┬────────────┘
                                  │
                                  ▼
                         ┌───────────────────┐
                         │       SIPOM       │
                         │                   │
                         │ Formulário 1      │
                         │ Pessoas           │
                         │ Procedimento      │
                         │ Histórico         │
                         │ Materiais         │
                         │ Composição        │
                         └───────────────────┘
```

---

# 38. Considerações finais

O **Robô SIPOM** foi projetado para separar três responsabilidades principais:

```text
COMUNICAÇÃO
     ↓
server.js

INTERPRETAÇÃO
     ↓
parserSipom.js

AUTOMAÇÃO
     ↓
sipomAutomation.js
```

Essa arquitetura permite evoluir cada componente independentemente.

O Telegram funciona como interface de entrada e controle, o parser transforma o relatório em dados estruturados e o Playwright executa as ações necessárias no navegador.

Para ambientes operacionais, mantenha as credenciais fora do código-fonte, utilize `.env`, restrinja o acesso ao bot e mantenha o projeto em repositório privado.
