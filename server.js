import 'dotenv/config';
import express from 'express';
import { Bot } from 'grammy';
import { parseRelatorioSipom } from './parserSipom.js';
import { preencherSipomCompleto } from './sipomAutomation.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do Express para JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check / Ping (para o cron-job.org e validação do Render)
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Inicialização do Bot do Telegram via grammY
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
    console.error('[-] ERRO CRÍTICO: TELEGRAM_TOKEN não configurado nas variáveis de ambiente.');
    process.exit(1);
}

const bot = new Bot(TELEGRAM_TOKEN);

// Tratador global de erros do Bot (impede que exceções no Polling derrubem o servidor)
bot.catch((err) => {
    console.error('[!] Erro no bot do Telegram:', err.error?.message || err.message);
});

// Manipulador de mensagens recebidas no Telegram
bot.on('message:text', async (ctx) => {
    const textoMensagem = ctx.message.text;

    // Ignora o comando de inicialização padrão do Telegram
    if (textoMensagem === '/start') {
        return ctx.reply('👋 Olá! Envie o relatório da ocorrência em texto para iniciar o cadastro automático no SIPOM.');
    }

    console.log(`[+] Mensagem recebida do usuário ${ctx.from.username || ctx.from.id}`);
    await ctx.reply('⏳ *Analisando relatório e iniciando preenchimento no SIPOM...*', { parse_mode: 'Markdown' });

    try {
        // 1. Parser: Converte o texto bruto do relatório em objeto JSON estruturado
        const dadosEstruturados = parseRelatorioSipom(textoMensagem);
        console.log('[+] Dados extraídos com sucesso:', dadosEstruturados.fichaCiops || 'Sem Ficha');

        // 2. Playwright: Executa a automação no SIPOM
        const resultado = await preencherSipomCompleto(dadosEstruturados);

        if (resultado.success) {
            const mensagemSucesso =
                `✅ *Ocorrência Registrada com Sucesso!*\n\n` +
                `📌 *ID SIPOM:* \`${resultado.idSipom}\`\n` +
                `🔗 *URL:* [Visualizar Ocorrência](${resultado.url})`;

            await ctx.reply(mensagemSucesso, { parse_mode: 'Markdown', disable_web_page_preview: true });
        }
    } catch (error) {
        console.error('[-] Erro ao processar ocorrência:', error.message);

        await ctx.reply(
            `❌ *Falha no Preenchimento:*\n\`${error.message}\`\n\n` +
            `_Verifique se a sessão do SIPOM está válida na variável SIPOM_SESSION_JSON e tente novamente._`,
            { parse_mode: 'Markdown' }
        );
    }
});

// Inicialização do servidor HTTP Express
const server = app.listen(PORT, () => {
    console.log(`🤖 Servidor do Robô SIPOM rodando na porta ${PORT}`);
});

// Inicialização do Polling do Telegram
bot.start().then(() => {
    console.log('[+] Bot do Telegram conectado com sucesso via grammY!');
}).catch((err) => {
    console.error('[-] Falha ao conectar ao Polling do Telegram:', err.message);
});

// -------------------------------------------------------------
// GRACEFUL SHUTDOWN (Encerramento Limpo para Render / Docker)
// -------------------------------------------------------------
const encerrarServico = async (sinal) => {
    console.log(`\n[!] Recebido sinal ${sinal}. Encerrando o robô graciosamente...`);

    try {
        await bot.stop();
        console.log('[+] Polling do Telegram interrompido.');
    } catch (err) {
        console.error('[-] Erro ao parar polling do Telegram:', err.message);
    }

    server.close(() => {
        console.log('[+] Servidor HTTP encerrado.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => encerrarServico('SIGTERM'));
process.on('SIGINT', () => encerrarServico('SIGINT'));