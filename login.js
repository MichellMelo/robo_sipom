import { chromium } from 'playwright';
import path from 'path';
import 'dotenv/config';

async function autenticarEGuardarSessao() {
    const usuario = process.env.SIPOM_USER;
    const senha = process.env.SIPOM_PASS;

    if (!usuario || !senha) {
        console.error('❌ ERRO: Defina SIPOM_USER e SIPOM_PASS no seu arquivo .env');
        process.exit(1);
    }

    console.log('[+] Lançando o Google Chrome...');

    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized']
    });

    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    console.log('[+] Acessando a tela de login do SIPOM...');
    await page.goto('https://sipom.pm.ce.gov.br', { waitUntil: 'domcontentloaded' });

    try {
        // 1. Preenchimento Automático do Usuário / CPF
        const inputUsuario = page.locator('input[name="username"], input[name="cpf"], input[type="text"]').first();
        if (await inputUsuario.isVisible({ timeout: 5000 })) {
            console.log('[+] Preenchendo Usuário/CPF...');
            await inputUsuario.fill(usuario);
        }

        // 2. Preenchimento Automático da Senha
        const inputSenha = page.locator('input[name="password"], input[type="password"]').first();
        if (await inputSenha.isVisible({ timeout: 3000 })) {
            console.log('[+] Preenchendo Senha...');
            await inputSenha.fill(senha);
        }

        // 3. Submete o formulário inicial para disparar o envio do OTP (caso o OTP fique em tela separada)
        const btnEntrar = page.locator('button[type="submit"], input[type="submit"]').first();
        if (await btnEntrar.isVisible({ timeout: 2000 })) {
            console.log('[+] Submetendo credenciais primárias...');
            await btnEntrar.click();
        }

        // 4. Foca no campo de OTP/MFA caso ele surja
        await page.waitForTimeout(1000);
        const inputOtp = page.locator('input[name="otp"], input[name="code"], input[name="token"]').first();
        if (await inputOtp.isVisible({ timeout: 4000 })) {
            await inputOtp.focus();
            console.log('\n[!] Campo OTP localizado e focado com sucesso!');
        }

    } catch (e) {
        console.warn('⚠️ Nota sobre preenchimento automático:', e.message);
    }

    console.log('\n==================================================');
    console.log('👉 DIGITE APENAS O CÓDIGO OTP NO NAVEGADOR.');
    console.log('👉 APÓS ACESSAR O PAINEL PRINCIPAL, VOLTE AQUI E PRESSIONE ENTER.');
    console.log('==================================================\n');

    // Aguarda o pressionamento da tecla ENTER no terminal após você validar o OTP
    await new Promise((resolve) => {
        process.stdin.once('data', () => {
            resolve();
        });
    });

    // Salva o estado dos cookies e localStorage no arquivo JSON
    const sessionPath = path.resolve('sipom_session.json');
    await context.storageState({ path: sessionPath });

    console.log(`✅ Sessão e Cookies salvos com sucesso em: ${sessionPath}`);
    await browser.close();
    process.exit(0);
}

autenticarEGuardarSessao().catch((err) => {
    console.error('❌ Erro no processo de autenticação:', err.message);
    process.exit(1);
});