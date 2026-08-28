import 'dotenv/config';
import express from 'express';
import { Bot, InlineKeyboard } from 'grammy';
import { parseRelatorioSipom } from './parserSipom.js';
import {
    obterPaginaGlobal,
    preencherAbaPessoas,
    preencherModalProcedimento,
    preencherModalHistorico,
    preencherModalMaterial,
    preencherModalComposicao,
    preencherSipomCompleto
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

bot.catch((err) => {
    console.error('[!] Erro no bot do Telegram:', err.error?.message || err.message);
});

// RECEBIMENTO DO RELATÓRIO E ABERTURA DO NAVEGADOR
bot.on('message:text', async (ctx) => {
    const textoMensagem = ctx.message.text;

    if (textoMensagem === '/start') {
        return ctx.reply('👋 Olá! Envie o texto do relatório da ocorrência para darmos início ao cadastro no SIPOM.');
    }

    console.log(`\n[+] Mensagem recebida do usuário ${ctx.from.username || ctx.from.id}`);
    await ctx.reply('📥 *Relatório recebido!* Extraindo dados e abrindo o navegador Chrome...', { parse_mode: 'Markdown' });

    try {
        const dadosEstruturados = parseRelatorioSipom(textoMensagem);
        sessoesUsuarios.set(ctx.chat.id, dadosEstruturados);

        console.log('[+] Dados extraídos com sucesso. Ficha CIOPS:', dadosEstruturados.fichaCiops || 'S/N');

        console.log('[+] Lançando o navegador Chrome...');
        await obterPaginaGlobal();

        await ctx.reply(
            `📄 *RELATÓRIO CARREGADO E NAVEGADOR PRONTO!*\n\n` +
            `📌 *Ficha CIOPS:* \`${dadosEstruturados.fichaCiops || 'S/N'}\`\n` +
            `ótimo *Natureza:* ${dadosEstruturados.naturezaSipom || 'N/A'}\n\n` +
            `Escolha uma opção no menu abaixo para preencher no SIPOM:`,
            {
                parse_mode: 'Markdown',
                reply_markup: criarMenuOpcoes()
            }
        );
    } catch (error) {
        console.error('[-] Erro ao processar ou abrir o navegador:', error.message);
        await ctx.reply(`❌ *Falha ao iniciar:* ${error.message}`, { parse_mode: 'Markdown' });
    }
});

// EXECUÇÃO DAS AÇÕES DO MENU
bot.on('callback_query:data', async (ctx) => {
    const chatId = ctx.chat.id;
    const opcao = ctx.callbackQuery.data;
    const dados = sessoesUsuarios.get(chatId);

    if (!dados) {
        await ctx.answerCallbackQuery({ text: 'Sessão expirada. Reenvie o relatório no chat.', show_alert: true });
        return;
    }

    await ctx.answerCallbackQuery({ text: 'Executando no SIPOM...' });
    await ctx.reply(`⏳ *Preenchendo no SIPOM...*`, { parse_mode: 'Markdown' });

    try {
        const page = await obterPaginaGlobal();

        if (opcao === 'opcao_1') {
            const res = await preencherSipomCompleto(dados);

            // Sanitiza strings em Markdown para evitar o erro 400 Bad Request do grammY
            const urlFormatada = res?.url ? res.url.replace(/_/g, '\\_') : '';
            await ctx.reply(
                `✅ *Ocorrência Registrada com Sucesso!*\n\n🔗 ${urlFormatada}`,
                { parse_mode: 'Markdown', disable_web_page_preview: true }
            );
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
            if (!dados.materiais || dados.materiais.length === 0) {
                await ctx.reply('⚠️ *Nenhum material/veículo identificado no relatório.*', { parse_mode: 'Markdown' });
            } else {
                await preencherModalMaterial(page, dados.materiais);
                await ctx.reply('✅ *Modal Materiais preenchido com sucesso!*', { parse_mode: 'Markdown' });
            }
        } else if (opcao === 'opcao_6') {
            if (!dados.composicao || dados.composicao.length === 0) {
                await ctx.reply('⚠️ *Nenhuma composição identificada no relatório.*', { parse_mode: 'Markdown' });
            } else {
                await preencherModalComposicao(page, dados.composicao);
                await ctx.reply('✅ *Modal Composição preenchido com sucesso!*', { parse_mode: 'Markdown' });
            }
        } else if (opcao === 'opcao_7') {
            await preencherAbaPessoas(page, dados);
            if (dados.procedimento) await preencherModalProcedimento(page, dados.procedimento);
            if (dados.historico) await preencherModalHistorico(page, dados.historico);
            if (dados.materiais && dados.materiais.length > 0) await preencherModalMaterial(page, dados.materiais);
            if (dados.composicao && dados.composicao.length > 0) await preencherModalComposicao(page, dados.composicao);
            await ctx.reply('🎉 *TODOS OS MODAIS FORAM PREENCHIDOS E GRAVADOS COM SUCESSO!*', { parse_mode: 'Markdown' });
        }

        await ctx.reply('Deseja realizar mais alguma ação nesta mesma ocorrência?', {
            reply_markup: criarMenuOpcoes()
        });

    } catch (error) {
        console.error('[-] Erro na automação:', error.message);
        await ctx.reply(`❌ *Falha na Automação:* ${error.message}`, { parse_mode: 'Markdown' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`🤖 Servidor do Robô SIPOM rodando na porta ${PORT}`);
});

// INICIALIZAÇÃO DO BOT
bot.start({
    onStart: async (botInfo) => {
        console.log(`[+] Bot do Telegram @${botInfo.username} conectado com sucesso!`);

        const chatIdPadrao = process.env.TELEGRAM_CHAT_ID;
        if (chatIdPadrao) {
            try {
                await bot.api.sendMessage(
                    chatIdPadrao,
                    '👋 *Servidor do Robô SIPOM Ativo e Aguardando!*\n\nEnvie o texto do relatório da ocorrência para iniciarmos.',
                    { parse_mode: 'Markdown' }
                );
            } catch (err) {
                console.warn('⚠️ Nota sobre envio de mensagem automática:', err.message);
            }
        }
    }
}).catch((err) => {
    console.error('[-] Falha ao conectar ao Polling do Telegram:', err.message);
});