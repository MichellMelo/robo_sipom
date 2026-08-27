import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

/**
 * Executa a automação de cadastro no SIPOM/ROP de forma VISÍVEL e LOCAL
 * @param {Object} dados Objeto estruturado extraído pelo parserSipom.js
 * @returns {Promise<{success: boolean, idSipom: string, url: string}>}
 */
export async function preencherSipomCompleto(dados) {
    const sessionPath = path.resolve('sipom_session.json');

    if (!fs.existsSync(sessionPath)) {
        throw new Error('Arquivo "sipom_session.json" não encontrado. Execute primeiro "node login.js" no terminal.');
    }

    console.log('[+] Iniciando Chromium visível na máquina local...');

    // 1. Abre o navegador visível para acompanhamento
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100 // Delay suave para acompanhar a digitação dos campos
    });

    // 2. Carrega estado da sessão (cookies e localStorage)
    const context = await browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        // -------------------------------------------------------------
        // FORMULÁRIO PRINCIPAL: CRIAR OCORRÊNCIA (URL ROP)
        // -------------------------------------------------------------
        console.log('[+] Acessando a página de criação do SIPOM...');

        await page.goto('https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        // Validação de sessão expirada
        if (page.url().includes('/login') || page.url().includes('/auth') || (await page.$('input[name="cpf"], input[name="login"]'))) {
            throw new Error('Sessão expirada no SIPOM! Execute "node login.js" no terminal para renovar a sessão.');
        }

        // -------------------------------------------------------------
        // PREENCHIMENTO DOS CAMPOS PRINCIPAIS CORRIGIDO
        // -------------------------------------------------------------
        console.log('[+] Preenchendo campos principais...');

        // 1. NATUREZA (Select2)
        if (dados.naturezaSipom) {
            await page.click('#select2-natureza-container').catch(() => { });
            await page.fill('.select2-search__field', dados.naturezaSipom).catch(() => { });
            await page.keyboard.press('Enter');
        }

        // 2. DATA E HORA (#data_hora) - Tratamento Avançado de Mascara e Validação
        if (dados.dataHoraFormatada) {
            let valorIso = dados.dataHoraFormatada;

            // Converte "DD/MM/YYYY HH:mm" para "YYYY-MM-DDTHH:mm"
            if (valorIso.includes('/')) {
                const [dataPart, horaPart] = valorIso.split(' ');
                const [dia, mes, ano] = dataPart.split('/');
                valorIso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaPart || '00:00'}`;
            }

            console.log(`[+] Injetando Data/Hora ISO: ${valorIso}`);

            // Executa a injeção diretamente no contexto da página para burlar restrições do HTML5
            await page.evaluate(({ selector, valor }) => {
                const input = document.querySelector(selector);
                if (input) {
                    input.removeAttribute('max'); // Remove a trava de horário máximo do HTML5
                    input.value = valor;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, { selector: '#data_hora', valor: valorIso });

            // Validação visual e de estado no Playwright
            const valorFinal = await page.locator('#data_hora').inputValue();
            if (!valorFinal) {
                // Fallback via preenchimento direto por sequenciamento de teclas
                await page.click('#data_hora');
                const digitos = valorIso.replace(/\D/g, ''); // Extrai apenas números
                await page.keyboard.type(digitos, { delay: 50 });
            }
        }

        // 3. UNIDADE MILITAR - LOCAL DO FATO (Select2)
        if (dados.opmLocal) {
            await page.click('#select2-unidade-container').catch(() => { });
            await page.fill('.select2-search__field', dados.opmLocal).catch(() => { });
            await page.keyboard.press('Enter');
        }

        // 4. ENDEREÇO (Google Places Autocomplete)
        if (dados.rua) {
            console.log(`[+] Preenchendo e selecionando endereço no Google Autocomplete: ${dados.rua}`);

            const campoEndereco = page.locator('#location-input');

            // Limpa e digita o endereço
            await campoEndereco.click();
            await campoEndereco.fill('');

            // Concatena a cidade/estado para garantir precisão nas sugestões do Google
            const buscaEndereco = `${dados.rua}, ${dados.cidade || 'Fortaleza'} - CE`;
            await campoEndereco.pressSequentially(buscaEndereco, { delay: 100 });

            // Aguarda a caixa de sugestões do Google Places aparecer (.pac-container)
            try {
                await page.waitForSelector('.pac-container .pac-item', { state: 'visible', timeout: 5000 });
                await page.waitForTimeout(500); // Pequeno delay para renderização visual

                // Simula a navegação via teclado para selecionar a primeira sugestão
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
                console.log('[+] Endereço selecionado na lista do Google!');
            } catch (err) {
                console.log('[!] Lista de sugestões não apareceu a tempo, tentando selecionar via clique no primeiro item...');

                // Fallback: Clica diretamente no primeiro elemento .pac-item se o Enter não disparar
                const primeiraSugestao = page.locator('.pac-container .pac-item').first();
                if (await primeiraSugestao.isVisible()) {
                    await primeiraSugestao.click();
                }
            }
        }

        // 5. OPM - ATENDEU A OCORRÊNCIA (Select2 - Iguais à Unidade Militar)
        const opmAtenderValor = dados.opmAtendeu || dados.opmLocal;
        if (opmAtenderValor) {
            await page.click('#select2-opm-container').catch(() => { });
            await page.fill('.select2-search__field', opmAtenderValor).catch(() => { });
            await page.keyboard.press('Enter');
        }

        // 6. Nº DA OCORRÊNCIA (Ficha CIOPS)
        if (dados.fichaCiops) {
            await page.fill('input[name="numero_ocorrencia"]', dados.fichaCiops).catch(() => { });
        }

        // 7. SUBMISSÃO E VALIDAÇÃO DO CADASTRO
        console.log('[+] Clicando no botão Registrar Ocorrência...');
        await page.click('#btn-salvar-ocorrencia');

        // Aguarda a navegação de fato ocorrer
        try {
            await page.waitForURL(url => !url.href.includes('ocorrencias-criar'), {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
        } catch (err) {
            throw new Error('Falha ao salvar a ocorrência. Verifique se existem campos obrigatórios não preenchidos (como Data e Hora).');
        }

        const currentUrl = page.url();
        const idSipomMatch = currentUrl.match(/ocorrencias-exibir\/([a-zA-Z0-9]+)/) || currentUrl.match(/id\/([a-zA-Z0-9]+)/);

        if (!idSipomMatch) {
            throw new Error('Ocorrência não foi salva corretamente. A URL de confirmação não foi gerada.');
        }

        const idSipom = idSipomMatch[1];
        console.log(`[+] Ocorrência criada com sucesso! ID: ${idSipom}`);

        // -------------------------------------------------------------
        // PREENCHIMENTO DAS ABAS SECUNDÁRIAS
        // -------------------------------------------------------------

        // -------------------------------------------------------------
        // PREENCHIMENTO DA ABA: PESSOAS (NOVA PÁGINA)
        // -------------------------------------------------------------
        if (dados.pessoas && dados.pessoas.length > 0) {
            console.log('[+] Acessando Aba: Pessoas...');

            // 1. Clica na aba Pessoas
            await page.click('#pessoas-tab').catch(() => { });
            await page.waitForTimeout(1000);

            for (const pessoa of dados.pessoas) {
                console.log(`[+] Adicionando pessoa: ${pessoa.nome || 'Não identificado'}`);

                // 2. Clica no botão para abrir o modal (#modalPessoa)
                await page.click('button[data-target="#modalPessoa"]').catch(() => { });

                // Aguarda o modal ficar visível
                await page.waitForSelector('#modalPessoa', { state: 'visible', timeout: 5000 }).catch(() => { });
                await page.waitForTimeout(500);

                // 3. Pessoas Envolvidas / Vínculo (select[name="vinculo"])
                if (pessoa.vinculo) {
                    await page.selectOption('#modalPessoa select[name="vinculo"]', { label: pessoa.vinculo }).catch(async () => {
                        await page.selectOption('#modalPessoa select[name="vinculo"]', { value: pessoa.vinculo }).catch(() => { });
                    });
                }

                // 4. Sexo (select[name="sexo"])
                if (pessoa.sexo) {
                    await page.selectOption('#modalPessoa select[name="sexo"]', { label: pessoa.sexo.toUpperCase() }).catch(async () => {
                        await page.selectOption('#modalPessoa select[name="sexo"]', { value: pessoa.sexo }).catch(() => { });
                    });
                }

                // 5. Nome Completo (input[name="nome"])
                if (pessoa.nome) {
                    await page.fill('#modalPessoa input[name="nome"]', pessoa.nome).catch(() => { });
                }

                // 6. Nascimento (input[name="nascimento"] - type="date")
                if (pessoa.nascimento) {
                    let dataNascIso = pessoa.nascimento;
                    // Converte DD/MM/YYYY para YYYY-MM-DD
                    if (dataNascIso.includes('/')) {
                        const [dia, mes, ano] = dataNascIso.split('/');
                        dataNascIso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                    }
                    await page.fill('#modalPessoa input[name="nascimento"]', dataNascIso).catch(() => { });
                }

                // 7. Nome da Mãe (input[name="mae"])
                if (pessoa.mae) {
                    await page.fill('#modalPessoa input[name="mae"]', pessoa.mae).catch(() => { });
                }

                // 8. Confirmar / Adicionar Pessoa
                console.log('[+] Clicando no botão Adicionar da pessoa...');
                await page.click('#modalPessoa button:has-text("Adicionar"), #modalPessoa button[type="submit"]').catch(() => { });

                // Aguarda o modal fechar antes da próxima iteração
                await page.waitForTimeout(1500);
            }
        }

        // ABA 2: PROCEDIMENTOS
        if (dados.procedimento && (dados.procedimento.delegado || dados.procedimento.numero)) {
            console.log('[+] Preenchendo Aba: Procedimentos...');
            await page.click('text=Procedimentos').catch(() => { });
            await page.waitForTimeout(1000);

            if (dados.procedimento.delegado) await page.fill('input[name="delegado"]', dados.procedimento.delegado).catch(() => { });
            if (dados.procedimento.delegacia) await page.fill('input[name="delegacia"]', dados.procedimento.delegacia).catch(() => { });
            if (dados.procedimento.numero) await page.fill('input[name="numeroProcedimento"]', dados.procedimento.numero).catch(() => { });

            await page.click('button:has-text("Salvar Procedimento"), button:has-text("Salvar")').catch(() => { });
            await page.waitForTimeout(1000);
        }

        // ABA 3: HISTÓRICO
        if (dados.historico) {
            console.log('[+] Preenchendo Aba: Histórico...');
            await page.click('text=Histórico').catch(() => { });
            await page.waitForTimeout(1000);

            await page.fill('textarea[name="historico"]', dados.historico).catch(() => { });
            await page.click('button:has-text("Salvar Histórico"), button:has-text("Salvar")').catch(() => { });
            await page.waitForTimeout(1000);
        }

        // ABA 4: MATERIAIS
        if (dados.materiais && dados.materiais.length > 0) {
            console.log('[+] Preenchendo Aba: Materiais...');
            await page.click('text=Materiais').catch(() => { });
            await page.waitForTimeout(1000);

            for (const item of dados.materiais) {
                if (item.descricao && item.descricao.toUpperCase() !== 'S/A') {
                    await page.click('button:has-text("+ Material")').catch(() => { });
                    await page.fill('input[name="descricao"]', item.descricao).catch(() => { });
                    await page.click('button:has-text("Salvar")').catch(() => { });
                    await page.waitForTimeout(500);
                }
            }
        }

        // ABA 5: COMPOSIÇÕES
        if (dados.composicao && dados.composicao.length > 0) {
            console.log('[+] Preenchendo Aba: Composições...');
            await page.click('text=Composições, text=Composição').catch(() => { });
            await page.waitForTimeout(1000);

            for (const membro of dados.composicao) {
                await page.click('button:has-text("+ Membro"), button:has-text("+ Policial")').catch(() => { });
                await page.waitForTimeout(500);

                await page.fill('input[name="funcao"]', membro.funcao || '').catch(() => { });
                await page.fill('input[name="nome"]', membro.nome || '').catch(() => { });
                await page.fill('input[name="matricula"]', membro.matricula || '').catch(() => { });

                await page.click('button:has-text("Adicionar"), button:has-text("Salvar")').catch(() => { });
                await page.waitForTimeout(1000);
            }
        }

        console.log('[+] Automação finalizada com sucesso!');

        return {
            success: true,
            idSipom,
            url: currentUrl
        };

    } catch (error) {
        console.error('[-] Erro na automação local:', error.message);
        // Pausa por 15 segundos em caso de erro para análise visual na tela antes de fechar
        await page.waitForTimeout(15000);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}