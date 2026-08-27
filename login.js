import { chromium } from 'playwright';

(async () => {
    // Abre o navegador visível (headless: false)
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🔗 Acessando o SIPOM...');
    await page.goto('https://sipom.pm.ce.gov.br');

    console.log('🔑 Faça o login e digite o OTP no navegador...');

    // Aguarda a URL contendo "ocorrencias" (com flexibilidade de barra e query params)
    // Timeout aumentado para 3 minutos (180000 ms) para dar tempo suficiente no OTP
    await page.waitForURL((url) => url.href.includes('/ocorrencias'), {
        timeout: 180000,
        waitUntil: 'domcontentloaded'
    });

    // Aguarda 3 segundos adicionais para garantir que os cookies e LocalStorage sejam gravados
    await page.waitForTimeout(3000);

    // Salva os cookies e sessão no arquivo JSON
    await context.storageState({ path: 'sipom_session.json' });
    console.log('✅ Sessão salva em "sipom_session.json" com sucesso!');

    await browser.close();
})();