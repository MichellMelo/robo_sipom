import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

let contextGlobal = null;
let pageGlobal = null;

const LAST_URL_FILE = path.resolve('last_url.txt');

/**
 * Salva a URL atual no disco para persistência de navegação
 */
export function salvarUltimaUrl(url) {
    if (url && !url.includes('about:blank') && !url.includes('/login')) {
        try {
            fs.writeFileSync(LAST_URL_FILE, url, 'utf-8');
        } catch (e) {
            console.warn('⚠️ Não foi possível salvar a última URL.');
        }
    }
}

/**
 * Lê a última URL salva ou retorna a URL padrão de criação
 */
function obterUltimaUrlSalva() {
    if (fs.existsSync(LAST_URL_FILE)) {
        try {
            const url = fs.readFileSync(LAST_URL_FILE, 'utf-8').trim();
            if (url && url.includes('sipom.pm.ce.gov.br')) return url;
        } catch (e) { }
    }
    return 'https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar';
}

/**
 * Reaproveita ou inicializa a página e NAVEGA para a última URL onde você parou
 */
export async function obterPaginaGlobal() {
    if (pageGlobal && !pageGlobal.isClosed()) {
        return pageGlobal;
    }

    const sessionPath = path.resolve('sipom_session.json');

    if (!fs.existsSync(sessionPath)) {
        throw new Error('Arquivo "sipom_session.json" não encontrado. Execute primeiro "node login.js" no terminal.');
    }

    const browser = await chromium.launch({
        headless: false,
        slowMo: 60
    });

    contextGlobal = await browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    pageGlobal = await contextGlobal.newPage();

    // Monitora alterações de navegação e salva a URL atual no arquivo
    pageGlobal.on('framenavigated', (frame) => {
        if (frame === pageGlobal.mainFrame()) {
            salvarUltimaUrl(pageGlobal.url());
        }
    });

    // Reabre na página que você estava antes de fechar
    const urlParaAbrir = obterUltimaUrlSalva();
    console.log(`[+] Reabrindo o SIPOM na última página acessada: ${urlParaAbrir}`);

    await pageGlobal.goto(urlParaAbrir, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    }).catch(() => { });

    return pageGlobal;
}

/**
 * Preenche o dropdown Select2 no SIPOM de forma direta
 */
export async function selecionarSelect2(page, labelCampo, valorBusca, valorOpcao) {
    try {
        console.log(`Buscando ${labelCampo}: "${valorOpcao}"...`);

        const containerSelect2 = page.locator(`
            .form-group:has-text("${labelCampo}") .select2-container,
            label:has-text("${labelCampo}") + .select2-container,
            div:has-text("${labelCampo}") .select2-selection
        `).first();

        await containerSelect2.waitFor({ state: 'visible', timeout: 3000 });
        await containerSelect2.click();

        const campoBusca = page.locator('.select2-container--open .select2-search__field, input.select2-search__field').first();

        if (await campoBusca.isVisible({ timeout: 1000 }).catch(() => false)) {
            await campoBusca.fill(valorBusca);
        }

        const opcao = page.locator(`.select2-results__option:has-text("${valorOpcao}"), .select2-results__option--highlighted`).first();
        await opcao.waitFor({ state: 'visible', timeout: 3000 });
        await opcao.click();

        console.log(`✅ ${labelCampo} preenchido com sucesso!`);
        return true;
    } catch (error) {
        console.warn(`⚠️ Não foi possível selecionar ${labelCampo} ("${valorOpcao}"). Seguindo fluxo...`);
        await page.keyboard.press('Escape').catch(() => { });
        return false;
    }
}

/**
 * FORMULÁRIO 1: PREENCHE E REGISTRA A OCORRÊNCIA PRINCIPAL
 */
export async function preencherFormulario1(page, dados) {
    console.log('[+] Acessando a página de criação do SIPOM...');

    await page.goto('https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });

    if (page.url().includes('/login') || page.url().includes('/auth') || (await page.$('input[name="cpf"], input[name="login"]'))) {
        throw new Error('Sessão expirada no SIPOM! Execute "node login.js" no terminal para renovar a sessão.');
    }

    console.log('[+] Preenchendo campos principais...');

    // 1. NATUREZA (Select2)
    if (dados.naturezaSipom) {
        await page.click('#select2-natureza-container').catch(() => { });
        await page.fill('.select2-search__field', dados.naturezaSipom).catch(() => { });
        await page.keyboard.press('Enter');
    }

    // 2. DATA E HORA (#data_hora)
    if (dados.dataHoraFormatada) {
        let valorIso = dados.dataHoraFormatada;
        if (valorIso.includes('/')) {
            const [dataPart, horaPart] = valorIso.split(' ');
            const [dia, mes, ano] = dataPart.split('/');
            valorIso = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaPart || '00:00'}`;
        }

        console.log(`[+] Injetando Data/Hora ISO: ${valorIso}`);

        await page.evaluate(({ selector, valor }) => {
            const input = document.querySelector(selector);
            if (input) {
                input.removeAttribute('max');
                input.value = valor;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
            }
        }, { selector: '#data_hora', valor: valorIso });

        const valorFinal = await page.locator('#data_hora').inputValue();
        if (!valorFinal) {
            await page.click('#data_hora');
            const digitos = valorIso.replace(/\D/g, '');
            await page.keyboard.type(digitos, { delay: 50 });
        }
    }

    // 3. UNIDADE MILITAR - LOCAL DO FATO
    if (dados.opmLocal) {
        await page.click('#select2-unidade-container').catch(() => { });
        await page.fill('.select2-search__field', dados.opmLocal).catch(() => { });
        await page.keyboard.press('Enter');
    }

    // 4. ENDEREÇO (Google Places Autocomplete)
    if (dados.rua) {
        console.log(`[+] Preenchendo e selecionando endereço no Google Autocomplete: ${dados.rua}`);

        const campoEndereco = page.locator('#location-input');
        await campoEndereco.click();
        await campoEndereco.fill('');

        const buscaEndereco = `${dados.rua}, ${dados.cidade || 'Fortaleza'} - CE`;
        await campoEndereco.pressSequentially(buscaEndereco, { delay: 100 });

        try {
            await page.waitForSelector('.pac-container .pac-item', { state: 'visible', timeout: 5000 });
            await page.waitForTimeout(500);

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            console.log('[+] Endereço selecionado na lista do Google!');
        } catch (err) {
            console.log('[!] Lista de sugestões não apareceu a tempo, tentando selecionar via clique no primeiro item...');
            const primeiraSugestao = page.locator('.pac-container .pac-item').first();
            if (await primeiraSugestao.isVisible()) {
                await primeiraSugestao.click();
            }
        }
    }

    // 5. OPM - ATENDEU A OCORRÊNCIA
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

    return { idSipom, url: currentUrl };
}

/**
 * ABA 1: MODAL DE PESSOAS (#modalPessoa) - Corrigido
 */
export async function preencherModalPessoa(page, pessoa) {
    const termosInvalidos = ['NÃO IDENTIFICADO', 'NAO IDENTIFICADO', 'NÃO INFORMADO', 'DESCONHECIDO', 'IGNORADO', 'A APURAR'];

    if (!pessoa || !pessoa.nome || termosInvalidos.includes(pessoa.nome.trim().toUpperCase())) {
        console.log(`\nℹ️ Pessoa ignorada: [${pessoa?.vinculo || 'Pessoa'} - ${pessoa?.nome || 'N/A'}]`);
        return;
    }

    try {
        console.log(`\nAbrindo modal para pessoa: [${pessoa.vinculo || 'Infrator'} - ${pessoa.nome}]...`);

        // 1. Clica no botão de abrir o modal usando seletores do SIPOM
        const botaoAdicionar = page.locator('button[data-target="#modalPessoa"], .btn-primary:has(.fa-plus)').first();
        await botaoAdicionar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        await botaoAdicionar.click({ force: true }).catch(async () => {
            await page.evaluate(() => {
                const btn = document.querySelector('button[data-target="#modalPessoa"]');
                if (btn) btn.click();
            });
        });

        // 2. Aguarda o modal (#modalPessoa) ficar visível
        const modalPessoa = page.locator('#modalPessoa');
        await modalPessoa.waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(600);

        // 3. Vínculo
        if (pessoa.vinculo) {
            await page.selectOption('#modalPessoa select[name="vinculo"]', { label: pessoa.vinculo }).catch(async () => {
                await page.selectOption('#modalPessoa select[name="vinculo"]', { value: pessoa.vinculo }).catch(() => { });
            });
        }

        // 4. Sexo
        if (pessoa.sexo) {
            await page.selectOption('#modalPessoa select[name="sexo"]', { label: pessoa.sexo.toUpperCase() }).catch(async () => {
                await page.selectOption('#modalPessoa select[name="sexo"]', { value: pessoa.sexo }).catch(() => { });
            });
        }

        // 5. Nome Completo
        if (pessoa.nome) {
            await page.fill('#modalPessoa input[name="nome"]', pessoa.nome);
        }

        // 6. Data de Nascimento (YYYY-MM-DD)
        if (pessoa.nascimento) {
            let dataIso = pessoa.nascimento;
            if (pessoa.nascimento.includes('/')) {
                const [d, m, a] = pessoa.nascimento.split('/');
                dataIso = `${a}-${m}-${d}`;
            }

            await page.evaluate(({ valIso }) => {
                const input = document.querySelector('#modalPessoa input[name="nascimento"]');
                if (input) {
                    input.value = valIso;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, { valIso: dataIso });
        }

        // 7. Nome da Mãe
        if (pessoa.mae) {
            await page.fill('#modalPessoa input[name="mae"]', pessoa.mae);
        }

        console.log('Confirmando gravação da pessoa em #btn-salvar-pessoa...');
        await page.evaluate(() => {
            const btn = document.querySelector('#btn-salvar-pessoa') || document.querySelector('#modalPessoa button:has-text("Adicionar")');
            if (btn) btn.click();
        });

        await modalPessoa.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(1000);
        console.log(`✅ Pessoa (${pessoa.nome}) cadastrada com sucesso!`);
    } catch (error) {
        console.warn('⚠️ Falha ao preencher pessoa:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

export async function preencherAbaPessoas(page, dados) {
    console.log('\n[+] Acessando Aba: Pessoas...');

    // Garante o clique na aba Pessoas e aguarda o carregamento
    const abaPessoas = page.locator('#pessoas-tab, a:has-text("Pessoas")').first();
    await abaPessoas.click().catch(() => { });
    await page.waitForTimeout(1500);

    if (dados.pessoas && dados.pessoas.length > 0) {
        for (const pessoa of dados.pessoas) {
            await preencherModalPessoa(page, pessoa);
        }
    }
}

/**
 * ABA 2: MODAL DE PROCEDIMENTOS (#modalProcedimento) - Tratamento Avançado de Select2 e Abertura
 */
export async function preencherModalProcedimento(page, procedimento) {
    if (!procedimento) return;

    try {
        console.log('\n[+] Acessando Aba: Procedimentos...');
        const abaProcedimentos = page.locator('#procedimentos-tab, a:has-text("Procedimentos")').first();
        await abaProcedimentos.click().catch(() => { });
        await page.waitForTimeout(1000);

        console.log('[+] Abrindo Modal de Procedimento...');

        // 1. Abertura do Modal
        await page.evaluate(() => {
            if (typeof $ !== 'undefined' && $('#modalProcedimento').length) {
                $('#modalProcedimento').modal('show');
            } else {
                const btn = document.querySelector('button[data-target="#modalProcedimento"]') ||
                    document.querySelector('.btn:has(.fa-plus)');
                if (btn) btn.click();
            }
        });

        // 2. Aguarda a visibilidade do Modal
        const modalProcedimento = page.locator('#modalProcedimento');
        await modalProcedimento.waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(600);

        // 3. Tipo de Procedimento (select[name="procedimento"])
        const tipoDesejado = procedimento.procedimento || procedimento.tipo || 'Boletim de Ocorrência - BO';
        console.log(`[+] Selecionando Tipo de Procedimento: "${tipoDesejado}"...`);

        await page.evaluate(({ textoAlvo }) => {
            const select = document.querySelector('#modalProcedimento select[name="procedimento"]');
            if (!select) return;

            const normalizar = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
            const alvo = normalizar(textoAlvo);

            const opcaoEncontrada = Array.from(select.options).find(opt => {
                const textoOpt = normalizar(opt.textContent);
                return textoOpt === alvo || textoOpt.includes(alvo) || alvo.includes(textoOpt);
            });

            if (opcaoEncontrada) {
                select.value = opcaoEncontrada.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                select.dispatchEvent(new Event('input', { bubbles: true }));
                if (typeof $ !== 'undefined') $(select).trigger('change');
            }
        }, { textoAlvo: tipoDesejado });

        await page.waitForTimeout(600);

        // 4. Repartição de registro: Polícia Civil (value: 2)
        console.log('[+] Selecionando Repartição: Polícia Civil...');
        await page.evaluate(() => {
            const select = document.querySelector('#modalProcedimento select[name="reparticao"], #modalProcedimento select#reparticao');
            if (select) {
                select.value = '2';
                select.dispatchEvent(new Event('change', { bubbles: true }));
                select.dispatchEvent(new Event('input', { bubbles: true }));
                if (typeof $ !== 'undefined') $(select).trigger('change');
            }
        });

        await page.waitForTimeout(800);

        // 5. DELEGACIA: Extrai os 3 primeiros números (ex: de "132-4587/2026" extrai "132")
        const rawDelegacia = procedimento.delegacia || procedimento.codigoDelegacia || '132';
        const matchDelegacia = String(rawDelegacia).match(/^\d{3}/);
        const codigoDelegacia = matchDelegacia ? matchDelegacia[0] : String(rawDelegacia).replace(/\D/g, '').substring(0, 3);

        console.log(`[+] Buscando Delegacia pelo código exato: "${codigoDelegacia}"...`);

        try {
            const containerDelegacia = page.locator('[id^="select2-procedimento_delegacia"]').first();
            await containerDelegacia.click({ force: true });
            await page.waitForTimeout(400);

            const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
            if (await searchInput.isVisible({ timeout: 2000 })) {
                await searchInput.fill('');
                await searchInput.fill(codigoDelegacia);
                await page.waitForTimeout(800);

                const opcaoDelegacia = page.locator('.select2-results__option--highlighted, .select2-results__option').first();
                if (await opcaoDelegacia.isVisible({ timeout: 2000 })) {
                    await opcaoDelegacia.click();
                } else {
                    await page.keyboard.press('Enter');
                }
            }
        } catch (e) {
            console.warn('⚠️ Erro ao selecionar Delegacia via Select2:', e.message);
        }

        await page.waitForTimeout(500);

        // 6. DELEGADO (Select2)
        if (procedimento.delegado) {
            console.log(`[+] Buscando Delegado: "${procedimento.delegado}"...`);
            try {
                const containerDelegado = page.locator('[id^="select2-procedimento_delegado"]').first();
                await containerDelegado.click({ force: true });
                await page.waitForTimeout(400);

                const searchInputDelegado = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInputDelegado.isVisible({ timeout: 2000 })) {
                    await searchInputDelegado.fill(procedimento.delegado);
                    await page.waitForTimeout(800);

                    const opcaoDelegado = page.locator('.select2-results__option--highlighted, .select2-results__option').first();
                    if (await opcaoDelegado.isVisible({ timeout: 2000 })) {
                        await opcaoDelegado.click();
                    } else {
                        await page.keyboard.press('Enter');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Erro ao selecionar Delegado:', e.message);
            }
        }

        // 7. NÚMERO DO B.O.: Extrai os números após o traço "-" (ex: de "132-4587/2026" extrai "4587")
        let numeroBO = procedimento.numero || procedimento.procedimentoNumero || '';
        const rawNumero = String(numeroBO);

        if (rawNumero.includes('-')) {
            numeroBO = rawNumero.split('-')[1].split('/')[0].trim();
        } else if (rawNumero.includes('/')) {
            numeroBO = rawNumero.split('/')[0].trim();
        }

        console.log(`[+] Preenchendo Número do B.O.: ${numeroBO}...`);
        const inputNumero = page.locator('#modalProcedimento input[name="procedimento_numero"]').first();
        await inputNumero.waitFor({ state: 'visible', timeout: 3000 });
        await inputNumero.focus();
        await inputNumero.click();
        await inputNumero.fill('');
        await inputNumero.pressSequentially(String(numeroBO), { delay: 50 });

        await page.evaluate(({ val }) => {
            const input = document.querySelector('#modalProcedimento input[name="procedimento_numero"]');
            if (input) {
                input.value = val;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
            }
        }, { val: String(numeroBO) });

        // 8. ANO DO B.O. (Ano informado ou extraído do final da string após a barra "/")
        let anoBO = procedimento.ano || new Date().getFullYear().toString();
        if (rawNumero.includes('/')) {
            anoBO = rawNumero.split('/')[1].trim();
        }

        console.log(`[+] Preenchendo Ano: ${anoBO}...`);
        const inputAno = page.locator('#modalProcedimento input[name="procedimento_ano"]').first();
        if (await inputAno.isVisible({ timeout: 2000 })) {
            await inputAno.focus();
            await inputAno.click();
            await inputAno.fill('');
            await inputAno.pressSequentially(String(anoBO), { delay: 50 });

            await page.evaluate(({ val }) => {
                const input = document.querySelector('#modalProcedimento input[name="procedimento_ano"]');
                if (input) {
                    input.value = val;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            }, { val: String(anoBO) });
        }

        await page.waitForTimeout(600);

        // 9. Confirmar e Salvar / Atualizar (Substituído por seletores padrão JS sem :has-text)
        console.log('[+] Confirmando gravação do Procedimento...');
        await page.evaluate(() => {
            const botoes = Array.from(document.querySelectorAll('#modalProcedimento button, #modalProcedimento input[type="submit"]'));
            const btnSalvar = botoes.find(b => b.classList.contains('btn-success') ||
                b.textContent.trim().toLowerCase().includes('atualizar') ||
                b.textContent.trim().toLowerCase().includes('salvar')) ||
                document.querySelector('#btn-salvar-procedimento');
            if (btnSalvar) btnSalvar.click();
        });

        // Aguarda fechar o modal
        await modalProcedimento.waitFor({ state: 'hidden', timeout: 10000 }).catch(async () => {
            await page.evaluate(() => {
                if (typeof $ !== 'undefined') $('#modalProcedimento').modal('hide');
            });
        });

        await page.waitForTimeout(1000);
        console.log('✅ Procedimento gravado com sucesso!');

    } catch (error) {
        console.warn('⚠️ Falha ao preencher Procedimento:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

/**
 * ABA 3: MODAL DE HISTÓRICO (#modalHistorico)
 */
export async function preencherModalHistorico(page, textoHistorico) {
    if (!textoHistorico) return;

    try {
        console.log('\n[+] Acessando Aba: Histórico...');
        const abaHistorico = page.locator('#historicos-tab, a:has-text("Histórico")').first();
        await abaHistorico.click().catch(() => { });
        await page.waitForTimeout(1000);

        console.log('[+] Abrindo Modal de Histórico...');
        await page.evaluate(() => {
            if (typeof $ !== 'undefined' && $('#modalHistorico').length) {
                $('#modalHistorico').modal('show');
            } else {
                const btn = document.querySelector('#btnHistoricoModal, button[data-target="#modalHistorico"]');
                if (btn) btn.click();
            }
        });

        const modalHistorico = page.locator('#modalHistorico');
        await modalHistorico.waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(600);

        console.log('[+] Inserindo texto no editor de Histórico...');

        // Injeta o texto no div editável do Summernote (.note-editable) e no textarea (.note-codable)
        await page.evaluate((texto) => {
            // 1. Atualiza via jQuery Summernote API se disponível
            if (typeof $ !== 'undefined' && $('#modalHistorico textarea').length) {
                try {
                    $('#modalHistorico textarea').summernote('code', texto);
                } catch (e) { }
            }

            // 2. Preenchimento direto na div contenteditable (.note-editable)
            const editable = document.querySelector('#modalHistorico .note-editable, div.note-editable');
            if (editable) {
                editable.innerHTML = texto;
                editable.dispatchEvent(new Event('input', { bubbles: true }));
                editable.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 3. Atualiza o textarea nativo de backup
            const textarea = document.querySelector('#modalHistorico textarea, textarea.note-codable');
            if (textarea) {
                textarea.value = texto;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, textoHistorico);

        await page.waitForTimeout(600);

        // Clique direto no botão #btn-salvar-historico exibido no HTML da imagem
        console.log('[+] Clicando no botão #btn-salvar-historico...');
        await page.evaluate(() => {
            const btnSalvar = document.querySelector('#btn-salvar-historico') ||
                document.querySelector('#modalHistorico input[type="submit"]');
            if (btnSalvar) btnSalvar.click();
        });

        // Aguarda o fechamento do modal
        await modalHistorico.waitFor({ state: 'hidden', timeout: 10000 }).catch(async () => {
            await page.evaluate(() => {
                if (typeof $ !== 'undefined') $('#modalHistorico').modal('hide');
            });
        });

        await page.waitForTimeout(1000);
        console.log('✅ Histórico salvo com sucesso!');

    } catch (error) {
        console.warn('⚠️ Falha ao preencher Histórico:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

/**
 * ABA 4: MODAL DE MATERIAIS (#modalMaterial) - Suporte Completo a Drogas e Quantidade
 */
export async function preencherModalMaterial(page, dadosMaterial) {
    const lista = Array.isArray(dadosMaterial) ? dadosMaterial : dadosMaterial?.lista || [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Materiais...');
        const abaMateriais = page.locator('#materiais-tab, a:has-text("Materiais")').first();
        await abaMateriais.click().catch(() => { });
        await page.waitForTimeout(1000);

        for (const item of lista) {
            console.log(`[+] Abrindo Modal para adicionar Material: "${item.tipo || 'Item'}"...`);

            // 1. Abertura do Modal
            await page.evaluate(() => {
                if (typeof $ !== 'undefined' && $('#modalMaterial').length) {
                    $('#modalMaterial').modal('show');
                } else {
                    const btn = document.querySelector('button[data-target="#modalMaterial"]');
                    if (btn) btn.click();
                }
            });

            const modalMaterial = page.locator('#modalMaterial');
            await modalMaterial.waitFor({ state: 'visible', timeout: 10000 });
            await page.waitForTimeout(600);

            // 2. Tipo de Material: Droga (select[name="material_tipo"])
            const tipoDesejado = item.tipo || 'Droga';
            console.log(`[+] Selecionando Tipo de Material: "${tipoDesejado}"...`);

            await page.evaluate(({ textoAlvo }) => {
                const select = document.querySelector('#modalMaterial select[name="material_tipo"]');
                if (!select) return;

                const normalizar = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                const alvo = normalizar(textoAlvo);

                const opcaoEncontrada = Array.from(select.options).find(opt => {
                    const textoOpt = normalizar(opt.textContent);
                    return textoOpt === alvo || textoOpt.includes(alvo);
                });

                if (opcaoEncontrada) {
                    select.value = opcaoEncontrada.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    select.dispatchEvent(new Event('input', { bubbles: true }));
                    if (typeof $ !== 'undefined') $(select).trigger('change');
                }
            }, { textoAlvo: tipoDesejado });

            await page.waitForTimeout(800);

            // 3. SELEÇÃO DA DROGA ESPECÍFICA (Select2)
            if (tipoDesejado.toLowerCase().includes('droga') && item.nomeDroga) {
                console.log(`[+] Buscando espécie de droga no Select2: "${item.nomeDroga}"...`);
                try {
                    // Clica no Select2 do campo Droga
                    const comboDroga = page.locator('#modalMaterial .select2-container, #modalMaterial [id*="droga"]').first();
                    await comboDroga.click({ force: true });
                    await page.waitForTimeout(400);

                    const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                    if (await searchInput.isVisible({ timeout: 2000 })) {
                        await searchInput.fill('');
                        await searchInput.pressSequentially(item.nomeDroga, { delay: 100 });
                        await page.waitForTimeout(800);

                        const opcaoDroga = page.locator('.select2-results__option--highlighted, .select2-results__option').first();
                        if (await opcaoDroga.isVisible({ timeout: 2000 })) {
                            await opcaoDroga.click();
                        } else {
                            await page.keyboard.press('Enter');
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Erro ao selecionar espécie da droga:', e.message);
                }
                await page.waitForTimeout(500);
            }

            // 4. QUANTIDADE DA DROGA (input[name="droga_quantidade"])
            if (item.quantidade) {
                console.log(`[+] Preenchendo Quantidade: ${item.quantidade}...`);
                const inputQtd = page.locator('#modalMaterial input[name="droga_quantidade"]').first();
                if (await inputQtd.isVisible({ timeout: 3000 })) {
                    await inputQtd.focus();
                    await inputQtd.fill('');
                    await inputQtd.pressSequentially(String(item.quantidade), { delay: 50 });

                    await page.evaluate(({ val }) => {
                        const input = document.querySelector('#modalMaterial input[name="droga_quantidade"]');
                        if (input) {
                            input.value = val;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.dispatchEvent(new Event('blur', { bubbles: true }));
                        }
                    }, { val: String(item.quantidade) });
                }
            }

            await page.waitForTimeout(600);

            // 5. Confirmar e Salvar / Atualizar
            console.log('[+] Confirmando gravação do Material...');
            await page.evaluate(() => {
                const botoes = Array.from(document.querySelectorAll('#modalMaterial button, #modalMaterial input[type="submit"]'));
                const btnSalvar = botoes.find(b => b.classList.contains('btn-primary') ||
                    b.classList.contains('btn-success') ||
                    b.textContent.trim().toLowerCase().includes('atualizar') ||
                    b.textContent.trim().toLowerCase().includes('salvar') ||
                    b.textContent.trim().toLowerCase().includes('adicionar')) ||
                    document.querySelector('#btn-salvar-material');
                if (btnSalvar) btnSalvar.click();
            });

            // Aguarda o fechamento do modal
            await modalMaterial.waitFor({ state: 'hidden', timeout: 10000 }).catch(async () => {
                await page.evaluate(() => {
                    if (typeof $ !== 'undefined') $('#modalMaterial').modal('hide');
                });
            });

            await page.waitForTimeout(1000);
        }

        console.log('✅ Todos os Materiais foram gravados com sucesso!');

    } catch (error) {
        console.warn('⚠️ Falha ao preencher Materiais:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

/**
 * ABA 5: MODAL DE COMPOSIÇÕES (#modalComposicao)
 */
export async function preencherModalComposicao(page, dadosComposicao) {
    const integrantes = Array.isArray(dadosComposicao) ? dadosComposicao : dadosComposicao?.integrantes || [];
    if (!integrantes.length) return;

    try {
        console.log('\n[+] Acessando Aba: Composições...');
        await page.click('#composicoes-tab, text="Composições"').catch(() => { });
        await page.waitForTimeout(1000);

        for (const membro of integrantes) {
            await page.click('button[data-target="#modalComposicao"]').catch(() => { });
            const modalComposicao = page.locator('#modalComposicao');
            await modalComposicao.waitFor({ state: 'visible', timeout: 8000 });

            if (membro.funcao) {
                await page.fill('#modalComposicao input[name="funcao"], #modalComposicao select[name="composicao_funcao"]', membro.funcao).catch(() => { });
            }
            if (membro.matricula) {
                await page.fill('#modalComposicao input[name="composicao_matricula"], #modalComposicao input[name="matricula"]', membro.matricula).catch(() => { });
            }

            console.log('Confirmando gravação da Composição...');
            await page.evaluate(() => {
                const btn = document.querySelector('#btn-salvar-composicao') || document.querySelector('#modalComposicao button:has-text("Salvar")');
                if (btn) btn.click();
            });

            await modalComposicao.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => { });
            await page.waitForTimeout(1000);
        }
        console.log('✅ Composição cadastrada com sucesso!');
    } catch (error) {
        console.warn('⚠️ Falha ao preencher Composição:', error.message);
    }
}

/**
 * EXECUTA O FLUXO COMPLETO DO SISTEMA
 */
export async function preencherSipomCompleto(dados) {
    const page = await obterPaginaGlobal();

    try {
        const resultadoForm1 = await preencherFormulario1(page, dados);

        // Preenche sequencialmente os modais após salvar o formulário 1
        await preencherAbaPessoas(page, dados);
        if (dados.procedimento) await preencherModalProcedimento(page, dados.procedimento);
        if (dados.historico) await preencherModalHistorico(page, dados.historico);
        if (dados.materiais) await preencherModalMaterial(page, dados.materiais);
        if (dados.composicao) await preencherModalComposicao(page, dados.composicao);

        return {
            success: true,
            idSipom: resultadoForm1.idSipom,
            url: resultadoForm1.url
        };
    } catch (error) {
        console.error('[-] Erro na automação local:', error.message);
        await page.waitForTimeout(15000);
        throw error;
    }
}