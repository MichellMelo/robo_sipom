import 'dotenv/config';
import express from 'express';
import { Bot, InlineKeyboard } from 'grammy';
import { parseRelatorioSipom } from './parserSipom.js';
import {
    obterPaginaGlobal,
    preencherFormulario1,
    preencherAbaPessoas,
    preencherModalProcedimento,
    preencherModalHistorico,
    preencherModalMaterial,
    preencherModalComposicao,
    preencherSipomCompleto
} from './sipomAutomation.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração do Express para JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check / Ping
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

// Guarda o relatório processado na sessão em memória por Chat ID
const sessoesUsuarios = new Map();

// Constrói os botões do Menu no Telegram
function criarMenuOpcoes() {
    return new InlineKeyboard()
        .text('1. Criar Ocorrência Completa', 'opcao_1').row()
        .text('2. Preencher Apenas Pessoas', 'opcao_2')
        .text('3. Preencher Apenas Procedimento', 'opcao_3').row()
        .text('4. Preencher Apenas Histórico', 'opcao_4')
        .text('5. Preencher Apenas Materiais', 'opcao_5').row()
        .text('6. Preencher Apenas Composições', 'opcao_6').row()
        .text('🚀 7. FAZER TUDO AGORA (Modais)', 'opcao_7');
}

// Tratador global de erros do Bot
bot.catch((err) => {
    console.error('[!] Erro no bot do Telegram:', err.error?.message || err.message);
});

// Manipulador de mensagens recebidas no Telegram
bot.on('message:text', async (ctx) => {
    const textoMensagem = ctx.message.text;

    if (textoMensagem === '/start') {
        return ctx.reply('👋 Olá! Envie o relatório da ocorrência em texto para iniciar o cadastro no SIPOM.');
    }

    console.log(`[+] Mensagem recebida do usuário ${ctx.from.username || ctx.from.id}`);

    try {
        // 1. Parser: Extrai o relatório para objeto em memória
        const dadosEstruturados = parseRelatorioSipom(textoMensagem);
        sessoesUsuarios.set(ctx.chat.id, dadosEstruturados);

        console.log('[+] Dados extraídos com sucesso:', dadosEstruturados.fichaCiops || 'Sem Ficha');

        // 2. Exibe o Menu Inline no Telegram
        await ctx.reply(
            `📄 *RELATÓRIO CARREGADO COM SUCESSO!*\n\n` +
            `📌 *Ficha CIOPS:* \`${dadosEstruturados.fichaCiops || 'S/N'}\`\n` +
            `🚔 *Natureza:* ${dadosEstruturados.naturezaSipom || 'N/A'}\n\n` +
            `Escolha uma opção de execução no menu abaixo:`,
            {
                parse_mode: 'Markdown',
                reply_markup: criarMenuOpcoes()
            }
        );
    } catch (error) {
        console.error('[-] Erro ao ler relatório:', error.message);
        await ctx.reply(`❌ *Erro ao processar relatório:* ${error.message}`, { parse_mode: 'Markdown' });
    }
});

// Manipulador de cliques nos botões do Menu
bot.on('callback_query:data', async (ctx) => {
    const chatId = ctx.chat.id;
    const opcao = ctx.callbackQuery.data;
    const dados = sessoesUsuarios.get(chatId);

    if (!dados) {
        await ctx.answerCallbackQuery({ text: 'Sessão expirada. Reenvie o relatório no chat.', show_alert: true });
        return;
    }

    await ctx.answerCallbackQuery({ text: 'Iniciando automação...' });
    await ctx.reply(`⏳ *Executando a opção selecionada no SIPOM...*`, { parse_mode: 'Markdown' });

    try {
        const page = await obterPaginaGlobal();

        if (opcao === 'opcao_1') {
            const res = await preencherSipomCompleto(dados);
            await ctx.reply(`✅ *Ocorrência Completa Registrada!*\n📌 *ID:* \`${res.idSipom}\`\n🔗 [Visualizar Ocorrência](${res.url})`, { parse_mode: 'Markdown', disable_web_page_preview: true });
        } else if (opcao === 'opcao_2') {
            await preencherAbaPessoas(page, dados);
            await ctx.reply('✅ *Aba Pessoas preenchida com sucesso!*', { parse_mode: 'Markdown' });
        } else if (opcao === 'opcao_3') {
            await preencherModalProcedimento(page, dados.procedimento);
            await ctx.reply('✅ *Modal Procedimento preenchido com sucesso!*', { parse_mode: 'Markdown' });
        } else if (opcao === 'opcao_4') {
            await preencherModalHistorico(page, dados.historico);
            await ctx.reply('✅ *Modal Histórico preenchido com sucesso!*', { parse_mode: 'Markdown' });
        } else if (opcao === 'opcao_5') {
            await preencherModalMaterial(page, dados.materiais);
            await ctx.reply('✅ *Modal Materiais preenchido com sucesso!*', { parse_mode: 'Markdown' });
        } else if (opcao === 'opcao_6') {
            await preencherModalComposicao(page, dados.composicao);
            await ctx.reply('✅ *Modal Composição preenchido com sucesso!*', { parse_mode: 'Markdown' });
        } else if (opcao === 'opcao_7') {
            await preencherAbaPessoas(page, dados);
            if (dados.procedimento) await preencherModalProcedimento(page, dados.procedimento);
            if (dados.historico) await preencherModalHistorico(page, dados.historico);
            if (dados.materiais) await preencherModalMaterial(page, dados.materiais);
            if (dados.composicao) await preencherModalComposicao(page, dados.composicao);
            await ctx.reply('🎉 *TODOS OS MODAIS FORAM PREENCHIDOS E GRAVADOS COM SUCESSO!*', { parse_mode: 'Markdown' });
        }

        await ctx.reply('Deseja realizar mais alguma ação nesta mesma ocorrência?', {
            reply_markup: criarMenuOpcoes()
        });

    } catch (error) {
        console.error('[-] Erro na automação local:', error.message);
        await ctx.reply(`❌ *Falha na Automação:* ${error.message}`, { parse_mode: 'Markdown' });
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

// Encerramento limpo
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