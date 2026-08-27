import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false }); // Abre a janela do navegador
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🔗 Acessando o SIPOM...');
    await page.goto('https://sipom.pm.ce.gov.br');

    console.log('🔑 Faça o login e digite o OTP manualmente no navegador...');

    // Aguarda você fazer o login e ser redirecionado para a tela inicial/home
    await page.waitForURL('**/ocorrencias/**', { timeout: 120000 });

    // Salva os cookies e LocalStorage
    await context.storageState({ path: 'sipom_session.json' });
    console.log('✅ Sessão salva em sipom_session.json com sucesso!');

    await browser.close();
})();