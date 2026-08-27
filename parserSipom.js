export function parseRelatorioSipom(texto) {
    // Extração via Expressões Regulares
    const fichaCiops = texto.match(/Ficha da CIOPS:\s*(\w+)/i)?.[1] || null;
    const naturezaBruta = texto.match(/Natureza da Ocorrência:\s*(.+)/i)?.[1]?.trim() || '';
    const data = texto.match(/Data:\s*([\d\/]+)/i)?.[1] || '';
    const horaInicial = texto.match(/Inicial:\s*([\d\w]+)/i)?.[1] || '00:00';
    const enderecoBruto = texto.match(/Endereço:\s*(.+)/i)?.[1] || '';
    const viatura = texto.match(/Vtr\s*([\d]+)/i)?.[1] || '';

    // Extração de Histórico e Composições
    const historico = texto.split(/Histórico:/i)[1]?.trim() || '';

    // Tratamento de Endereço (Rua, Número, Bairro, Cidade)
    const partesEnd = enderecoBruto.split(',').map(s => s.trim());
    const rua = partesEnd[0] || '';
    const numero = partesEnd[1] || 'S/N';
    const bairro = partesEnd[2] || '';
    const cidade = partesEnd[3] || 'Fortaleza';

    // Resolução de Dicionários (De-Para)
    const opmLocal = MAPA_BAIRROS_OPM[bairro.toUpperCase()] || '2ªCIA/21ºBPM';
    const naturezaSipom = MAPA_NATUREZAS_SIPOM[naturezaBruta.toUpperCase()] || 'OUTRAS LESOES CORPORAIS CULPOSAS';

    return {
        fichaCiops,
        naturezaSipom,
        dataHoraFormatada: `${data} ${horaInicial}`,
        rua,
        numero,
        bairro,
        cidade,
        opmLocal,
        opmAtendeu: opmLocal,
        viatura: `Vtr ${viatura}`,
        historico,
        // Listas extraídas para abas secundárias
        pessoas: extrairPessoas(texto),
        procedimento: extrairProcedimento(texto),
        composicao: extrairComposicao(texto)
    };
}