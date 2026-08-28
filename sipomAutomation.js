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

/**
 * ABA PESSOAS: Garante clique na aba e abertura correta do modal
 */
export async function preencherAbaPessoas(page, dados) {
    const listaPessoas = Array.isArray(dados?.pessoas) ? dados.pessoas : [];
    if (!listaPessoas.length) return;

    try {
        console.log('\n[+] Acessando Aba: Pessoas...');

        // 1. Clica na aba de Pessoas (#pessoas-tab)
        const abaPessoas = page.locator('#pessoas-tab, a:has-text("Pessoas")').first();
        await abaPessoas.waitFor({ state: 'visible', timeout: 5000 });
        await abaPessoas.click({ force: true });
        await page.waitForTimeout(1000);

        for (const pessoa of listaPessoas) {
            console.log(`[+] Adicionando Pessoa: [${pessoa.vinculo || 'Vítima'}] ${pessoa.nome}...`);

            // 2. Clica no botão "+ Pessoa"
            const btnAbrirModal = page.locator('#pessoas button:has-text("Pessoa"), button[data-target="#modalPessoa"], .btn-success:has-text("Pessoa")').first();
            await btnAbrirModal.waitFor({ state: 'visible', timeout: 5000 });
            await btnAbrirModal.click({ force: true });

            // 3. Aguarda o Modal de Pessoa abrir
            const modalPessoa = page.locator('#modalPessoa, div.modal.show').first();
            await modalPessoa.waitFor({ state: 'visible', timeout: 8000 });
            await page.waitForTimeout(400);

            // 4. Seleção de Vínculo (Pessoas Envolvidas)
            const vinculoAlvo = pessoa.vinculo || 'Vítima';
            await page.evaluate(({ tipo }) => {
                const select = document.querySelector('#modalPessoa select[name*="vinculo"], #modalPessoa select[name*="envolvida"], .modal.show select');
                if (select) {
                    const normalizar = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = normalizar(tipo);
                    const opt = Array.from(select.options).find(o => normalizar(o.textContent).includes(alvo));
                    if (opt) {
                        select.value = opt.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }, { tipo: vinculoAlvo });

            // 5. Preenchimento de Nome
            if (pessoa.nome) {
                const inputNome = page.locator('#modalPessoa input[placeholder*="NOME"], #modalPessoa input[name*="nome"], .modal.show input[placeholder*="NOME"]').first();
                if (await inputNome.isVisible({ timeout: 2000 })) {
                    await inputNome.focus();
                    await inputNome.fill('');
                    await inputNome.fill(pessoa.nome.toUpperCase());
                    // Dispara a saída de foco para registrar o nome no formulário
                    await inputNome.evaluate(el => el.dispatchEvent(new Event('blur', { bubbles: true })));
                }
            }

            // 6. TRATAMENTO DO MODAL SECUNDÁRIO ("Pessoas encontradas")
            // Executado APÓS o preenchimento do nome para interceptar o pop-up do BD
            await page.waitForTimeout(800);

            await page.evaluate(() => {
                const modalBD = document.querySelector('#modalPessoasEncontradasOcorrencia');
                if (modalBD) {
                    modalBD.style.display = 'none';
                    modalBD.classList.remove('show');
                    modalBD.setAttribute('aria-hidden', 'true');

                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(b => b.remove());

                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = 'auto';
                }
            });

            await page.waitForTimeout(400);

            // 7. Preenchimento do Nome da Mãe (Injeção Direta + Força Eventos do DOM)
            if (pessoa.mae) {
                const nomeMaeCompleto = pessoa.mae.toUpperCase().trim();
                console.log(`[+] Preenchendo Nome da Mãe Completo: "${nomeMaeCompleto}"...`);

                // Injeta diretamente no atributo .value do elemento para impedir que o autocomplete do BD o sobrescreva
                await page.evaluate(({ valorMae }) => {
                    const inputMae = document.querySelector('#modalPessoa input[placeholder*="MÃE"]') ||
                        document.querySelector('#modalPessoa input[name*="mae"]');

                    if (inputMae) {
                        inputMae.value = valorMae;
                        inputMae.dispatchEvent(new Event('input', { bubbles: true }));
                        inputMae.dispatchEvent(new Event('change', { bubbles: true }));
                        inputMae.dispatchEvent(new Event('blur', { bubbles: true }));
                    }
                }, { valorMae: nomeMaeCompleto });

                // Reforço de segurança via Playwright
                const inputMaeLocator = page.locator('#modalPessoa input[placeholder*="MÃE"], #modalPessoa input[name*="mae"], .modal.show input[placeholder*="MÃE"]').first();
                if (await inputMaeLocator.isVisible({ timeout: 2000 })) {
                    await inputMaeLocator.focus();
                    await inputMaeLocator.fill(nomeMaeCompleto);
                }
            }

            await page.waitForTimeout(500);

            // 8. Salva a Pessoa
            const btnSalvar = page.locator('#modalPessoa button.btn-success, #modalPessoa button:has-text("Adicionar")').first();
            await btnSalvar.click({ force: true });

            await modalPessoa.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => { });
            await page.waitForTimeout(1000);
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

        // 1. Tipo de Procedimento (Ex: "Inquérito Policial - IP")
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

        // 2. Repartição de Registro * (Seleciona "Polícia Civil" por padrão ou conforme o relatório)
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
                    selectReparticao.selectedIndex = 1; // Seleciona a primeira opção válida
                    selectReparticao.dispatchEvent(new Event('change', { bubbles: true }));
                    if (typeof $ !== 'undefined') $(selectReparticao).trigger('change');
                }
            }
        });

        await page.waitForTimeout(600); // Aguarda o SIPOM carregar as delegacias ligadas à Polícia Civil

        // 3. Delegacia (Busca ESTRITA pelos 3 dígitos ex: "132")
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

        // 4. Delegado (Busca inteligente por partes do nome / tokens)
        const nomeDelegadoAlvo = procedimento.delegado;
        if (nomeDelegadoAlvo && !/N[ÃA]O\s+INFORMADO/i.test(nomeDelegadoAlvo)) {
            console.log(`[+] Buscando Delegado(a) no combo: "${nomeDelegadoAlvo}"...`);

            // Aguarda 800ms para garantir que a requisição AJAX das delegacias/delegados foi concluída
            await page.waitForTimeout(800);

            await page.evaluate(({ nomeDel }) => {
                const selectDel = Array.from(document.querySelectorAll('#modalProcedimento select')).find(s => {
                    const label = s.previousElementSibling || s.parentElement.querySelector('label');
                    return (label && label.textContent.includes('Delegado')) || s.name.includes('delegado');
                });

                if (selectDel) {
                    const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase() : '';
                    const nomeUpper = norm(nomeDel);

                    // Separa os nomes (ex: ["EDONALDO", "PEREIRA", "GOMES"]) ignorando preposições pequenas
                    const partesNome = nomeUpper.split(/\s+/).filter(p => p.length > 2);

                    const opcoes = Array.from(selectDel.options);

                    // A. Tentativa 1: Correspondência total do nome
                    let optEncontrada = opcoes.find(o => norm(o.textContent).includes(nomeUpper));

                    // B. Tentativa 2: Procura por combinação do Primeiro + Último Nome (ex: "EDONALDO" e "GOMES")
                    if (!optEncontrada && partesNome.length >= 2) {
                        const primeiroNome = partesNome[0];
                        const ultimoNome = partesNome[partesNome.length - 1];

                        optEncontrada = opcoes.find(o => {
                            const txt = norm(o.textContent);
                            return txt.includes(primeiroNome) && txt.includes(ultimoNome);
                        });
                    }

                    // C. Tentativa 3: Qualquer opção que contenha o primeiro nome
                    if (!optEncontrada && partesNome.length > 0) {
                        optEncontrada = opcoes.find(o => norm(o.textContent).includes(partesNome[0]));
                    }

                    // Aplica a seleção no DOM
                    if (optEncontrada) {
                        selectDel.value = optEncontrada.value;
                        selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectDel).trigger('change');
                    } else if (selectDel.options.length > 1) {
                        // Fallback de segurança apenas se o nome não existir de forma alguma na lista
                        selectDel.selectedIndex = 1;
                        selectDel.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectDel).trigger('change');
                    }
                }
            }, { nomeDel: nomeDelegadoAlvo });
        } else {
            // Seleciona a primeira opção disponível caso não haja delegado no relatório
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

        // 5. Número do Procedimento
        if (procedimento.numero) {
            console.log(`[+] Preenchendo Número: "${procedimento.numero}"...`);
            const inputNum = page.locator('#modalProcedimento input[name*="numero"]').first();
            if (await inputNum.isVisible({ timeout: 2000 })) {
                await inputNum.fill(procedimento.numero);
            }
        }

        // 6. Ano do Procedimento
        if (procedimento.ano) {
            const inputAno = page.locator('#modalProcedimento input[name*="ano"]').first();
            if (await inputAno.isVisible({ timeout: 2000 })) {
                await inputAno.fill(procedimento.ano);
            }
        }

        await page.waitForTimeout(600);

        // 7. Botão Salvar
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
 * ABA MATERIAIS: Transição garantida de aba e abertura do modal
 */
export async function preencherModalMaterial(page, materiais) {
    const lista = Array.isArray(materiais) ? materiais : [];
    if (!lista.length) return;

    try {
        console.log('\n[+] Acessando Aba: Materiais...');

        // 1. Clica na aba de materiais usando o ID exato (#materiais-tab)
        const abaMat = page.locator('#materiais-tab, a[href="#materiais"]').first();
        await abaMat.waitFor({ state: 'visible', timeout: 5000 });
        await abaMat.click({ force: true });

        // Aguarda a aba se tornar ativa no DOM
        await page.waitForSelector('#materiais.active, #materiais.show', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(600);

        for (const item of lista) {
            console.log(`[+] Adicionando Material: [${item.tipo}]...`);

            // 2. Abertura do Modal de Material via disparador Bootstrap JS no DOM
            await page.evaluate(() => {
                if (typeof $ !== 'undefined' && $('#modalMaterial').length) {
                    $('#modalMaterial').modal('show');
                } else {
                    const btn = document.querySelector('#materiais button[data-target="#modalMaterial"]') ||
                        document.querySelector('button[data-target="#modalMaterial"]');
                    if (btn) btn.click();
                }
            });

            // Fallback de clique pelo Playwright focado estritamente dentro do painel #materiais
            const modal = page.locator('#modalMaterial, div.modal.show').first();
            try {
                await modal.waitFor({ state: 'visible', timeout: 4000 });
            } catch (e) {
                const btnAbrir = page.locator('#materiais button[data-target="#modalMaterial"]').first();
                if (await btnAbrir.isVisible({ timeout: 2000 })) {
                    await btnAbrir.click({ force: true });
                }
                await modal.waitFor({ state: 'visible', timeout: 5000 });
            }

            await page.waitForTimeout(500);

            // 3. Seleciona o Tipo de Material no combo
            await page.evaluate(({ tipoMaterial }) => {
                const selectTipo = document.querySelector('#modalMaterial select[name*="tipo"], #modalMaterial select');
                if (selectTipo) {
                    const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                    const alvo = norm(tipoMaterial);

                    const opt = Array.from(selectTipo.options).find(o => norm(o.textContent).includes(alvo));
                    if (opt) {
                        selectTipo.value = opt.value;
                        selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
                        if (typeof $ !== 'undefined') $(selectTipo).trigger('change');
                    }
                }
            }, { tipoMaterial: item.tipo });

            await page.waitForTimeout(500);

            // 4. Preenchimento de Campos Específicos por Tipo

            //Dinheiro
            if (item.tipo === 'Dinheiro') {
                const valDinheiro = String(item.valor || '').trim();
                console.log(`[+] Preenchendo Valor do Dinheiro: "R$ ${valDinheiro}"...`);

                const inputDinheiro = page.locator('input[name="dinheiro_quantidade"], #modalMaterial input[name*="dinheiro"]').first();
                if (await inputDinheiro.isVisible({ timeout: 3000 })) {
                    await inputDinheiro.focus();
                    await inputDinheiro.click();
                    await inputDinheiro.fill('');
                    await inputDinheiro.pressSequentially(valDinheiro, { delay: 40 });
                }
            }

            //Outros
            else if (item.tipo === 'Outros') {
                // input[name="outros_descricao"]
                if (item.descricao) {
                    console.log(`[+] Preenchendo Descrição (Outros): "${item.descricao}"...`);
                    const inputDesc = page.locator('input[name="outros_descricao"], #modalMaterial input[name*="descricao"]').first();
                    if (await inputDesc.isVisible({ timeout: 2000 })) {
                        await inputDesc.focus();
                        await inputDesc.fill('');
                        await inputDesc.pressSequentially(item.descricao.toUpperCase(), { delay: 20 });
                    }
                }

                // input[name="outros_quantidade"]
                const qtdOutros = String(item.quantidade || '1');
                console.log(`[+] Preenchendo Quantidade (Outros): "${qtdOutros}"...`);
                const inputQtd = page.locator('input[name="outros_quantidade"], #modalMaterial input[name*="quantidade"]').first();
                if (await inputQtd.isVisible({ timeout: 2000 })) {
                    await inputQtd.fill(qtdOutros);
                }
            }

            //Drogas
            else if (item.tipo === 'Droga') {
                if (item.nomeDroga) {
                    console.log(`[+] Selecionando tipo de Droga no combo: "${item.nomeDroga}"...`);

                    await page.evaluate(({ nome }) => {
                        // Busca o select especificamente ligado ao campo "Droga"
                        const selectDroga = document.querySelector('#modalMaterial select[name="droga_id"]') ||
                            document.querySelector('#modalMaterial select[name*="droga"]') ||
                            Array.from(document.querySelectorAll('#modalMaterial select')).find(s => {
                                const label = s.previousElementSibling || s.parentElement.querySelector('label');
                                return label && label.textContent.includes('Droga');
                            });

                        if (selectDroga) {
                            const norm = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase() : '';
                            const alvo = norm(nome);

                            // Busca por igualdade, contendo o nome ou equivalências (Ex: Skank -> Skunk / Maconha)
                            let opt = Array.from(selectDroga.options).find(o => {
                                const txt = norm(o.textContent);
                                return txt === alvo || txt.includes(alvo) || (alvo.includes('skank') && (txt.includes('skunk') || txt.includes('skank')));
                            });

                            // Fallback se não achar Skank exato: seleciona a primeira opção que contenha Maconha ou o primeiro item válido
                            if (!opt && alvo.includes('skank')) {
                                opt = Array.from(selectDroga.options).find(o => norm(o.textContent).includes('maconha'));
                            }

                            if (opt) {
                                selectDroga.value = opt.value;
                                selectDroga.dispatchEvent(new Event('input', { bubbles: true }));
                                selectDroga.dispatchEvent(new Event('change', { bubbles: true }));
                                if (typeof $ !== 'undefined') $(selectDroga).trigger('change');
                            }
                        }
                    }, { nome: item.nomeDroga });
                }

                if (item.quantidade) {
                    console.log(`[+] Preenchendo Quantidade/Gramas: "${item.quantidade}"...`);
                    const inputQtdDroga = page.locator('#modalMaterial input[name="droga_quantidade"], #modalMaterial input[name*="quantidade"]').first();
                    if (await inputQtdDroga.isVisible({ timeout: 2000 })) {
                        await inputQtdDroga.focus();
                        await inputQtdDroga.fill('');
                        await inputQtdDroga.pressSequentially(String(item.quantidade), { delay: 40 });
                    }
                }
            }

            //Veiculo
            else if (item.tipo === 'Veículo' && item.placa) {
                const inputPlaca = page.locator('#modalMaterial input[name*="placa"]').first();
                if (await inputPlaca.isVisible({ timeout: 2000 })) {
                    await inputPlaca.fill(item.placa);
                }
            }

            await page.waitForTimeout(500);

            // 5. Salva o Material no Modal
            console.log('[+] Clicando no botão Salvar...');
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
            const matriculaFormatada = String(militar.matricula || '').trim().toUpperCase();
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

                // Aguarda 1.5s para o SIPOM consultar no banco de dados e preencher o Nome automaticamente
                await page.waitForTimeout(1500);
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
 * FORMULÁRIO INICIAL: Preenchimento do SIPOM com seleção estrita no Google Places
 */
export async function preencherFormulario1(page, dados) {
    if (!dados) return;

    try {
        console.log('\n[+] Preenchendo Formulário Inicial de Criação...');

        // 1. Natureza da Ocorrência (Preenchimento Select2 com Fallback de Validação HTML5)
        if (dados.naturezaSipom) {
            console.log(`[+] Selecionando Natureza: "${dados.naturezaSipom}"...`);

            // Força a seleção visual e via teclado no Select2
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

                    // Clica explicitamente no item destacado da lista do Select2
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

            // Injeção de Segurança no DOM para destravar a validação do HTML5 ("Selecione um item da lista")
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

        // 2. Data e Hora
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

        // 3. Unidade Militar - Local do fato (Select2: #select2-unidade-container)
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

        // 4. SELEÇÃO OBRIGATÓRIA DO ENDEREÇO VIA GOOGLE PLACES (Imagens 2 e 3)
        const enderecoBusca = `${dados.rua || ''}, ${dados.numero || '201'}, ${dados.bairro || ''}, Fortaleza`;
        console.log(`[+] Digitando endereço para acionar Google Places: "${enderecoBusca}"...`);

        const inputEndereco = page.locator('input[name="endereco"], #location-input').first();
        if (await inputEndereco.isVisible({ timeout: 4000 })) {
            await inputEndereco.focus();
            await inputEndereco.click();
            await inputEndereco.fill('');
            await inputEndereco.pressSequentially(enderecoBusca, { delay: 70 });

            // Aguarda o container de sugestões do Google aparecer na tela (.pac-container / .pac-item)
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

        // 5. OPM - Atendeu a ocorrência (Select2: #select2-opm-container)
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

        // 6. Viatura da Ocorrência
        if (dados.viatura) {
            const inputVtr = page.locator('input[name="viatura"], input[name="viatura_ocorrencia"]').first();
            if (await inputVtr.isVisible({ timeout: 2000 })) {
                await inputVtr.fill(dados.viatura);
            }
        }

        // 7. Nº do HT (mantido em branco por instrução)
        console.log('[+] Campo Nº do HT mantido em branco.');

        // 8. Nº da Ocorrência (input[name="numero_ocorrencia"])
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
 * FUNÇÃO ORQUESTRADORA: Cria a ocorrência (Formulário 1) e preenche os modais na página resultante
 */
export async function preencherSipomCompleto(dados) {
    console.log('\n==================================================');
    console.log('[+] Iniciando Automação Completa do SIPOM...');
    console.log('==================================================');

    const page = await obterPaginaGlobal();

    try {
        // 1. Redireciona para a página de criação, se ainda não estiver nela
        const urlCriar = 'https://sipom.pm.ce.gov.br/ocorrencias/ocorrencias-criar';
        if (!page.url().includes('/ocorrencias/ocorrencias-criar')) {
            console.log(`[+] Navegando para a página de cadastro inicial: ${urlCriar}`);
            await page.goto(urlCriar, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1000);
        }

        // 2. Preenche o Formulário Inicial
        await preencherFormulario1(page, dados);

        // 3. Submissão Controlada com Clique Explícito no Botão
        console.log('[+] Clicando no botão "Registrar Ocorrência"...');

        const btnSalvar = page.locator('button:has-text("Registrar Ocorrência"), button:has-text("Salvar"), input[value="Registrar Ocorrência"]').first();
        await btnSalvar.waitFor({ state: 'visible', timeout: 5000 });

        // Dispara a navegação e o clique de forma sincronizada
        await Promise.all([
            page.waitForURL((url) => url.href.includes('/ocorrencias-exibir/'), { timeout: 20000 }).catch(() => {
                console.log('ℹ️ Transição por URL direta não detectada. Verificando DOM...');
            }),
            btnSalvar.click({ force: true })
        ]);

        await page.waitForTimeout(2000);
        console.log(`[+] Ocorrência Registrada! URL atual: ${page.url()}`);

        // 4. Aguarda explicitamente as abas superiores na página de edição/exibição
        console.log('[+] Aguardando o carregamento das abas de edição...');
        const seletorAba = page.locator('#pessoas-tab, #materiais-tab, #composicoes-tab, a:has-text("Pessoas")').first();
        await seletorAba.waitFor({ state: 'visible', timeout: 15000 });

        console.log('✅ Nova página carregada! Iniciando preenchimento dos modais...\n');

        // 5. Preenchimento Sequencial das Abas e Modais
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

        console.log('\n==================================================');
        console.log('🎉 Ocorrência completa e modais gravados com sucesso!');
        console.log('==================================================\n');

        return { sucesso: true, url: page.url() };

    } catch (error) {
        console.error('❌ Falha no fluxo orquestrador do SIPOM:', error.message);
        throw error;
    }
}