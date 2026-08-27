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
 * Tabela De-Para com opções do SIPOM e equivalências de rua
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
    if (typeof texto === 'object') return texto; // Retorna direto se já for JSON

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

    // Resolução dos mapeamentos com fallback seguro
    const opmLocal = MAPA_BAIRROS_OPM[bairro] || '2ªCIA/21ºBPM';
    const naturezaSipom = MAPA_NATUREZAS_SIPOM[naturezaBruta.toUpperCase()] || naturezaBruta;

    // Extração exata e limpa do Histórico
    const historicoMatch = texto.split(/Histórico:/i);
    let historico = '';

    if (historicoMatch.length > 1) {
        // Pega tudo após 'Histórico:' e limpa seções posteriores caso existam
        historico = historicoMatch[1].split(/(?:Vítima|Acusado|Delegado\/Delegacia|CMT|MOT|PAT):/i)[0].trim();
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

    // Extração Dinâmica de Procedimento (Exemplos aceitos: "NOME / 132-4587/2026" ou "NOME / 12º DP / 4587 / 2026")
    const procLinha = texto.match(/Delegado\/Delegacia\/Procedimento:\s*(.+)/i)?.[1] || '';
    const procPartes = procLinha.split('/').map(s => s.trim());

    let delegado = procPartes[0] || '';
    let delegacia = '';
    let numeroProc = '';
    let anoProc = new Date().getFullYear().toString(); // Fallback dinâmico para o ano atual caso não conste no texto

    // 1ª Tentativa: Tenta capturar o formato compacto "CODIGO-NUMERO/ANO" (ex: 132-4587/2026) na linha inteira
    const matchEstruturado = procLinha.match(/(\d{2,4})\s*-\s*(\d+)(?:\/(\d{4}))?/);

    if (matchEstruturado) {
        delegacia = matchEstruturado[1].trim(); // Pega dinamicamente os números antes do hífen (ex: 132)
        numeroProc = matchEstruturado[2].trim(); // Pega dinamicamente os números após o hífen (ex: 4587)
        if (matchEstruturado[3]) anoProc = matchEstruturado[3].trim(); // Pega dinamicamente o ano (ex: 2026)
    } else {
        // 2ª Tentativa: Caso venha separado por barras (ex: "DELEGADO / DELEGACIA / NUMERO / ANO")
        if (procPartes[1]) delegacia = procPartes[1].replace(/\D/g, ''); // Extrai apenas os dígitos da delegacia
        if (procPartes[2]) numeroProc = procPartes[2].replace(/\D/g, ''); // Extrai apenas os dígitos do número
        if (procPartes[3]) anoProc = procPartes[3].replace(/\D/g, ''); // Extrai apenas os dígitos do ano
    }

    const procedimento = {
        delegado,
        delegacia, // Valor extraído dinamicamente
        numero: numeroProc, // Valor extraído dinamicamente
        ano: anoProc, // Valor extraído dinamicamente
        procedimento: 'Boletim de Ocorrência - BO'
    };

    // Extração de Materiais / Drogas
    const materiais = [];
    const textoDrogas = texto.match(/(?:Material|Apreensão|Drogas?):\s*(.+)/i)?.[1] || texto;

    // Procura padrões conhecidos de entorpecentes no texto do relatório
    const regioesEntorpecentes = [
        { regex: /(coca[ií]na|coca)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Cocaína' },
        { regex: /(crack)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Crack' },
        { regex: /(maconha|haxixe|skunk)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Maconha' },
        { regex: /(ecstasy|mdma)\s*[:\-=]?\s*(\d+(?:[.,]\d+)?)/i, tipo: 'Ecstasy/MDMA' }
    ];

    regioesEntorpecentes.forEach(item => {
        const match = textoDrogas.match(item.regex);
        if (match) {
            materiais.push({
                tipo: 'Droga',
                nomeDroga: item.tipo,
                quantidade: match[2].replace(',', '.')
            });
        }
    });

    // Extração da Composição
    const composicao = [];
    const linhasComp = texto.match(/(CMT|MOT|PAT):\s*(.+)/gi) || [];
    linhasComp.forEach(linha => {
        const match = linha.match(/(CMT|MOT|PAT):\s*([^\n\rMF]+)(?:M\.F\.:\s*([\d.-]+))?/i);
        if (match) {
            composicao.push({
                funcao: match[1].toUpperCase(),
                nome: match[2].trim(),
                matricula: match[3] ? match[3].trim() : ''
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
        materiais: [],
        composicao
    };
}