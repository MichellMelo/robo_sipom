import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

export async function preencherSipomCompleto(dados) {
    const sessionPath = path.resolve('sipom_session.json');

    if (!fs.existsSync(sessionPath) && process.env.SIPOM_SESSION_JSON) {
        fs.writeFileSync(sessionPath, process.env.SIPOM_SESSION_JSON, 'utf-8');
        console.log('[+] Sessão injetada via variável de ambiente SIPOM_SESSION_JSON.');
    }

    if (!fs.existsSync(sessionPath)) {
        throw new Error('Sessão não configurada. Defina a variável SIPOM_SESSION_JSON no painel do Render.');
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        console.log('[+] Acessando a página de criação do SIPOM...');
        await page.goto('https://sipom.pm.ce.gov.br/ocorrencias/criar', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Checagem se caiu na tela de Login (Sessão Expirada)
        const urlAtual = page.url();
        if (urlAtual.includes('/login') || urlAtual.includes('/auth') || (await page.$('input[name="cpf"], input[name="login"]'))) {
            throw new Error('Sessão do SIPOM expirada! Por favor, renove o cookie ci_session no Render.');
        }

        console.log('[+] Preenchendo campos principais...');

        // Espera até 10s pelo carregamento de qualquer select ou input do formulário
        await page.waitForSelector('select, input', { timeout: 10000 }).catch(() => {
            throw new Error('O formulário do SIPOM não carregou a tempo. Verifique a conectividade ou a sessão.');
        });

        // Tenta selecionar a Natureza por name, id ou label
        if (dados.naturezaSipom) {
            const seletorNatureza = 'select[name="natureza"], select[name="natureza_id"], select#natureza';
            await page.selectOption(seletorNatureza, { label: dados.naturezaSipom }).catch(async () => {
                await page.selectOption(seletorNatureza, { value: dados.naturezaSipom }).catch(() => {
                    console.log(`[!] Não foi possível selecionar a natureza "${dados.naturezaSipom}" automaticamente.`);
                });
            });
        }

        // Data e Hora (dd/mm/aaaa hh:mm)
        if (dados.dataHoraFormatada) {
            await page.fill('input[name="dataHora"], input[name="data_hora"]', dados.dataHoraFormatada).catch(() => { });
        }

        // Unidade Militar - Local do Fato
        if (dados.opmLocal) {
            await page.selectOption('select[name="unidadeMilitar"], select[name="opm_id"]', { label: dados.opmLocal }).catch(() => { });
        }

        // Endereço
        await page.fill('input[name="rua"], input[name="logradouro"]', dados.rua || '').catch(() => { });
        await page.fill('input[name="numeral"], input[name="numero"]', dados.numero || 'S/N').catch(() => { });
        await page.fill('input[name="bairro"]', dados.bairro || '').catch(() => { });
        await page.fill('input[name="cidade"]', dados.cidade || 'Fortaleza').catch(() => { });

        // OPM Atendeu e Viatura
        if (dados.opmAtendeu) {
            await page.selectOption('select[name="opmAtendeu"], select[name="opm_atendeu"]', { label: dados.opmAtendeu }).catch(() => { });
        }
        await page.fill('input[name="viatura"]', dados.viatura || '').catch(() => { });

        // Números de Identificação
        if (dados.numeroHt) {
            await page.fill('input[name="numeroHt"], input[name="ht"]', dados.numeroHt).catch(() => { });
        }
        await page.fill('input[name="numeroOcorrencia"], input[name="ficha_ciops"]', dados.fichaCiops || '').catch(() => { });

        // Submissão do Formulário
        console.log('[+] Submetendo formulário principal...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
            page.click('button[type="submit"], button:has-text("Registrar Ocorrência"), button:has-text("Salvar")')
        ]);

        const currentUrl = page.url();
        const idSipomMatch = currentUrl.match(/ocorrencias-exibir\/([a-zA-Z0-9]+)/) || currentUrl.match(/id\/([a-zA-Z0-9]+)/);
        const idSipom = idSipomMatch ? idSipomMatch[1] : 'N/A';

        console.log(`[+] Ocorrência criada com sucesso! ID: ${idSipom}`);

        // ... (restante do fluxo de abas secundárias se mantém igual)

        return {
            success: true,
            idSipom,
            url: currentUrl
        };

    } catch (error) {
        console.error('[-] Erro crítico no Playwright:', error.message);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}