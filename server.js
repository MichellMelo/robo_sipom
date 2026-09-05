import 'dotenv/config';
import express from 'express';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { parseRelatorioSipom } from './parserSipom.js';
import {
    obterPaginaGlobal,
    preencherAbaPessoas,
    preencherModalProcedimento,
    preencherModalHistorico,
    preencherModalMaterial,
    preencherModalComposicao,
    preencherSipomCompleto,
    salvarOcorrenciaFinal
} from './sipomAutomation.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.status(200).send('pong'));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
    console.error('[-] ERRO CRÍTICO: TELEGRAM_TOKEN não configurado nas variáveis de ambiente.');
    process.exit(1);
}

const bot = new Bot(TELEGRAM_TOKEN);
const sessoesUsuarios = new Map();

// Helper para escapar HTML em strings dinâmicas (evita quebrar a formatação)
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// -------------------------------------------------------------
// MENUS DE NAVEGAÇÃO
// -------------------------------------------------------------

function criarMenuTecladoFixo() {
    return new Keyboard()
        .text('🚀 Criar Ocorrência Completa').row()
        .text('👥 Pessoas').text('⚖️ Procedimento').row()
        .text('📝 Histórico').text('📦 Materiais').row()
        .text('🚔 Composição').text('⚡ Preencher Tudo (Modais)').row()
        .resized();
}

function criarMenuInline() {
    return new InlineKeyboard()
        .text('🚀 1. Criar Ocorrência Completa', 'opcao_1').row()
        .text('👥 2. Pessoas', 'opcao_2')
        .text('⚖️ 3. Procedimento', 'opcao_3').row()
        .text('📝 4. Histórico', 'opcao_4')
        .text('📦 5. Materiais', 'opcao_5').row()
        .text('🚔 6. Composição', 'opcao_6').row()
        .text('⚡ 7. PREENCHER TUDO (Modais)', 'opcao_7');
}

bot.api.setMyCommands([
    { command: 'start', description: 'Iniciar o robô e exibir o menu' },
    { command: 'menu', description: 'Reexibir botões de comando' },
    { command: 'cancelar', description: 'Encerrar e limpar a sessão atual' }
]).catch(err => console.error('⚠️ Falha ao registrar comandos nativos:', err.message));

bot.catch((err) => {
    console.error('[!] Erro no bot do Telegram:', err.error?.message || err.message);
});

// -------------------------------------------------------------
// COMANDOS
// -------------------------------------------------------------

bot.command(['start', 'menu'], async (ctx) => {
    const msg =
        `🤖 <b>Bem-vindo ao Robô de Automação do SIPOM!</b>\n\n` +
        `Para dar início ao cadastro:\n` +
        `1. Envie o <b>texto do relatório da ocorrência</b> diretamente neste chat.\n` +
        `2. O robô extrairá os dados e abrirá o navegador.\n` +
        `3. Utilize os botões para disparar as ações no SIPOM.`;

    return ctx.reply(msg, {
        parse_mode: 'HTML',
        reply_markup: criarMenuTecladoFixo()
    });
});

bot.command('cancelar', async (ctx) => {
    const chatId = ctx.chat.id;
    if (sessoesUsuarios.has(chatId)) {
        sessoesUsuarios.delete(chatId);
        return ctx.reply('🧹 <b>Sessão encerrada e dados limpos com sucesso!</b>', { parse_mode: 'HTML' });
    }
    return ctx.reply('⚠️ Nenhuma sessão ativa encontrada para ser limpa.');
});

// -------------------------------------------------------------
// NÚCLEO DE EXECUÇÃO DAS AÇÕES NO SIPOM
// -------------------------------------------------------------

async function executarAcaoSipom(ctx, opcao, dados) {
    await ctx.reply('⏳ <b>Executando ação no SIPOM... Por favor, aguarde.</b>', { parse_mode: 'HTML' });

    try {
        const page = await obterPaginaGlobal();

        if (opcao === 'opcao_1') {
            const res = await preencherSipomCompleto(dados);
            const urlSafe = escapeHtml(res?.url || '');
            await ctx.reply(
                `✅ <b>Ocorrência Registrada com Sucesso!</b>\n\n🔗 ${urlSafe}`,
                { parse_mode: 'HTML', disable_web_page_preview: true }
            );
        } else if (opcao === 'opcao_2') {
            await preencherAbaPessoas(page, dados);
            await ctx.reply('✅ <b>Aba Pessoas preenchida com sucesso!</b>', { parse_mode: 'HTML' });
        } else if (opcao === 'opcao_3') {
            await preencherModalProcedimento(page, dados.procedimento);
            await ctx.reply('✅ <b>Modal Procedimento preenchido com sucesso!</b>', { parse_mode: 'HTML' });
        } else if (opcao === 'opcao_4') {
            await preencherModalHistorico(page, dados.historico);
            await ctx.reply('✅ <b>Modal Histórico preenchido com sucesso!</b>', { parse_mode: 'HTML' });
        } else if (opcao === 'opcao_5') {
            if (!dados.materiais || dados.materiais.length === 0) {
                await ctx.reply('⚠️ <b>Nenhum material/veículo identificado no relatório.</b>', { parse_mode: 'HTML' });
            } else {
                await preencherModalMaterial(page, dados.materiais);
                await ctx.reply('✅ <b>Modal Materiais preenchido com sucesso!</b>', { parse_mode: 'HTML' });
            }
        } else if (opcao === 'opcao_6') {
            if (!dados.composicao || dados.composicao.length === 0) {
                await ctx.reply('⚠️ <b>Nenhuma composição identificada no relatório.</b>', { parse_mode: 'HTML' });
            } else {
                await preencherModalComposicao(page, dados.composicao);
                await ctx.reply('✅ <b>Modal Composição preenchido com sucesso!</b>', { parse_mode: 'HTML' });
            }
        } else if (opcao === 'opcao_7') {
            await preencherAbaPessoas(page, dados);
            if (dados.procedimento) await preencherModalProcedimento(page, dados.procedimento);
            if (dados.historico) await preencherModalHistorico(page, dados.historico);
            if (dados.materiais && dados.materiais.length > 0) await preencherModalMaterial(page, dados.materiais);
            if (dados.composicao && dados.composicao.length > 0) await preencherModalComposicao(page, dados.composicao);

            if (typeof salvarOcorrenciaFinal === 'function') {
                await salvarOcorrenciaFinal(page);
            }

            await ctx.reply('🎉 <b>TODOS OS MODAIS FORAM PREENCHIDOS E GRAVADOS COM SUCESSO!</b>', { parse_mode: 'HTML' });
        }

        await ctx.reply('Deseja realizar mais alguma ação nesta ocorrência?', {
            reply_markup: criarMenuInline()
        });

    } catch (error) {
        console.error('[-] Erro durante a automação:', error.message);
        await ctx.reply(`❌ <b>Falha na Automação:</b> ${escapeHtml(error.message)}`, { parse_mode: 'HTML' });
    }
}

// -------------------------------------------------------------
// ESCUTA DE MENSAGENS E BOTÕES DO TECLADO FIXO
// -------------------------------------------------------------

bot.on('message:text', async (ctx) => {
    const textoMensagem = ctx.message.text.trim();

    if (textoMensagem.startsWith('/')) return;

    const chatId = ctx.chat.id;

    // 1. Mapeamento dos botões do teclado fixo
    let acaoBotao = null;
    if (textoMensagem === '🚀 Criar Ocorrência Completa') acaoBotao = 'opcao_1';
    else if (textoMensagem === '👥 Pessoas') acaoBotao = 'opcao_2';
    else if (textoMensagem === '⚖️ Procedimento') acaoBotao = 'opcao_3';
    else if (textoMensagem === '📝 Histórico') acaoBotao = 'opcao_4';
    else if (textoMensagem === '📦 Materiais') acaoBotao = 'opcao_5';
    else if (textoMensagem === '🚔 Composição' || textoMensagem === '🚔 Composição') acaoBotao = 'opcao_6';
    else if (textoMensagem === '⚡ Preencher Tudo (Modais)') acaoBotao = 'opcao_7';

    if (acaoBotao) {
        const dados = sessoesUsuarios.get(chatId);
        if (!dados) {
            return ctx.reply('⚠️ <b>Sessão não encontrada ou expirada.</b> Envie o texto do relatório novamente no chat.', {
                parse_mode: 'HTML',
                reply_markup: criarMenuTecladoFixo()
            });
        }
        return executarAcaoSipom(ctx, acaoBotao, dados);
    }

    // 2. Processamento como novo relatório
    console.log(`\n[+] Recebendo novo relatório do Chat ID: ${chatId}`);
    await ctx.reply('📥 <b>Relatório recebido!</b> Extraindo dados e preparando o navegador...', { parse_mode: 'HTML' });

    try {
        const dadosEstruturados = parseRelatorioSipom(textoMensagem);
        sessoesUsuarios.set(chatId, dadosEstruturados);

        console.log(`[+] Sessão salva para Chat ID: ${chatId}. Ficha CIOPS: ${dadosEstruturados.fichaCiops || 'S/N'}`);
        console.log('[+] Verificando/Lançando navegador Chrome...');
        await obterPaginaGlobal();

        const fichaSafe = escapeHtml(dadosEstruturados.fichaCiops || 'S/N');
        const naturezaSafe = escapeHtml(dadosEstruturados.naturezaSipom || 'N/A');

        await ctx.reply(
            `📄 <b>RELATÓRIO CARREGADO E NAVEGADOR PRONTO!</b>\n\n` +
            `📌 <b>Ficha CIOPS:</b> <code>${fichaSafe}</code>\n` +
            `⚖️ <b>Natureza:</b> ${naturezaSafe}\n\n` +
            `Escolha uma opção nos botões abaixo ou no teclado para preencher no SIPOM:`,
            {
                parse_mode: 'HTML',
                reply_markup: criarMenuInline()
            }
        );
    } catch (error) {
        console.error('[-] Erro ao processar relatório:', error.message);
        await ctx.reply(`❌ <b>Falha ao iniciar:</b> ${escapeHtml(error.message)}`, { parse_mode: 'HTML' });
    }
});

// -------------------------------------------------------------
// ESCUTA DE CALLBACK QUERIES (BOTÕES EMBUTIDOS/INLINE)
// -------------------------------------------------------------

bot.on('callback_query:data', async (ctx) => {
    const chatId = ctx.chat.id;
    const opcao = ctx.callbackQuery.data;
    const dados = sessoesUsuarios.get(chatId);

    if (!dados) {
        await ctx.answerCallbackQuery({ text: 'Sessão expirada. Reenvie o relatório no chat.', show_alert: true });
        return;
    }

    await ctx.answerCallbackQuery({ text: 'Executando no SIPOM...' });
    await executarAcaoSipom(ctx, opcao, dados);
});

// -------------------------------------------------------------
// INICIALIZAÇÃO
// -------------------------------------------------------------

app.listen(PORT, () => console.log(`🤖 Servidor do Robô SIPOM rodando na porta ${PORT}`));

bot.start({
    onStart: async (botInfo) => {
        console.log(`[+] Bot do Telegram @${botInfo.username} conectado com sucesso!`);

        const chatIdPadrao = process.env.TELEGRAM_CHAT_ID;
        if (chatIdPadrao) {
            try {
                await bot.api.sendMessage(
                    chatIdPadrao,
                    '👋 <b>Servidor do Robô SIPOM Ativo e Aguardando!</b>\n\nEnvie o texto do relatório da ocorrência para iniciarmos.',
                    { parse_mode: 'HTML' }
                );
            } catch (err) {
                console.warn('⚠️ Nota sobre envio de mensagem automática:', err.message);
            }
        }
    }
}).catch((err) => {
    console.error('[-] Falha ao conectar ao Polling do Telegram:', err.message);
});