/**
 * Mapeamento exato dos Bairros por Circunscrição da OPM (21º BPM)
 */
export const MAPA_BAIRROS_OPM = {
    // --- 1ª CIA / 21º BPM ---
    'CONJUNTO ESPERANÇA': '1ªCIA/21ºBPM',
    'CONJUNTO ESPERANCA': '1ªCIA/21ºBPM',
    'CONJ. ESPERANÇA': '1ªCIA/21ºBPM',
    'CONJ. ESPERANCA': '1ªCIA/21ºBPM',
    'VILA MANOEL SATIRO': '1ªCIA/21ºBPM',
    'VILA MANOEL SÁTIRO': '1ªCIA/21ºBPM',
    'PARQUE SÃO JOSÉ': '1ªCIA/21ºBPM',
    'PARQUE SAO JOSE': '1ªCIA/21ºBPM',
    'PQ SÃO JOSÉ': '1ªCIA/21ºBPM',
    'PQ SAO JOSE': '1ªCIA/21ºBPM',
    'PARQUE SANTA ROSA': '1ªCIA/21ºBPM',
    'PQ SANTA ROSA': '1ªCIA/21ºBPM',
    'PARQUE PRESIDENTE VARGAS': '1ªCIA/21ºBPM',
    'PQ PRESIDENTE VARGAS': '1ªCIA/21ºBPM',
    'PRESIDENTE VARGAS': '1ªCIA/21ºBPM',
    'CANINDEZINHO': '1ªCIA/21ºBPM',
    'MARAPONGA': '1ªCIA/21ºBPM',
    'JARDIM CEARENSE': '1ªCIA/21ºBPM',
    'NOVO MONDUBIM': '1ªCIA/21ºBPM',

    // --- 2ª CIA / 21º BPM ---
    'PLANALTO AIRTON SENA': '2ªCIA/21ºBPM',
    'PLANALTO AYRTON SENNA': '2ªCIA/21ºBPM',
    'PREFEITO JOSÉ WALTER': '2ªCIA/21ºBPM',
    'PREFEITO JOSE WALTER': '2ªCIA/21ºBPM',
    'JOSÉ WALTER': '2ªCIA/21ºBPM',
    'JOSE WALTER': '2ªCIA/21ºBPM',
    'ARACAPÉ': '2ªCIA/21ºBPM',
    'ARACAPE': '2ªCIA/21ºBPM',
    'MONDUBIM': '2ªCIA/21ºBPM',
    'CIDADE NOVA': '2ªCIA/21ºBPM',
    'PARQUE SANTANA': '2ªCIA/21ºBPM',
    'PQ SANTANA': '2ªCIA/21ºBPM',
};

/**
 * Tabela De-Para com opções do SIPOM e equivalências
 */
export const MAPA_NATUREZAS_SIPOM = {
    'ABANDONO DE MATERIAL ILICITO': 'OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES',
    'ABANDONO DE MATERIAL ILÍCITO': 'OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES',
    'ACHADO DE ENTORPECENTE': 'OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES',
    'APREENSÃO DE ENTORPECENTES': 'OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES',
    'APREENSAO DE ENTORPECENTES': 'OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES',
    'TRAFICO DE DROGAS': 'TRAFICO ILICITO DE DROGAS',
    'TRAFICO DE ENTORPECENTES': 'TRAFICO ILICITO DE DROGAS',
    'USO DE DROGAS': 'USUARIOS OU DEPENDENTES DE DROGAS',
    'MANDADO DE PRISAO': 'CRUMPIMENTO DE MANDADO DE PRISÃO',
    'RECAPTURA': 'RECAPTURA DE PRESO',
    'PORTE DE ARMA': 'PORTE ILEGAL DE ARMA DE FOGO DE USO PERMITIDO',
    'POSSE DE ARMA': 'POSSE IRREGULAR DE ARMA DE FOGO DE USO PERMITITDO',
    'ROUBO DE CELULAR': 'ROUBO DE DISPPOSITIVO DE TELEFONIA MÓVEL',
    'OUTRAS LESOES CORPORAIS CULPOSAS': 'OUTRAS LESOES CORPORAIS CULPOSAS'
};

/**
 * Função principal de parsing para extrair dados do relatório textual
 */
export function parseRelatorioSipom(texto) {
    if (typeof texto === 'object') return texto;

    const fichaCiops = texto.match(/Ficha da CIOPS:\s*(\w+)/i)?.[1] || '';
    const naturezaBruta = texto.match(/Natureza da Ocorrência:\s*(.+)/i)?.[1]?.trim() || '';
    const data = texto.match(/Data:\s*([\d\/]+)/i)?.[1] || '';
    const horaInicial = texto.match(/Inicial:\s*([\d\w]+)/i)?.[1] || '00:00';
    const enderecoBruto = texto.match(/Endereço:\s*(.+)/i)?.[1] || '';
    const viaturaMatch = texto.match(/Vtr\s*([\d]+)/i)?.[1] || '';

    // Tratamento do endereço
    const partesEnd = enderecoBruto.split(',').map(s => s.trim());
    const rua = partesEnd[0] || '';
    const numero = partesEnd[1] || 'S/N';
    const bairro = (partesEnd[2] || '').toUpperCase();
    const cidade = partesEnd[3] || 'Fortaleza';

    // Resolução dos mapeamentos
    const opmLocal = MAPA_BAIRROS_OPM[bairro] || '2ªCIA/21ºBPM';
    const naturezaSipom = MAPA_NATUREZAS_SIPOM[naturezaBruta.toUpperCase()] || naturezaBruta;

    // Extração exata e limpa do Histórico
    const historicoMatch = texto.split(/Histórico:/i);
    let historico = '';
    if (historicoMatch.length > 1) {
        historico = historicoMatch[1].split(/(?:Vítima|Acusado|Delegado\/Delegacia|CMT|MOT|PAT|Material|Apreensão):/i)[0].trim();
    }

    // Extração de Pessoas
    const pessoas = [];
    const vitimaNome = texto.match(/Vítima:\s*(.+)/i)?.[1]?.trim();
    const vitimaMae = texto.match(/Vítima:[\s\S]*?Mãe:\s*(.+)/i)?.[1]?.trim();
    if (vitimaNome) {
        pessoas.push({ nome: vitimaNome, vinculo: 'Vítima', mae: vitimaMae || '' });
    }

    const acusadoNome = texto.match(/Acusado:\s*(.+)/i)?.[1]?.trim();
    const acusadoMae = texto.match(/Acusado:[\s\S]*?Mãe:\s*(.+)/i)?.[1]?.trim();
    if (acusadoNome) {
        pessoas.push({ nome: acusadoNome, vinculo: 'Infrator', mae: acusadoMae || '' });
    }

    // Extração Dinâmica do Procedimento (ex: "EDUARDO COUTINHO / 132-4587/2026")
    const procLinha = texto.match(/Delegado\/Delegacia\/Procedimento:\s*(.+)/i)?.[1] || '';
    const procPartes = procLinha.split('/').map(s => s.trim());

    let delegado = procPartes[0] || '';
    let delegacia = '';
    let numeroProc = '';
    let anoProc = new Date().getFullYear().toString();

    const matchEstruturado = procLinha.match(/(\d{2,4})\s*-\s*(\d+)(?:\/(\d{4}))?/);
    if (matchEstruturado) {
        delegacia = matchEstruturado[1].trim(); // Pega "132"
        numeroProc = matchEstruturado[2].trim(); // Pega "4587"
        if (matchEstruturado[3]) anoProc = matchEstruturado[3].trim(); // Pega "2026"
    } else {
        if (procPartes[1]) delegacia = procPartes[1].replace(/\D/g, '');
        if (procPartes[2]) numeroProc = procPartes[2].replace(/\D/g, '');
        if (procPartes[3]) anoProc = procPartes[3].replace(/\D/g, '');
    }

    const procedimento = {
        delegado,
        delegacia,
        numero: numeroProc,
        ano: anoProc,
        procedimento: 'Boletim de Ocorrência - BO'
    };

    // Extração Dinâmica de Materiais, Drogas e Veículos
    const materiais = [];

    // 1. Captura de Veículos (Exemplo: "Veículo: Automóvel Volkswagen Polo... placa HYE2413... (recuperado)")
    const matchVeiculo = texto.match(/Ve[ií]culo:\s*([^\r\n]+)/i) || texto.match(/(?:ve[ií]culo|autom[oó]vel|motocicleta|moto)\s+([\w\s.-]+?),\s*cor\s+(\w+).*?placa\s*([\w\d]+)/i);

    if (matchVeiculo) {
        const linhaVeiculo = matchVeiculo[0] || matchVeiculo[1];

        // Extrai a placa (ex: HYE2413)
        const matchPlaca = linhaVeiculo.match(/placa\s*([A-Z0-9]{7})/i) || linhaVeiculo.match(/([A-Z]{3}-?\d[A-Z0-9]\d{2})/i);
        const placa = matchPlaca ? matchPlaca[1].replace('-', '').toUpperCase() : '';

        // Extrai a situação (Apreendido ou Recuperado)
        const situacao = linhaVeiculo.toLowerCase().includes('recuperad') ? 'Recuperado' : 'Apreendido';

        if (placa) {
            materiais.push({
                tipo: 'Veículo',
                descricao: linhaVeiculo.trim(),
                placa: placa, // HYE2413
                situacao: situacao, // Recuperado
                situacaoValue: situacao === 'Recuperado' ? '2' : '1'
            });
        }
    }

    // 2. Captura de Entorpecentes / Drogas (Maconha, Crack, Cocaína, etc)
    const regioesEntorpecentes = [
        { regex: /(coca[ií]na|coca)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Cocaína' },
        { regex: /(crack)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Crack' },
        { regex: /(maconha|haxixe|skunk)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Maconha' },
        { regex: /(ecstasy|mdma)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Ecstasy/MDMA' }
    ];

    regioesEntorpecentes.forEach(item => {
        const match = texto.match(item.regex);
        if (match) {
            materiais.push({
                tipo: 'Droga',
                nomeDroga: item.tipo,
                quantidade: match[2].replace(',', '.')
            });
        }
    });

    // Extração da Composição (CMT, MOT, PAT)
    const MAPA_FUNCOES = {
        'CMT': 'Comandante',
        'MOT': 'Motorista',
        'PAT': 'Patrulheiro'
    };

    const composicao = [];
    // Busca qualquer linha que comece com CMT, MOT ou PAT
    const linhasComp = texto.match(/(CMT|MOT|PAT)[\s:]+[^\r\n]+/gi) || [];

    linhasComp.forEach(linha => {
        const siglaMatch = linha.match(/(CMT|MOT|PAT)/i);
        if (!siglaMatch) return;

        const sigla = siglaMatch[1].toUpperCase();

        // Procura por sequências numéricas longas (Matrícula / M.F.)
        const matchMatricula = linha.match(/(?:M\.F\.?|Matr[ií]cula)?\s*[:\-=]?\s*([\d.-]{6,12})/i) || linha.match(/(\d{6,9})/);
        const matriculaLimpa = matchMatricula ? matchMatricula[1].replace(/\D/g, '') : '';

        // Nome do policial
        const nomeLimpo = linha.replace(/(CMT|MOT|PAT)[\s:]+/i, '')
            .replace(/(?:M\.F\.?|Matr[ií]cula)?\s*[:\-=]?\s*[\d.-]{6,12}/i, '')
            .trim();

        if (matriculaLimpa || nomeLimpo) {
            composicao.push({
                funcao: MAPA_FUNCOES[sigla] || 'Patrulheiro',
                nome: nomeLimpo,
                matricula: matriculaLimpa
            });
        }
    });

    return {
        fichaCiops,
        naturezaSipom,
        dataHoraFormatada: `${data} ${horaInicial.replace(/h|min/g, ':').replace(/:$/, '')}`,
        rua,
        numero,
        bairro,
        cidade,
        opmLocal,
        opmAtendeu: opmLocal,
        viatura: viaturaMatch ? `Vtr ${viaturaMatch}` : '',
        historico,
        pessoas,
        procedimento,
        materiais,
        composicao
    };
}