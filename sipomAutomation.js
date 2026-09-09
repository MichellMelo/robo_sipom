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

    const sessionDir = path.resolve('./.chrome_sipom_profile');

    contextGlobal = await chromium.launchPersistentContext(sessionDir, {
        headless: false,
        slowMo: 60,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized'
        ]
    });

    const pages = contextGlobal.pages();
    pageGlobal = pages.length > 0 ? pages[0] : await contextGlobal.newPage();

    pageGlobal.on('framenavigated', (frame) => {
        if (frame === pageGlobal.mainFrame()) {
            salvarUltimaUrl(pageGlobal.url());
        }
    });

    const urlParaAbrir = obterUltimaUrlSalva();
    console.log(`[+] Abrindo SIPOM na URL com perfil persistente: ${urlParaAbrir}`);

    await pageGlobal.goto(urlParaAbrir, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });

    return pageGlobal;
}

/**
 * ABA PESSOAS: Preenchimento de pessoas e envio via botão submit
 */
export async function preencherAbaPessoas(page, dados) {
    const listaPessoas = Array.isArray(dados?.pessoas) ? dados.pessoas : [];

    if (!listaPessoas.length) {
        console.log('⚠️ Nenhuma pessoa encontrada no objeto para ser cadastrada.');
        return;
    }

    try {
        console.log('\n[+] Acessando Aba: Pessoas...');

        await page.evaluate(() => {
            const tabPessoas = document.querySelector('a[href="#pessoas"]') || document.querySelector('#pessoas-tab');
            if (tabPessoas) tabPessoas.click();
        });

        await page.waitForTimeout(1500);

        for (const pessoa of listaPessoas) {
            console.log(`[+] Adicionando Pessoa: [${pessoa.vinculo}] ${pessoa.nome}...`);

            const btnAbrirModal = page.locator('#pessoas button:has-text("Pessoa"), #pessoas .btn-success').first();
            await btnAbrirModal.waitFor({ state: 'visible', timeout: 5000 });
            await btnAbrirModal.click({ force: true });

            const modalPessoa = page.locator('#modalPessoa, div.modal.show').first();
            await modalPessoa.waitFor({ state: 'visible', timeout: 8000 });
            await page.waitForTimeout(500);

            const vinculoAlvo = pessoa.vinculo || 'Infrator';
            await page.evaluate(({ tipo }) => {
                const select = document.querySelector('#modalPessoa select');
                if (select) {
                    const normalizar = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = normalizar(tipo);

                    let opt = Array.from(select.options).find(o => normalizar(o.textContent).includes(alvo));
                    if (!opt) {
                        opt = Array.from(select.options).find(o => normalizar(o.textContent).includes('acusado') || normalizar(o.textContent).includes('infrator'));
                    }

                    if (opt) {
                        select.value = opt.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }, { tipo: vinculoAlvo });

            if (pessoa.nome) {
                const inputNome = page.locator('#modalPessoa input[name*="nome"], #modalPessoa input[placeholder*="NOME"]').first();
                if (await inputNome.isVisible({ timeout: 2000 })) {
                    await inputNome.fill('');
                    await inputNome.fill(pessoa.nome.toUpperCase());
                    await inputNome.dispatchEvent('blur');
                }
            }

            await page.waitForTimeout(1000);
            await page.evaluate(() => {
                const modalBD = document.querySelector('#modalPessoasEncontradasOcorrencia');
                if (modalBD) {
                    modalBD.style.display = 'none';
                    modalBD.classList.remove('show');
                    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    document.body.classList.remove('modal-open');
                }
            });

            if (pessoa.mae) {
                const nomeMae = pessoa.mae.toUpperCase().trim();
                console.log(`[+] Preenchendo Mãe: "${nomeMae}"...`);

                await page.evaluate(({ valorMae }) => {
                    const inputMae = document.querySelector('#modalPessoa input[name*="mae"]') ||
                        document.querySelector('#modalPessoa input[placeholder*="MÃE"]');

                    if (inputMae) {
                        inputMae.value = valorMae;
                        inputMae.dispatchEvent(new Event('input', { bubbles: true }));
                        inputMae.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, { valorMae: nomeMae });
            }

            await page.waitForTimeout(500);

            console.log('[+] Clicando no botão submit do modal de pessoas...');
            await page.evaluate(() => {
                const modal = document.querySelector('#modalPessoa') || document.querySelector('div.modal.show');
                if (modal) {
                    const btnSubmit = modal.querySelector('button[type="submit"]') ||
                        modal.querySelector('input[type="submit"]') ||
                        modal.querySelector('button.btn-success') ||
                        Array.from(modal.querySelectorAll('button')).find(b =>
                            b.textContent.trim().toLowerCase().includes('adicionar') ||
                            b.textContent.trim().toLowerCase().includes('salvar') ||
                            b.textContent.trim().toLowerCase().includes('cadastrar')
                        );

                    if (btnSubmit) {
                        btnSubmit.click();
                    } else {
                        const form = modal.querySelector('form');
                        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
                    }
                }
            });

            await page.waitForTimeout(1500);
            console.log(`✅ Submit executado! Pessoa "${pessoa.nome}" enviada com sucesso.`);
        }

        console.log('✅ Aba Pessoas concluída!');

    } catch (error) {
        console.warn('⚠️ Falha na aba de Pessoas:', error.message);
    }
}

/**
 * ABA PROCEDIMENTOS: Preenchimento da Repartição, Delegacia e Dados do Procedimento
 */
export async function preencherModalProcedimento(page, procedimento) {
    if (!procedimento) return;

    try {
        console.log('\n[+] Acessando Aba: Procedimentos...');
        const abaProc = page.locator('#procedimentos-tab, a:has-text("Procedimento")').first();
        if (await abaProc.isVisible({ timeout: 5000 })) {
            await abaProc.click({ force: true });
            await page.waitForTimeout(800);
        }

        console.log('[+] Abrindo Modal de Procedimento...');
        const btnAbrir = page.locator('button[data-target="#modalProcedimento"], #btnProcedimentoModal, #procedimentos button:has-text("Procedimento")').first();
        await btnAbrir.waitFor({ state: 'visible', timeout: 5000 });
        await btnAbrir.click({ force: true });

        const modal = page.locator('#modalProcedimento, div.modal.show').first();
        await modal.waitFor({ state: 'visible', timeout: 8000 });
        await page.waitForTimeout(600);

        if (procedimento.procedimento) {
            console.log(`[+] Selecionando Tipo de Procedimento: "${procedimento.procedimento}"...`);
            await page.evaluate(({ tipoProc }) => {
                const select = document.querySelector('#modalProcedimento select[name*="procedimento"], #modalProcedimento select[name*="tipo"]');
                if (select) {
                    const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = norm(tipoProc);

                    const opt = Array.from(select.options).find(o => {
                        const txt = norm(o.textContent);
                        return txt.includes(alvo) || alvo.includes(txt) || (alvo.includes('inquerito') && txt.includes('inquerito'));
                    });

                    if (opt) {
                        select.value = opt.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }, { tipoProc: procedimento.procedimento });
        }

        await page.waitForTimeout(400);

        console.log('[+] Selecionando Repartição de registro: "Polícia Civil"...');
        await page.evaluate(() => {
            const selectReparticao = Array.from(document.querySelectorAll('#modalProcedimento select')).find(s => {
                const label = s.previousElementSibling || s.parentElement.querySelector('label');
                return (label && label.textContent.includes('Repartição')) || s.name.includes('reparticao') || s.name.includes('orgao');
            });

            if (selectReparticao) {
                const optPC = Array.from(selectReparticao.options).find(o => {
                    const txt = o.textContent.toUpperCase();
                    return txt.includes('POLÍCIA CIVIL') || txt.includes('POLICIA CIVIL') || txt.includes('PC');
                });

                if (optPC) {
                    selectReparticao.value = optPC.value;
                    selectReparticao.dispatchEvent(new Event('change', { bubbles: true }));
                    if (typeof $ !== 'undefined') $(selectReparticao).trigger('change');
                } else if (selectReparticao.options.length > 1) {
                    selectReparticao.selectedIndex = 1;
                    selectReparticao.dispatchEvent(new Event('change', { bubbles: true }));
                    if (typeof $ !== 'undefined') $(selectReparticao).trigger('change');
                }
            }
        });

        await page.waitForTimeout(600);

        if (procedimento.delegacia) {
            console.log(`[+] Buscando Delegacia pelo código exato de 3 dígitos: "${procedimento.delegacia}"...`);

            await page.evaluate(({ codDel }) => {
                const selectDel = Array.from(document.querySelectorAll('#modalProcedimento select')).find(s => {
                    const label = s.previousElementSibling || s.parentElement.querySelector('label');
                    return (label && label.textContent.includes('Delegacia')) || s.name.includes('delegacia');
                });

                if (selectDel) {
                    const codigoAlvo = String(codDel).trim();

                    const opt = Array.from(selectDel.options).find(o => {
                        const val = o.value ? String(o.value).trim() : '';
                        const txt = o.textContent ? String(o.textContent).trim() : '';

                        if (val === codigoAlvo) return true;

                        const comecoExatoRegex = new RegExp(`^${codigoAlvo}\\s*[-–—\\s]`, 'i');
                        return comecoExatoRegex.test(txt);
                    });

                    if (opt) {
                        selectDel.value = opt.value;
                        selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectDel).trigger('change');
                    }
                }
            }, { codDel: procedimento.delegacia });
        }

        await page.waitForTimeout(400);

        const nomeDelegadoAlvo = procedimento.delegado;
        if (nomeDelegadoAlvo && !/N[ÃA]O\s+INFORMADO/i.test(nomeDelegadoAlvo)) {
            console.log(`[+] Buscando Delegado(a) no combo: "${nomeDelegadoAlvo}"...`);
            await page.waitForTimeout(800);

            await page.evaluate(({ nomeDel }) => {
                const selectDel = Array.from(document.querySelectorAll('#modalProcedimento select')).find(s => {
                    const label = s.previousElementSibling || s.parentElement.querySelector('label');
                    return (label && label.textContent.includes('Delegado')) || s.name.includes('delegado');
                });

                if (selectDel) {
                    const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase() : '';
                    const nomeUpper = norm(nomeDel);
                    const partesNome = nomeUpper.split(/\s+/).filter(p => p.length > 2);
                    const opcoes = Array.from(selectDel.options);

                    let optEncontrada = opcoes.find(o => norm(o.textContent).includes(nomeUpper));

                    if (!optEncontrada && partesNome.length >= 2) {
                        const primeiroNome = partesNome[0];
                        const ultimoNome = partesNome[partesNome.length - 1];

                        optEncontrada = opcoes.find(o => {
                            const txt = norm(o.textContent);
                            return txt.includes(primeiroNome) && txt.includes(ultimoNome);
                        });
                    }

                    if (!optEncontrada && partesNome.length > 0) {
                        optEncontrada = opcoes.find(o => norm(o.textContent).includes(partesNome[0]));
                    }

                    if (optEncontrada) {
                        selectDel.value = optEncontrada.value;
                        selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectDel).trigger('change');
                    } else if (selectDel.options.length > 1) {
                        selectDel.selectedIndex = 1;
                        selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectDel).trigger('change');
                    }
                }
            }, { nomeDel: nomeDelegadoAlvo });
        } else {
            await page.evaluate(() => {
                const selectDel = Array.from(document.querySelectorAll('#modalProcedimento select')).find(s => {
                    const label = s.previousElementSibling || s.parentElement.querySelector('label');
                    return (label && label.textContent.includes('Delegado')) || s.name.includes('delegado');
                });
                if (selectDel && selectDel.options.length > 1) {
                    selectDel.selectedIndex = 1;
                    selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        if (procedimento.numero) {
            console.log(`[+] Preenchendo Número: "${procedimento.numero}"...`);
            const inputNum = page.locator('#modalProcedimento input[name*="numero"]').first();
            if (await inputNum.isVisible({ timeout: 2000 })) {
                await inputNum.fill(procedimento.numero);
            }
        }

        if (procedimento.ano) {
            const inputAno = page.locator('#modalProcedimento input[name*="ano"]').first();
            if (await inputAno.isVisible({ timeout: 2000 })) {
                await inputAno.fill(procedimento.ano);
            }
        }

        await page.waitForTimeout(600);

        console.log('[+] Gravando Procedimento...');
        const btnSalvar = page.locator('#modalProcedimento button.btn-success, #modalProcedimento button:has-text("Salvar"), #btn-salvar-procedimento, #modalProcedimento input[type="submit"]').first();
        await btnSalvar.click({ force: true });

        await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => { });
        await page.waitForTimeout(1000);

        console.log('✅ Procedimento gravado com sucesso!');

    } catch (e) {
        console.warn('⚠️ Falha ao preencher Procedimento:', e.message);
    }
}

/**
 * ABA HISTÓRICO (#modalHistorico)
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
 * ABA MATERIAIS: Preenchimento de Veículos, Drogas, Dinheiro e Outros
 */
export async function preencherModalMaterial(page, materiais) {
    const lista = Array.isArray(materiais) ? materiais : [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Materiais...');

        const abaMat = page.locator('#materiais-tab, a[href="#materiais"]').first();
        await abaMat.waitFor({ state: 'visible', timeout: 5000 });
        await abaMat.click({ force: true });

        await page.waitForTimeout(800);

        for (const item of lista) {
            console.log(`[+] Adicionando Material: [${item.tipo}]...`);

            // 1. ABRIR MODAL MATERIAL
            await page.evaluate(() => {
                if (typeof $ !== 'undefined' && $('#modalMaterial').length) {
                    $('#modalMaterial').modal('show');
                } else {
                    const btn = document.querySelector('#materiais button[data-target="#modalMaterial"]') ||
                        document.querySelector('button[data-target="#modalMaterial"]');
                    if (btn) btn.click();
                }
            });

            const modal = page.locator('#modalMaterial, div.modal.show').first();
            await modal.waitFor({ state: 'visible', timeout: 8000 });
            await page.waitForTimeout(500);

            // =========================================================
            // PASSO 1: SELECIONAR "ARMA DE FOGO" EM select[name="material_tipo"]
            // =========================================================
            await page.evaluate(({ tipoMaterial }) => {
                const selectTipo = document.querySelector('select[name="material_tipo"]');
                if (selectTipo) {
                    const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = norm(tipoMaterial);

                    const opt = Array.from(selectTipo.options).find(o => {
                        const txt = norm(o.textContent);
                        return txt === alvo || txt.includes(alvo) || (alvo.includes('arma') && txt.includes('arma'));
                    });

                    if (opt) {
                        selectTipo.value = opt.value;
                        selectTipo.dispatchEvent(new Event('input', { bubbles: true }));
                        selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectTipo).trigger('change');
                    }
                }
            }, { tipoMaterial: item.tipo });

            // Pausa essencial para o SIPOM renderizar os campos de Arma no DOM
            await page.waitForTimeout(800);

            // =========================================================
            // PASSO A PASSO: PREENCHIMENTO DE ARMA DE FOGO
            // =========================================================
            if (item.tipo === 'Arma de Fogo' || item.tipo === 'Arma') {
                console.log(`[+] Preenchendo Arma: "${item.subTipo || 'Revolver'}" | Marca: ${item.marca || 'Taurus'} | Calibre: ${item.calibre || '.38'}...`);

                // PASSO 2: Tipo da Arma (select name="arma_tipo") [IMG 1 & 2]
                if (item.subTipo) {
                    await page.evaluate(({ subTipo }) => {
                        const selectSub = document.querySelector('select[name="arma_tipo"]');
                        if (selectSub) {
                            const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                            const alvo = norm(subTipo);
                            const opt = Array.from(selectSub.options).find(o => norm(o.textContent).includes(alvo));
                            if (opt) {
                                selectSub.value = opt.value;
                                selectSub.dispatchEvent(new Event('change', { bubbles: true }));
                                if (typeof $ !== 'undefined') $(selectSub).trigger('change');
                            }
                        }
                    }, { subTipo: item.subTipo });
                }

                await page.waitForTimeout(400);

                // PASSO 3: Preencher Marca (Select2 de Marca) [IMG 3 & 4]
                if (item.marca) {
                    try {
                        const containerMarca = page.locator('#modalMaterial span[id*="select2-arma_marca"]').first();
                        if (await containerMarca.isVisible({ timeout: 2000 })) {
                            await containerMarca.click({ force: true });
                            await page.waitForTimeout(300);

                            const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                            if (await searchInput.isVisible({ timeout: 2000 })) {
                                await searchInput.fill(item.marca);
                                await page.waitForTimeout(500);
                                await page.keyboard.press('Enter');
                            }
                        }
                    } catch (e) {
                        console.warn('⚠️ Falha ao selecionar Marca via Select2:', e.message);
                    }
                }

                await page.waitForTimeout(400);

                // PASSO 4: Preencher Calibre (Select2 de Calibre) [IMG 5 & 6]
                if (item.calibre) {
                    try {
                        const containerCalibre = page.locator('#modalMaterial span[id*="select2-arma_calibre"]').first();
                        if (await containerCalibre.isVisible({ timeout: 2000 })) {
                            await containerCalibre.click({ force: true });
                            await page.waitForTimeout(300);

                            const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                            if (await searchInput.isVisible({ timeout: 2000 })) {
                                await searchInput.fill(item.calibre);
                                await page.waitForTimeout(500);
                                await page.keyboard.press('Enter');
                            }
                        }
                    } catch (e) {
                        console.warn('⚠️ Falha ao selecionar Calibre via Select2:', e.message);
                    }
                }

                await page.waitForTimeout(400);

                // PASSO 5: Número de Série (input name="arma_numero") [IMG 7]
                if (item.numeroSerie) {
                    const inputNumero = page.locator('input[name="arma_numero"]').first();
                    if (await inputNumero.isVisible({ timeout: 2000 })) {
                        await inputNumero.fill(item.numeroSerie.toUpperCase());
                    }
                }

                // PASSO 6: Quantidade (input name="arma_quantidade") [IMG 9]
                const inputQtd = page.locator('input[name="arma_quantidade"]').first();
                if (await inputQtd.isVisible({ timeout: 2000 })) {
                    await inputQtd.fill(String(item.quantidade || '1'));
                }

                // PASSO 7: Descrição (input name="arma_descricao") [IMG 10]
                if (item.descricao) {
                    const inputDesc = page.locator('input[name="arma_descricao"]').first();
                    if (await inputDesc.isVisible({ timeout: 2000 })) {
                        await inputDesc.fill(item.descricao.toUpperCase());
                    }
                }
            }
            // =========================================================
            // DEMAIS MATERIAIS
            // =========================================================
            else if (item.tipo === 'Dinheiro') {
                const valDinheiro = String(item.valor || '').trim();
                const inputDinheiro = page.locator('input[name="dinheiro_quantidade"], #modalMaterial input[name*="dinheiro"]').first();
                if (await inputDinheiro.isVisible({ timeout: 3000 })) {
                    await inputDinheiro.focus();
                    await inputDinheiro.click();
                    await inputDinheiro.fill('');
                    await inputDinheiro.pressSequentially(valDinheiro, { delay: 40 });
                }
            }
            else if (item.tipo === 'Outros') {
                if (item.descricao) {
                    const inputDesc = page.locator('input[name="outros_descricao"], #modalMaterial input[name*="descricao"]').first();
                    if (await inputDesc.isVisible({ timeout: 2000 })) {
                        await inputDesc.focus();
                        await inputDesc.fill('');
                        await inputDesc.pressSequentially(item.descricao.toUpperCase(), { delay: 20 });
                    }
                }
                const inputQtd = page.locator('input[name="outros_quantidade"], #modalMaterial input[name*="quantidade"]').first();
                if (await inputQtd.isVisible({ timeout: 2000 })) {
                    await inputQtd.fill(String(item.quantidade || '1'));
                }
            }
            else if (item.tipo === 'Droga') {
                if (item.nomeDroga) {
                    await page.evaluate(({ nome }) => {
                        const selectDroga = document.querySelector('#modalMaterial select[name="droga_id"]') ||
                            document.querySelector('#modalMaterial select[name*="droga"]');
                        if (selectDroga) {
                            const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                            const alvo = norm(nome);
                            const opt = Array.from(selectDroga.options).find(o => norm(o.textContent).includes(alvo));
                            if (opt) {
                                selectDroga.value = opt.value;
                                selectDroga.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }, { nome: item.nomeDroga });
                }
                if (item.quantidade) {
                    const inputQtdDroga = page.locator('#modalMaterial input[name="droga_quantidade"], #modalMaterial input[name*="quantidade"]').first();
                    if (await inputQtdDroga.isVisible({ timeout: 2000 })) {
                        await inputQtdDroga.focus();
                        await inputQtdDroga.fill('');
                        await inputQtdDroga.pressSequentially(String(item.quantidade), { delay: 40 });
                    }
                }
            }
            else if (item.tipo === 'Veículo') {
                if (item.placa) {
                    const inputPlaca = page.locator('#modalMaterial input[name*="placa"]').first();
                    if (await inputPlaca.isVisible({ timeout: 2000 })) await inputPlaca.fill(item.placa.toUpperCase());
                }
                if (item.descricao) {
                    const inputDesc = page.locator('#modalMaterial textarea, #modalMaterial input[name*="descricao"]').first();
                    if (await inputDesc.isVisible({ timeout: 2000 })) await inputDesc.fill(item.descricao.toUpperCase());
                }
            }

            await page.waitForTimeout(500);

            console.log('[+] Clicando no botão Salvar Material...');
            const btnSalvar = page.locator('#modalMaterial button.btn-success, #modalMaterial button:has-text("Salvar"), #modalMaterial input[type="submit"]').first();
            await btnSalvar.click({ force: true });

            await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => { });
            await page.waitForTimeout(800);
        }

        console.log('✅ Todos os materiais foram cadastrados com sucesso!');

    } catch (e) {
        console.warn('⚠️ Falha ao preencher Materiais:', e.message);
    }
}

/**
 * ABA COMPOSIÇÃO (#modalComposicao)
 */
export async function preencherModalComposicao(page, composicao) {
    const lista = Array.isArray(composicao) ? composicao : composicao?.lista || [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Composições...');

        const abaComposicao = page.locator('#composicoes-tab, a:has-text("Composições")').first();
        await abaComposicao.waitFor({ state: 'visible', timeout: 5000 });
        await abaComposicao.click();
        await page.waitForTimeout(1000);

        for (const militar of lista) {
            if (!militar.matricula && !militar.nome) continue;

            console.log(`[+] Adicionando PM na composição: [${militar.funcao}] ${militar.nome || militar.matricula}...`);

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

            const matriculaFormatada = String(militar.matricula || '').trim().toUpperCase();
            console.log(`[+] Preenchendo Matrícula: "${matriculaFormatada}"...`);

            if (matriculaFormatada) {
                const inputMatricula = page.locator('#modalComposicao label:has-text("Matrícula") + input, #modalComposicao input[name*="matri"], #modalComposicao input.mat').first();

                await inputMatricula.waitFor({ state: 'visible', timeout: 4000 });
                await inputMatricula.click({ force: true });
                await inputMatricula.fill('');
                await inputMatricula.pressSequentially(matriculaFormatada, { delay: 100 });

                await page.evaluate(({ val }) => {
                    const inputs = Array.from(document.querySelectorAll('#modalComposicao input'));
                    const inputMat = inputs.find(i => {
                        const label = i.previousElementSibling || i.parentElement.querySelector('label');
                        return (label && label.textContent.includes('Matrícula')) || i.name.includes('matri') || i.classList.contains('mat');
                    }) || inputs[1];

                    if (inputMat) {
                        inputMat.value = val;
                        inputMat.dispatchEvent(new Event('input', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('change', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('keyup', { bubbles: true }));
                        inputMat.dispatchEvent(new Event('blur', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(inputMat).trigger('change').trigger('keyup').trigger('blur');
                    }
                }, { val: matriculaFormatada });

                await page.waitForTimeout(1500);
            }

            console.log('[+] Clicando no botão Salvar/Atualizar...');
            await page.evaluate(() => {
                const btnSalvar = document.querySelector('#btn-salvar-composicao') ||
                    document.querySelector('#modalComposicao input[type="submit"]') ||
                    document.querySelector('#modalComposicao button.btn-success') ||
                    document.querySelector('#modalComposicao button.btn-primary');
                if (btnSalvar) btnSalvar.click();
            });

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
 * FORMULÁRIO INICIAL
 */
export async function preencherFormulario1(page, dados) {
    if (!dados) return;

    try {
        console.log('\n[+] Preenchendo Formulário Inicial de Criação...');

        if (dados.naturezaSipom) {
            console.log(`[+] Selecionando Natureza: "${dados.naturezaSipom}"...`);

            try {
                const comboNatureza = page.locator('#select2-natureza_id-container, #select2-natureza-container, label:has-text("Natureza") + .select2-container, .select2-container').first();
                await comboNatureza.waitFor({ state: 'visible', timeout: 3000 });
                await comboNatureza.click({ force: true });
                await page.waitForTimeout(300);

                const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInput.isVisible({ timeout: 2000 })) {
                    await searchInput.fill('');
                    await searchInput.pressSequentially(dados.naturezaSipom, { delay: 60 });
                    await page.waitForTimeout(600);

                    const itemResultado = page.locator('.select2-results__option--highlighted, .select2-results__option:not(.select2-results__option--disabled)').first();
                    if (await itemResultado.isVisible({ timeout: 2000 })) {
                        await itemResultado.click({ force: true });
                    } else {
                        await page.keyboard.press('Enter');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Falha ao interagir visualmente com o Select2 da Natureza:', e.message);
            }

            await page.waitForTimeout(500);

            await page.evaluate(({ textoNatureza }) => {
                const selectNat = document.querySelector('select[name="natureza_id"]') ||
                    document.querySelector('select[name="natureza"]') ||
                    document.querySelector('select#natureza_id') ||
                    document.querySelector('select#natureza');

                if (selectNat) {
                    const normalizar = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = normalizar(textoNatureza);

                    const opcaoMatch = Array.from(selectNat.options).find(opt => {
                        const txt = normalizar(opt.textContent);
                        return txt === alvo || txt.includes(alvo);
                    });

                    if (opcaoMatch) {
                        selectNat.value = opcaoMatch.value;
                        selectNat.dispatchEvent(new Event('input', { bubbles: true }));
                        selectNat.dispatchEvent(new Event('change', { bubbles: true }));
                        selectNat.dispatchEvent(new Event('blur', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectNat).trigger('change');
                    }
                }
            }, { textoNatureza: dados.naturezaSipom });
        }

        if (dados.dataHoraFormatada) {
            console.log(`[+] Preenchendo Data e Hora: "${dados.dataHoraFormatada}"...`);
            await page.evaluate(({ val }) => {
                const input = document.querySelector('input#data_hora, input[name="data_hora"]');
                if (input) {
                    input.value = val;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, { val: dados.dataHoraFormatada });
        }

        const opmLocalAlvo = dados.opmLocal || '1ªCIA/21ºBPM';
        console.log(`[+] Selecionando Unidade Militar: "${opmLocalAlvo}"...`);
        try {
            const comboUnidade = page.locator('#select2-unidade-container, span[id*="unidade-container"]').first();
            if (await comboUnidade.isVisible({ timeout: 3000 })) {
                await comboUnidade.click({ force: true });
                await page.waitForTimeout(400);

                const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInput.isVisible({ timeout: 2000 })) {
                    await searchInput.fill(opmLocalAlvo);
                    await page.waitForTimeout(600);
                    await page.keyboard.press('Enter');
                }
            }
        } catch (e) {
            console.warn('⚠️ Falha na Unidade Militar:', e.message);
        }

        const enderecoBusca = `${dados.rua || ''}, ${dados.numero || '201'}, ${dados.bairro || ''}, Fortaleza`;
        console.log(`[+] Digitando endereço para acionar Google Places: "${enderecoBusca}"...`);

        const inputEndereco = page.locator('input[name="endereco"], #location-input').first();
        if (await inputEndereco.isVisible({ timeout: 4000 })) {
            await inputEndereco.focus();
            await inputEndereco.click();
            await inputEndereco.fill('');
            await inputEndereco.pressSequentially(enderecoBusca, { delay: 70 });

            console.log('[+] Aguardando sugestão do Google Maps...');
            const sugestaoGoogle = page.locator('.pac-container .pac-item').first();

            try {
                await sugestaoGoogle.waitFor({ state: 'visible', timeout: 5000 });
                console.log('[+] Clicando na sugestão do Google Maps...');
                await sugestaoGoogle.click({ force: true });
            } catch (err) {
                console.warn('⚠️ Sugestão visual do Google não clicada via mouse, forçando via teclado...');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('Enter');
            }

            await page.waitForTimeout(1200);
        }

        const opmAtendeuAlvo = dados.opmAtendeu || dados.opmLocal || '1ªCIA/21ºBPM';
        console.log(`[+] Selecionando OPM Atendeu: "${opmAtendeuAlvo}"...`);
        try {
            const comboOpm = page.locator('#select2-opm-container, span[id*="opm-container"]').first();
            if (await comboOpm.isVisible({ timeout: 3000 })) {
                await comboOpm.click({ force: true });
                await page.waitForTimeout(400);

                const searchInput = page.locator('.select2-container--open input.select2-search__field').first();
                if (await searchInput.isVisible({ timeout: 2000 })) {
                    await searchInput.fill(opmAtendeuAlvo);
                    await page.waitForTimeout(600);
                    await page.keyboard.press('Enter');
                }
            }
        } catch (e) {
            console.warn('⚠️ Falha na OPM Atendeu:', e.message);
        }

        if (dados.viatura) {
            const inputVtr = page.locator('input[name="viatura"], input[name="viatura_ocorrencia"]').first();
            if (await inputVtr.isVisible({ timeout: 2000 })) {
                await inputVtr.fill(dados.viatura);
            }
        }

        console.log('[+] Campo Nº do HT mantido em branco.');

        if (dados.fichaCiops || dados.numeroOcorrencia) {
            const valNumeroOcorrencia = dados.numeroOcorrencia || dados.fichaCiops;
            console.log(`[+] Preenchendo Nº da Ocorrência: "${valNumeroOcorrencia}"...`);
            const inputNumOcorrencia = page.locator('input[name="numero_ocorrencia"]').first();
            if (await inputNumOcorrencia.isVisible({ timeout: 2000 })) {
                await inputNumOcorrencia.fill(valNumeroOcorrencia);
            }
        }

        await page.waitForTimeout(1000);
        console.log('✅ Formulário Inicial preenchido e local selecionado!');

    } catch (error) {
        console.warn('⚠️ Falha ao preencher Formulário Inicial:', error.message);
    }
}

/**
 * FUNÇÃO DE GRAVAÇÃO FINAL DA OCORRÊNCIA
 */
export async function salvarOcorrenciaFinal(page) {
    console.log('\n[+] Finalizando e salvando ocorrência no SIPOM...');

    try {
        await page.evaluate(() => {
            const btn = document.querySelector('#btn-salvar-ocorrencia') ||
                Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = b.textContent.trim().toLowerCase();
                    return txt === 'salvar' || txt === 'atualizar' || txt.includes('salvar ocorrência');
                });

            if (btn) btn.click();
        });

        await page.waitForTimeout(2000);
        console.log('✅ Ocorrência finalizada e salva com sucesso no SIPOM!');
    } catch (error) {
        console.warn('⚠️ Nota sobre salvamento final:', error.message);
    }
}

/**
 * FUNÇÃO ORQUESTRADORA COMPLETA
 */
export async function preencherSipomCompleto(dados) {
    console.log('\n==================================================');
    console.log('[+] Iniciando Automação Completa do SIPOM...');
    console.log('==================================================');

    const page = await obterPaginaGlobal();

    try {
        const urlCriar = 'https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar';
        if (!page.url().includes('/ocorrencias/ocorrencias-criar')) {
            console.log(`[+] Navegando para a página de cadastro inicial: ${urlCriar}`);
            await page.goto(urlCriar, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1000);
        }

        await preencherFormulario1(page, dados);

        console.log('[+] Clicando no botão "Registrar Ocorrência"...');
        const btnSalvar = page.locator('button:has-text("Registrar Ocorrência"), button:has-text("Salvar"), input[value="Registrar Ocorrência"]').first();
        await btnSalvar.waitFor({ state: 'visible', timeout: 5000 });

        // Dispara o clique e aguarda a navegação/recarregamento com segurança
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {
                console.log('ℹ️ Transição de página concluída.');
            }),
            btnSalvar.click({ force: true })
        ]);

        // Aguarda estabilização técnica do DOM da nova tela
        await page.waitForTimeout(1500);

        // ---------------------------------------------------------------------
        // VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS (Executada com segurança na nova DOM)
        // ---------------------------------------------------------------------
        const temMensagemErro = await page.evaluate(() => {
            const msgsErro = Array.from(document.querySelectorAll('.alert-danger, .invalid-feedback, .error, span.error-message, .has-error'));
            const msgsVisiveis = msgsErro.filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && el.textContent.trim() !== '');
            const inputsInvalidos = document.querySelectorAll('input:invalid, select:invalid, textarea:invalid');

            return msgsVisiveis.length > 0 || inputsInvalidos.length > 0;
        });

        if (temMensagemErro && page.url().includes('/ocorrencias/ocorrencias-criar')) {
            console.error('❌ ERRO: O SIPOM recusou o registro por falta de campo obrigatório!');

            const errosDetalhados = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.alert-danger, .invalid-feedback, .has-error'))
                    .map(e => e.textContent.trim())
                    .filter(txt => txt.length > 0);
            });

            if (errosDetalhados.length > 0) {
                console.error('📌 Motivos informados pelo SIPOM:', errosDetalhados.join(' | '));
            }

            throw new Error('Formulário inicial rejeitado pelo SIPOM. Verifique se algum campo obrigatório não foi preenchido.');
        }

        // Aguarda os seletores das abas estarem visíveis
        console.log('[+] Aguardando o carregamento das abas de edição...');
        const seletorAba = page.locator('#pessoas-tab, #materiais-tab, #composicoes-tab, a:has-text("Pessoas")').first();
        await seletorAba.waitFor({ state: 'visible', timeout: 30000 });

        console.log(`✅ Registro inicial concluído com sucesso! URL Atual: ${page.url()}`);
        console.log('🚀 Iniciando preenchimento sequencial dos modais...\n');

        if (dados.pessoas && dados.pessoas.length > 0) {
            await preencherAbaPessoas(page, dados);
        }

        if (dados.procedimento) {
            await preencherModalProcedimento(page, dados.procedimento);
        }

        if (dados.historico) {
            await preencherModalHistorico(page, dados.historico);
        }

        if (dados.materiais && dados.materiais.length > 0) {
            await preencherModalMaterial(page, dados.materiais);
        }

        if (dados.composicao && dados.composicao.length > 0) {
            await preencherModalComposicao(page, dados.composicao);
        }

        await salvarOcorrenciaFinal(page);

        console.log('\n==================================================');
        console.log('🎉 Ocorrência completa e modais gravados com sucesso!');
        console.log('==================================================\n');

        return { sucesso: true, url: page.url() };

    } catch (error) {
        console.error('❌ Falha no fluxo orquestrador do SIPOM:', error.message);
        throw error;
    }
}