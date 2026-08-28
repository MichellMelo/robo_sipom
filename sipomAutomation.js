import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

let contextGlobal = null;
let pageGlobal = null;

const LAST_URL_FILE = path.resolve('last_url.txt');

export function salvarUltimaUrl(url) {
    if (url && !url.includes('about:blank') && !url.includes('/login')) {
        try {
            fs.writeFileSync(LAST_URL_FILE, url, 'utf-8');
        } catch (e) { }
    }
}

function obterUltimaUrlSalva() {
    if (fs.existsSync(LAST_URL_FILE)) {
        try {
            const url = fs.readFileSync(LAST_URL_FILE, 'utf-8').trim();
            if (url && url.includes('sipom.pm.ce.gov.br')) return url;
        } catch (e) { }
    }
    return 'https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar';
}

export async function obterPaginaGlobal() {
    if (pageGlobal && !pageGlobal.isClosed()) {
        return pageGlobal;
    }

    const sessionPath = path.resolve('sipom_session.json');
    if (!fs.existsSync(sessionPath)) {
        throw new Error('Arquivo "sipom_session.json" não encontrado. Execute primeiro "node login.js".');
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

    pageGlobal.on('framenavigated', (frame) => {
        if (frame === pageGlobal.mainFrame()) {
            salvarUltimaUrl(pageGlobal.url());
        }
    });

    const urlParaAbrir = obterUltimaUrlSalva();
    console.log(`[+] Abrindo SIPOM na URL: ${urlParaAbrir}`);
    await pageGlobal.goto(urlParaAbrir, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });

    return pageGlobal;
}

/**
 * ABA 1: MODAL DE PESSOAS (#modalPessoa)
 */
export async function preencherModalPessoa(page, pessoa) {
    const termosInvalidos = ['NÃO IDENTIFICADO', 'NAO IDENTIFICADO', 'NÃO INFORMADO', 'DESCONHECIDO', 'IGNORADO', 'A APURAR'];
    if (!pessoa || !pessoa.nome || termosInvalidos.includes(pessoa.nome.trim().toUpperCase())) return;

    try {
        console.log(`\nAbrindo modal para pessoa: [${pessoa.vinculo || 'Infrator'} - ${pessoa.nome}]...`);

        const botaoAdicionar = page.locator('button[data-target="#modalPessoa"], .btn-primary:has(.fa-plus)').first();
        await botaoAdicionar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        await botaoAdicionar.click({ force: true }).catch(async () => {
            await page.evaluate(() => {
                const btn = document.querySelector('button[data-target="#modalPessoa"]');
                if (btn) btn.click();
            });
        });

        const modalPessoa = page.locator('#modalPessoa');
        await modalPessoa.waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(600);

        if (pessoa.vinculo) {
            await page.selectOption('#modalPessoa select[name="vinculo"]', { label: pessoa.vinculo }).catch(async () => {
                await page.selectOption('#modalPessoa select[name="vinculo"]', { value: pessoa.vinculo }).catch(() => { });
            });
        }

        if (pessoa.sexo) {
            await page.selectOption('#modalPessoa select[name="sexo"]', { label: pessoa.sexo.toUpperCase() }).catch(async () => {
                await page.selectOption('#modalPessoa select[name="sexo"]', { value: pessoa.sexo }).catch(() => { });
            });
        }

        if (pessoa.nome) {
            await page.fill('#modalPessoa input[name="nome"]', pessoa.nome);
        }

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

        if (pessoa.mae) {
            await page.fill('#modalPessoa input[name="mae"]', pessoa.mae);
        }

        console.log('Confirmando gravação da pessoa...');
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
 * ABA 2: MODAL DE PROCEDIMENTOS (#modalProcedimento)
 */
export async function preencherModalProcedimento(page, procedimento) {
    if (!procedimento) return;

    try {
        console.log('\n[+] Acessando Aba: Procedimentos...');
        const abaProcedimentos = page.locator('#procedimentos-tab, a:has-text("Procedimentos")').first();
        await abaProcedimentos.click().catch(() => { });
        await page.waitForTimeout(1000);

        console.log('[+] Abrindo Modal de Procedimento...');
        await page.evaluate(() => {
            if (typeof $ !== 'undefined' && $('#modalProcedimento').length) {
                $('#modalProcedimento').modal('show');
            } else {
                const btn = document.querySelector('button[data-target="#modalProcedimento"]');
                if (btn) btn.click();
            }
        });

        const modalProcedimento = page.locator('#modalProcedimento');
        await modalProcedimento.waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForTimeout(600);

        // 1. Tipo de Procedimento
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

        // 2. Repartição (Polícia Civil = 2)
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

        // 3. Delegacia (Select2 por Código exato)
        const codigoDelegacia = String(procedimento.delegacia || '').replace(/\D/g, '');
        if (codigoDelegacia) {
            console.log(`[+] Buscando Delegacia pelo código exato: "${codigoDelegacia}"...`);
            try {
                const containerDelegacia = page.locator('[id^="select2-procedimento_delegacia"]').first();
                await containerDelegacia.click({ force: true });
                await page.waitForTimeout(400);

                const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInput.isVisible({ timeout: 2000 })) {
                    await searchInput.focus();
                    await searchInput.fill('');
                    await searchInput.pressSequentially(codigoDelegacia, { delay: 100 });
                    await page.waitForTimeout(800);

                    const opcaoExata = page.locator(`.select2-results__option:has-text("${codigoDelegacia}-"), .select2-results__option--highlighted`).first();
                    if (await opcaoExata.isVisible({ timeout: 2000 })) {
                        await opcaoExata.click();
                    } else {
                        await page.keyboard.press('Enter');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Erro ao selecionar Delegacia via Select2:', e.message);
            }
        }

        await page.waitForTimeout(500);

        // 4. Delegado (Select2)
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

        // 5. Número do B.O. (procedimento_numero)
        const numeroBO = procedimento.numero || '';
        if (numeroBO) {
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
        }

        // 6. Ano do B.O. (procedimento_ano)
        const anoBO = procedimento.ano || new Date().getFullYear().toString();
        if (anoBO) {
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
        }

        await page.waitForTimeout(600);

        // 7. Confirmar e Salvar (JS sem :has-text)
        console.log('[+] Confirmando gravação do Procedimento...');
        await page.evaluate(() => {
            const botoes = Array.from(document.querySelectorAll('#modalProcedimento button, #modalProcedimento input[type="submit"]'));
            const btnSalvar = botoes.find(b => b.classList.contains('btn-success') ||
                b.textContent.trim().toLowerCase().includes('atualizar') ||
                b.textContent.trim().toLowerCase().includes('salvar')) ||
                document.querySelector('#btn-salvar-procedimento');
            if (btnSalvar) btnSalvar.click();
        });

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
        await page.evaluate((texto) => {
            if (typeof $ !== 'undefined' && $('#modalHistorico textarea').length) {
                try { $('#modalHistorico textarea').summernote('code', texto); } catch (e) { }
            }

            const editable = document.querySelector('#modalHistorico .note-editable, div.note-editable');
            if (editable) {
                editable.innerHTML = texto;
                editable.dispatchEvent(new Event('input', { bubbles: true }));
                editable.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const textarea = document.querySelector('#modalHistorico textarea, textarea.note-codable');
            if (textarea) {
                textarea.value = texto;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, textoHistorico);

        await page.waitForTimeout(600);

        console.log('[+] Clicando no botão #btn-salvar-historico...');
        await page.evaluate(() => {
            const btnSalvar = document.querySelector('#btn-salvar-historico') ||
                document.querySelector('#modalHistorico input[type="submit"]');
            if (btnSalvar) btnSalvar.click();
        });

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
 * ABA 4: MODAL DE MATERIAIS (#modalMaterial)
 */
export async function preencherModalMaterial(page, dadosMaterial) {
    const lista = Array.isArray(dadosMaterial) ? dadosMaterial : dadosMaterial?.lista || [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Materiais...');

        // 1. Clica na aba de Materiais usando o ID exato da Imagem 1 (#materiais-tab)
        const abaMateriais = page.locator('#materiais-tab').first();
        await abaMateriais.waitFor({ state: 'visible', timeout: 5000 });
        await abaMateriais.click();
        await page.waitForTimeout(800);

        for (const item of lista) {
            console.log(`[+] Abrindo Modal de Material...`);

            // 2. Clica no botão da Imagem 2 (button[data-target="#modalMaterial"])
            await page.evaluate(() => {
                if (typeof $ !== 'undefined' && $('#modalMaterial').length) {
                    $('#modalMaterial').modal('show');
                } else {
                    const btn = document.querySelector('button[data-target="#modalMaterial"]');
                    if (btn) btn.click();
                }
            });

            // Aguarda a exibição do modal
            const modalMaterial = page.locator('#modalMaterial');
            await modalMaterial.waitFor({ state: 'visible', timeout: 10000 });
            await page.waitForTimeout(600);

            // 3. Preenchimento do Tipo de Material (select[name="material_tipo"])
            const tipoDesejado = item.tipo || 'Veículo';
            console.log(`[+] Selecionando Tipo: "${tipoDesejado}"...`);

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

            // 4. Fluxo específico se for VEÍCULO
            if (tipoDesejado.toLowerCase().includes('veic') || tipoDesejado.toLowerCase().includes('veículo')) {
                const valorSituacao = item.situacaoValue || (item.situacao && item.situacao.toLowerCase().includes('apreend') ? '1' : '2');
                console.log(`[+] Selecionando Situação (value=${valorSituacao})...`);

                await page.evaluate(({ val }) => {
                    const selectSit = document.querySelector('#modalMaterial select[name="situacao"]');
                    if (selectSit) {
                        selectSit.value = val;
                        selectSit.dispatchEvent(new Event('change', { bubbles: true }));
                        selectSit.dispatchEvent(new Event('input', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectSit).trigger('change');
                    }
                }, { val: valorSituacao });

                await page.waitForTimeout(600);

                const placaVeiculo = (item.placa || '').toUpperCase().trim();
                if (placaVeiculo) {
                    console.log(`[+] Preenchendo Placa: ${placaVeiculo}...`);
                    const inputPlaca = page.locator('#modalMaterial input[name="placa"]').first();
                    await inputPlaca.waitFor({ state: 'visible', timeout: 3000 });
                    await inputPlaca.click();
                    await inputPlaca.fill('');
                    await inputPlaca.pressSequentially(placaVeiculo, { delay: 60 });

                    await page.evaluate(({ val }) => {
                        const input = document.querySelector('#modalMaterial input[name="placa"]');
                        if (input) {
                            input.value = val;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.dispatchEvent(new Event('blur', { bubbles: true }));
                        }
                    }, { val: placaVeiculo });
                }

                await page.waitForTimeout(1500); // Aguarda consulta/autocomp do SIPOM
            }

            // 5. Fluxo específico se for DROGA
            else if (tipoDesejado.toLowerCase().includes('droga')) {
                const nomeDrogaAlvo = item.nomeDroga || item.descricao || 'Crack';
                console.log(`[+] Selecionando espécie da droga: "${nomeDrogaAlvo}"...`);

                try {
                    const comboDroga = page.locator('#modalMaterial .select2-container').last();
                    await comboDroga.click({ force: true });
                    await page.waitForTimeout(400);

                    const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                    if (await searchInput.isVisible({ timeout: 2000 })) {
                        await searchInput.fill('');
                        await searchInput.pressSequentially(nomeDrogaAlvo, { delay: 80 });
                        await page.waitForTimeout(600);
                        await page.keyboard.press('Enter');
                    }
                } catch (e) {
                    console.warn('⚠️ Erro no Select2 da Droga:', e.message);
                }

                if (item.quantidade) {
                    const inputQtd = page.locator('#modalMaterial input[name="droga_quantidade"]').first();
                    if (await inputQtd.isVisible({ timeout: 2000 })) {
                        await inputQtd.fill(String(item.quantidade));
                    }
                }
            }

            // 6. Confirma e Clica em Salvar/Atualizar (#btn-salvar-material)
            console.log('[+] Gravando formulário de Material...');
            await page.evaluate(() => {
                const btnSalvar = document.querySelector('#btn-salvar-material') ||
                    document.querySelector('#modalMaterial input[type="submit"]') ||
                    document.querySelector('#modalMaterial button.btn-primary');
                if (btnSalvar) btnSalvar.click();
            });

            // Aguarda o modal fechar
            await modalMaterial.waitFor({ state: 'hidden', timeout: 10000 }).catch(async () => {
                await page.evaluate(() => {
                    if (typeof $ !== 'undefined') $('#modalMaterial').modal('hide');
                });
            });

            await page.waitForTimeout(1000);
        }

        console.log('✅ Materiais preenchidos e gravados com sucesso!');

    } catch (error) {
        console.warn('⚠️ Erro no processo de Materiais:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

/**
 * ABA 5: MODAL DE COMPOSIÇÃO (#modalComposicao)
 */
export async function preencherModalComposicao(page, composicao) {
    const lista = Array.isArray(composicao) ? composicao : composicao?.lista || [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Composições...');

        // 1. Clica na aba de Composições (#composicoes-tab)
        const abaComposicao = page.locator('#composicoes-tab, a:has-text("Composições")').first();
        await abaComposicao.waitFor({ state: 'visible', timeout: 5000 });
        await abaComposicao.click();
        await page.waitForTimeout(1000);

        for (const militar of lista) {
            if (!militar.matricula && !militar.nome) continue;

            console.log(`[+] Adicionando PM na composição: [${militar.funcao}] ${militar.nome || militar.matricula}...`);

            // 2. Clica no botão para abrir o Modal
            await page.evaluate(() => {
                if (typeof $ !== 'undefined' && $('#modalComposicao').length) {
                    $('#modalComposicao').modal('show');
                } else {
                    const btn = document.querySelector('button[data-target="#modalComposicao"]') ||
                        document.querySelector('#btnComposicaoModal');
                    if (btn) btn.click();
                }
            });

            const modalComposicao = page.locator('#modalComposicao');
            await modalComposicao.waitFor({ state: 'visible', timeout: 10000 });
            await page.waitForTimeout(600);

            // 3. Seleciona o Tipo de Policiamento ("Motorizado" por padrão)
            const tipoPoliciamento = militar.tipoPoliciamento || 'Motorizado';
            await page.evaluate(({ textoAlvo }) => {
                const select = document.querySelector('#modalComposicao select[name="policiamento_tipo"], #modalComposicao select[name="tipo_policiamento"], #modalComposicao select[name="policiamento"]');
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
            }, { textoAlvo: tipoPoliciamento });

            await page.waitForTimeout(500);

            // 4. Seleciona a Função (Comandante, Motorista, Patrulheiro)
            const funcaoNome = militar.funcao || 'Patrulheiro';
            console.log(`[+] Selecionando Função: "${funcaoNome}"...`);

            await page.evaluate(({ textoAlvo }) => {
                const select = document.querySelector('#modalComposicao select[name="funcao"], #modalComposicao select[name="comp_funcao"], #modalComposicao select[name="composicao_funcao"]');
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
            }, { textoAlvo: funcaoNome });

            await page.waitForTimeout(500);

            // 5. Preenche a Matrícula utilizando localização visual e atributo
            const matriculaFormatada = String(militar.matricula || '').replace(/\D/g, '');
            console.log(`[+] Preenchendo Matrícula: "${matriculaFormatada}"...`);

            if (matriculaFormatada) {
                // Tenta localizar o campo pelo rótulo 'Matrícula' do formulário ou por input visível dentro do modal
                const inputMatricula = page.locator('#modalComposicao label:has-text("Matrícula") + input, #modalComposicao input[name*="matri"], #modalComposicao input.mat').first();

                await inputMatricula.waitFor({ state: 'visible', timeout: 4000 });
                await inputMatricula.click({ force: true });
                await inputMatricula.fill('');
                await inputMatricula.pressSequentially(matriculaFormatada, { delay: 100 });

                // Força os gatilhos JS para o SIPOM realizar a busca do policial no BD
                await page.evaluate(({ val }) => {
                    const inputs = Array.from(document.querySelectorAll('#modalComposicao input'));
                    const inputMat = inputs.find(i => {
                        const label = i.previousElementSibling || i.parentElement.querySelector('label');
                        return (label && label.textContent.includes('Matrícula')) || i.name.includes('matri') || i.classList.contains('mat');
                    }) || inputs[1]; // Fallback para o segundo input do formulário

                    if (inputMat) {
                        inputMat.value = val;
                        inputMat.dispatchEvent(new Event('input', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('change', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('keyup', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('blur', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(inputMat).trigger('change').trigger('keyup').trigger('blur');
                    }
                }, { val: matriculaFormatada });

                // Aguarda 3s para o SIPOM consultar no banco de dados e preencher o Nome automaticamente
                await page.waitForTimeout(3000);
            }

            // 6. Clique de confirmação/salvamento (Salvar / Atualizar)
            console.log('[+] Clicando no botão Salvar/Atualizar...');
            await page.evaluate(() => {
                const btnSalvar = document.querySelector('#btn-salvar-composicao') ||
                    document.querySelector('#modalComposicao input[type="submit"]') ||
                    document.querySelector('#modalComposicao button.btn-success') ||
                    document.querySelector('#modalComposicao button.btn-primary');
                if (btnSalvar) btnSalvar.click();
            });

            // Aguarda o modal sumir da tela
            await modalComposicao.waitFor({ state: 'hidden', timeout: 10000 }).catch(async () => {
                await page.evaluate(() => {
                    if (typeof $ !== 'undefined') $('#modalComposicao').modal('hide');
                });
            });

            await page.waitForTimeout(1000);
        }

        console.log('✅ Toda a Composição foi gravada com sucesso!');

    } catch (error) {
        console.warn('⚠️ Falha ao preencher Composição:', error.message);
        await page.keyboard.press('Escape').catch(() => { });
    }
}

/**
 * PREENCHIMENTO DO FORMULÁRIO 1 (DADOS DA OCORRÊNCIA)
 */
export async function preencherFormulario1(page, dados) {
    if (!dados) return;

    try {
        console.log('\n[+] Preenchendo Formulário Inicial da Ocorrência...');

        // 1. Ficha CIOPS
        if (dados.fichaCiops) {
            const inputCiops = page.locator('input[name="ciops"], input[name="ficha_ciops"]').first();
            if (await inputCiops.isVisible({ timeout: 2000 })) {
                await inputCiops.fill(dados.fichaCiops);
            }
        }

        // 2. Natureza da Ocorrência
        if (dados.naturezaSipom) {
            console.log(`[+] Selecionando Natureza: "${dados.naturezaSipom}"...`);
            const comboNatureza = page.locator('.select2-container:has(#select2-natureza)').first();
            if (await comboNatureza.isVisible({ timeout: 2000 })) {
                await comboNatureza.click({ force: true });
                await page.waitForTimeout(300);
                const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInput.isVisible({ timeout: 2000 })) {
                    await searchInput.fill(dados.naturezaSipom);
                    await page.waitForTimeout(600);
                    await page.keyboard.press('Enter');
                }
            }
        }

        // 3. Endereço (Rua, Número, Bairro, Cidade)
        if (dados.rua) {
            const inputRua = page.locator('input[name="rua"], input[name="endereco"]').first();
            if (await inputRua.isVisible({ timeout: 2000 })) {
                await inputRua.fill(dados.rua);
            }
        }

        if (dados.numero) {
            const inputNum = page.locator('input[name="numero"], input[name="endereco_numero"]').first();
            if (await inputNum.isVisible({ timeout: 2000 })) {
                await inputNum.fill(dados.numero);
            }
        }

        console.log('✅ Formulário inicial preenchido!');
    } catch (error) {
        console.warn('⚠️ Falha ao preencher Formulário 1:', error.message);
    }
}

/**
 * FUNÇÃO ORQUESTRADORA: Executa o preenchimento completo de todas as abas
 */
export async function preencherSipomCompleto(dados) {
    console.log('\n==================================================');
    console.log('[+] Iniciando Automação Completa do SIPOM...');
    console.log('==================================================');

    const page = await obterPaginaGlobal();

    try {
        // 1. Formulário Inicial / Dados Gerais
        if (typeof preencherFormulario1 === 'function') {
            await preencherFormulario1(page, dados);
        }

        // 2. Aba Pessoas
        if (dados.pessoas && dados.pessoas.length > 0) {
            await preencherAbaPessoas(page, dados);
        }

        // 3. Aba Procedimentos
        if (dados.procedimento) {
            await preencherModalProcedimento(page, dados.procedimento);
        }

        // 4. Aba Histórico
        if (dados.historico) {
            await preencherModalHistorico(page, dados.historico);
        }

        // 5. Aba Materiais
        if (dados.materiais && dados.materiais.length > 0) {
            await preencherModalMaterial(page, dados.materiais);
        }

        // 6. Aba Composição
        if (dados.composicao && dados.composicao.length > 0 && typeof preencherModalComposicao === 'function') {
            await preencherModalComposicao(page, dados.composicao);
        }

        console.log('\n==================================================');
        console.log('✅ Ocorrência preenchida com sucesso no SIPOM!');
        console.log('==================================================\n');

        return { sucesso: true };

    } catch (error) {
        console.error('❌ Erro durante o preenchimento completo do SIPOM:', error.message);
        throw error;
    }
}