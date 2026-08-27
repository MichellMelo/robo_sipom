import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

/**
 * Função principal que executa a automação completa no portal SIPOM (ROP)
 * @param {Object} dados Objeto estruturado vindo do parserSipom.js
 * @returns {Promise<{success: boolean, idSipom: string, url: string}>}
 */
export async function preencherSipomCompleto(dados) {
    const sessionPath = path.resolve('sipom_session.json');

    // Valida existência do arquivo de sessão
    if (!fs.existsSync(sessionPath)) {
        throw new Error('Arquivo de sessão "sipom_session.json" não encontrado. Execute "node login.js" para autenticar.');
    }

    // Inicializa o navegador Headless (defina headless: false se quiser visualizar a execução local)
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Cria contexto reaproveitando os cookies e LocalStorage
    const context = await browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        // -------------------------------------------------------------
        // 1. NAVEGAÇÃO E PREENCHIMENTO DO FORMULÁRIO PRINCIPAL (Imagem 1)
        // -------------------------------------------------------------
        console.log('[+] Acessando a página de criação de ocorrência...');
        await page.goto('https://sipom.pm.ce.gov.br/ocorrencias/criar', { waitUntil: 'networkidle', timeout: 30000 });

        // Checa se foi redirecionado para o login (Sessão expirada)
        if (page.url().includes('/login') || page.url().includes('/auth')) {
            throw new Error('Sessão expirada no SIPOM. É necessário renovar o arquivo "sipom_session.json" via login.js.');
        }

        // Preenchimento dos campos principais
        console.log('[+] Preenchendo dados principais...');

        // Natureza (Select)
        if (dados.naturezaSipom) {
            await page.selectOption('select[name="natureza"]', { label: dados.naturezaSipom }).catch(async () => {
                // Fallback caso a seleção por rótulo direto necessite de busca textual
                await page.selectOption('select[name="natureza"]', { value: dados.naturezaSipom });
            });
        }

        // Data e Hora (dd/mm/aaaa hh:mm)
        if (dados.dataHoraFormatada) {
            await page.fill('input[name="dataHora"]', dados.dataHoraFormatada);
        }

        // Unidade Militar - Local do Fato
        if (dados.opmLocal) {
            await page.selectOption('select[name="unidadeMilitar"]', { label: dados.opmLocal });
        }

        // Endereço
        await page.fill('input[name="rua"]', dados.rua || '');
        await page.fill('input[name="numeral"]', dados.numero || 'S/N');
        await page.fill('input[name="bairro"]', dados.bairro || '');
        await page.fill('input[name="cidade"]', dados.cidade || 'Fortaleza');

        // OPM Atendeu e Viatura
        if (dados.opmAtendeu) {
            await page.selectOption('select[name="opmAtendeu"]', { label: dados.opmAtendeu });
        }
        await page.fill('input[name="viatura"]', dados.viatura || '');

        // Números de Identificação
        if (dados.numeroHt) {
            await page.fill('input[name="numeroHt"]', dados.numeroHt);
        }
        await page.fill('input[name="numeroOcorrencia"]', dados.fichaCiops || '');

        // Submissão do Formulário Inicial
        console.log('[+] Submetendo formulário principal...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
            page.click('button:has-text("Registrar Ocorrência")')
        ]);

        // Extrai a URL e o ID gerado da ocorrência (ex: /ocorrencias/ocorrencias-exibir/1b1e1e1b1...)
        const currentUrl = page.url();
        const idSipomMatch = currentUrl.match(/ocorrencias-exibir\/([a-zA-Z0-9]+)/);
        const idSipom = idSipomMatch ? idSipomMatch[1] : 'N/A';

        console.log(`[+] Ocorrência criada com sucesso! ID: ${idSipom}`);

        // -------------------------------------------------------------
        // 2. PREENCHIMENTO DAS ABAS SECUNDÁRIAS (Imagem 2)
        // -------------------------------------------------------------

        // ABA 1: PESSOAS
        if (dados.pessoas && dados.pessoas.length > 0) {
            console.log('[+] Preenchendo Aba: Pessoas...');
            await page.click('text=Pessoas');
            await page.waitForTimeout(1000);

            for (const pessoa of dados.pessoas) {
                await page.click('button:has-text("+ Pessoa")').catch(() => page.click('button:has-text("Adicionar Pessoa")'));
                await page.waitForTimeout(500);

                await page.fill('input[name="nome"]', pessoa.nome);

                if (pessoa.vinculo) {
                    await page.selectOption('select[name="vinculo"]', { label: pessoa.vinculo }).catch(() => { });
                }

                if (pessoa.mae) {
                    await page.fill('input[name="mae"]', pessoa.mae);
                }

                if (pessoa.idade) {
                    await page.fill('input[name="idade"]', String(pessoa.idade));
                }

                await page.click('button:has-text("Salvar")').catch(() => page.click('button:has-text("Confirmar")'));
                await page.waitForTimeout(1000);
            }
        }

        // ABA 2: PROCEDIMENTOS
        if (dados.procedimento && (dados.procedimento.delegado || dados.procedimento.numero)) {
            console.log('[+] Preenchendo Aba: Procedimentos...');
            await page.click('text=Procedimentos');
            await page.waitForTimeout(1000);

            if (dados.procedimento.delegado) {
                await page.fill('input[name="delegado"]', dados.procedimento.delegado);
            }
            if (dados.procedimento.delegacia) {
                await page.fill('input[name="delegacia"]', dados.procedimento.delegacia);
            }
            if (dados.procedimento.numero) {
                await page.fill('input[name="numeroProcedimento"]', dados.procedimento.numero);
            }

            await page.click('button:has-text("Salvar Procedimento")').catch(() => page.click('button:has-text("Salvar")'));
            await page.waitForTimeout(1000);
        }

        // ABA 3: HISTÓRICO
        if (dados.historico) {
            console.log('[+] Preenchendo Aba: Histórico...');
            await page.click('text=Histórico');
            await page.waitForTimeout(1000);

            await page.fill('textarea[name="historico"]', dados.historico);
            await page.click('button:has-text("Salvar Histórico")').catch(() => page.click('button:has-text("Salvar")'));
            await page.waitForTimeout(1000);
        }

        // ABA 4: MATERIAIS
        if (dados.materiais && dados.materiais.length > 0) {
            console.log('[+] Preenchendo Aba: Materiais...');
            await page.click('text=Materiais');
            await page.waitForTimeout(1000);

            for (const item of dados.materiais) {
                if (item.descricao && item.descricao !== 'S/A') {
                    await page.click('button:has-text("+ Material")').catch(() => { });
                    await page.fill('input[name="descricao"]', item.descricao);
                    await page.click('button:has-text("Salvar")');
                    await page.waitForTimeout(500);
                }
            }
        }

        // ABA 5: COMPOSIÇÕES
        if (dados.composicao && dados.composicao.length > 0) {
            console.log('[+] Preenchendo Aba: Composições...');
            await page.click('text=Composições').catch(() => page.click('text=Composição'));
            await page.waitForTimeout(1000);

            for (const membro of dados.composicao) {
                await page.click('button:has-text("+ Membro")').catch(() => page.click('button:has-text("+ Policial")'));
                await page.waitForTimeout(500);

                await page.fill('input[name="funcao"]', membro.funcao || ''); // CMT, MOT, PAT
                await page.fill('input[name="nome"]', membro.nome || '');
                await page.fill('input[name="matricula"]', membro.matricula || '');

                await page.click('button:has-text("Adicionar")').catch(() => page.click('button:has-text("Salvar")'));
                await page.waitForTimeout(1000);
            }
        }

        console.log('[+] Finalizado preenchimento de todas as abas com sucesso!');

        return {
            success: true,
            idSipom,
            url: currentUrl
        };

    } catch (error) {
        console.error('[-] Erro crítico durante a execução do Playwright:', error.message);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}