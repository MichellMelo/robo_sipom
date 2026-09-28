# 🤖 Robô SIPOM - Automação de Registro de Ocorrências

> Bot do Telegram e automação web para extração de relatórios operacionais e preenchimento automatizado no sistema SIPOM.

O **Robô SIPOM** é uma solução desenvolvida para automatizar a inserção de dados de relatórios operacionais e de inteligência no sistema **SIPOM**. A partir do envio de um relatório em texto via Telegram, a aplicação realiza o _parsing_ (extração e estruturação) das informações e dispara rotinas de automação no navegador Google Chrome para preenchimento dos modais e abas do sistema.

---

## 🚀 Funcionalidades Principais

- **Parser Inteligente de Relatórios:** Extração automática de dados como Ficha CIOPS, Natureza da ocorrência, Pessoas envolvidas, Procedimento, Histórico, Materiais/Veículos apreendidos e Composição da composição/equipe.
- **Menu de Botões Interativo (Telegram):**
  - **Menu Fixo (`Reply Keyboard`):** Botões no teclado para seleção rápida das etapas.
  - **Menu Embutido (`Inline Keyboard`):** Seleção de opções diretamente na mensagem.
- **Automação Granular ou Completa:**
  - **Preencher Tudo (Modais):** Execução em lote de todas as etapas.
  - **Execução Módular:** Opção de preencher apenas abas específicas (ex: apenas _Pessoas_, apenas _Materiais_, apenas _Histórico_).
- **Navegador Persistente (`ObterPaginaGlobal`):** Mantém a sessão do Chrome ativa durante a interação para navegação contínua entre telas.
- **Monitoramento e Health Check:** Rota HTTP `GET /ping` para garantia de _uptime_ e prevenção de suspensão de contêineres (_sleep_).

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** (v20+)
- **grammY** (Framework moderno e tipado para bots do Telegram)
- **Puppeteer / Playwright** (Automação e raspagem web no Chrome)
- **Express.js** (Servidor HTTP para rotas de controle e health check)
- **dotenv** (Gerenciamento de variáveis de ambiente)

---

## 📦 Estrutura do Projeto

```text
├── server.js               # Servidor Express, inicialização do Bot e manipulação do Telegram
├── parserSipom.js          # Lógica de regex/parsing do texto bruto para objeto JSON
├── sipomAutomation.js      # Scripts de automação web (Puppeteer/Playwright)
├── .env                    # Variáveis de ambiente locais
├── package.json            # Dependências do projeto e scripts de execução
└── README.md               # Documentação do projeto

⚙️ Configuração e Instalação

1. Pré-requisitos
Node.js v18 ou superior instalado.

Google Chrome instalado no ambiente de execução.

Token de Bot obtido junto ao @BotFather no Telegram.

2. Instalação de Dependências

Bash
# Clone o repositório
git clone [https://github.com/seu-usuario/robo-sipom.git](https://github.com/seu-usuario/robo-sipom.git)

# Acesse a pasta do projeto
cd robo-sipom

# Instale os pacotes
npm install

3. Configuração do Arquivo .env
Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

Snippet de código

PORT=10000
TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyZ
TELEGRAM_CHAT_ID=123456789 # Opcional: ID do chat para notificações automáticas

4. Executando a Aplicação

Bash
# Iniciar o servidor e o bot
node server.js

📋 Fluxo de Utilização (Telegram)
Início: Envie o comando /start ou /menu no Telegram para exibir as instruções e ativar os botões.

Envio do Relatório: Cole o texto do relatório operacional na conversa.

Leitura e Extração: O robô confirma o recebimento, executa a extração dos dados (Ficha CIOPS, Natureza, etc.) e lança a instância do navegador.

Execução: Selecione a opção no menu para iniciar o preenchimento no SIPOM:

🚀 1. Criar Ocorrência Completa

👥 2. Apenas Pessoas

⚖️ 3. Apenas Procedimento

📝 4. Apenas Histórico

📦 5. Apenas Materiais

🚔 6. Apenas Composição

⚡ 7. PREENCHER TUDO (Modais)

🖥️ Arquitetura dos Módulos
Plaintext
[ Telegram User ] ──> ( Texto do Relatório ) ──> [ server.js ]
                                                       │
                                            ┌──────────┴──────────┐
                                            ▼                     ▼
                                  [ parserSipom.js ]     [ sessoesUsuarios (Map) ]
                                            │                     │
                                            └──────────┬──────────┘
                                                       ▼
                                            [ sipomAutomation.js ]
                                                       │
                                                       ▼
                                           [ Navegador / SIPOM Web ]

🛡️ Licença e Segurança
Projeto de uso privado e restrito a operadores autorizados. Não inclua credenciais operacionais nem tokens do Telegram diretamente no código-fonte.
```
