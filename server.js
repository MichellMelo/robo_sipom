import express from 'express';
import { Bot } from 'grammy';
import { parseRelatorioSipom } from './parserSipom.js';
import { preencherSipomCompleto } from './sipomAutomation.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

// Endpoint de Health Check (Integrado ao Cron-Job.org)
app.get('/ping', (req, res) => res.status(200).send('pong'));

if (TELEGRAM_TOKEN) {
    const bot = new Bot(TELEGRAM_TOKEN);

    bot.command('start', (ctx) => {
        return ctx.reply('👋 Envie o relatório de ocorrência textual para automação no SIPOM.');
    });

    bot.on('message:text', async (ctx) => {
        if (ctx.message.text.startsWith('/')) return;

        try {
            await ctx.reply('⏳ Analisando texto e iniciando preenchimento no SIPOM...');

            const dadosTratados = parseRelatorioSipom(ctx.message.text);
            const resultado = await preencherSipomCompleto(dadosTratados);

            await ctx.reply(`✅ *Ocorrência Registrada com Sucesso!*\n\n📌 *ID SIPOM:* \`${resultado.idSipom}\``);
        } catch (err) {
            console.error('Erro na automação:', err);
            await ctx.reply(`❌ *Falha no Preenchimento:* ${err.message}`);
        }
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    bot.start();
}

app.listen(PORT, () => {
    console.log(`🤖 Servidor do Robô SIPOM rodando na porta ${PORT}`);
});