/**
 * Mapeamento exato dos Bairros por Circunscrição da OPM (21º BPM)
 */
export const MAPA_BAIRROS_OPM = {};

export const MAPA_NATUREZAS_SIPOM = {
  // --- EQUIVALÊNCIAS / EXPRESSÕES DE RUA COMUNS ---
  "ABANDONO DE MATERIAL ILICITO": "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "ABANDONO DE MATERIAL ILÍCITO": "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "ACHADO DE ENTORPECENTE": "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "APREENSÃO DE ENTORPECENTES": "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "APREENSAO DE ENTORPECENTES": "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "TRAFICO DE DROGAS": "TRAFICO ILICITO DE DROGAS",
  "USO DE DROGAS": "USUARIOS OU DEPENDENTES DE DROGAS",
  "MANDADO DE PRISAO": "CRUMPIMENTO DE MANDADO DE PRISÃO",
  RECAPTURA: "RECAPTURA DE PRESO",
  "PORTE DE ARMA": "PORTE ILEGAL DE ARMA DE FOGO DE USO PERMITIDO",
  "POSSE DE ARMA": "POSSE IRREGULAR DE ARMA DE FOGO DE USO PERMITITDO",
  "ROUBO DE CELULAR": "ROUBO DE DISPOSITIVO DE TELEFONIA MÓVEL",

  // --- TODAS AS OPÇÕES OFICIAIS DO SISTEMA ---
  "HOMICIDIO DOLOSO": "HOMICIDIO DOLOSO",
  "LESAO CORPORAL DOLOSA": "LESAO CORPORAL DOLOSA",
  ESTUPRO: "ESTUPRO",
  "FURTO QUALIFICADO (ARROMBAMENTIO)": "FURTO QUALIFICADO (ARROMBAMENTIO)",
  "ROUBO (OUTROS)": "ROUBO (OUTROS)",
  "FURTO (OUTROS)": "FURTO(OUTROS)",
  AMEAÇA: "AMEAÇA",
  "FURTO DE VEICULO": "FURTO DE VEICULO",
  "USO DE ENTORPECENTES": "USO DE ENTORPECENTES",
  "TRAFICO DE ENTORPECENTES": "TRAFICO DE ENTORPECENTES",
  "NAO INFORMADO": "NAO INFORMADO",
  CALUNIA: "CALUNIA",
  DIFAMACÃO: "DIFAMACÃO",
  INJURIA: "INJURIA",
  "CONSTRAGIMENTO ILEGAL": "CONSTRAGIMENTO ILEGAL",
  "SEQUESTRO E CARCERE PRIVADO": "SEQUESTRO E CARCERE PRIVADO",
  "VIOLACAO DE DOMICILIO": "VIOLACAO DE DOMICILIO",
  EXTORSAO: "EXTORSAO",
  "EXTORSAO MEDIANTE SEQUESTRO": "EXTORSAO MEDIANTE SEQUESTRO",
  DANO: "DANO",
  "APROPIACAO INDEBITA": "APROPIACAO INDEBITA",
  ESTELIONATO: "ESTELIONATO",
  RECEPTACAO: "RECEPTACAO",
  "HOMICIDIO CULPOSO": "HOMICIDIO CULPOSO",
  "LESAO CORPORAL CULPOSA": "LESAO CORPORAL CULPOSA",
  "LESAO CORPORAL SEGUIDA DE MORTE": "LESAO CORPORAL SEGUIDA DE MORTE",
  "ATENTADO VIOLENTO AO PUDOR": "ATENTADO VIOLENTO AO PUDOR",
  SEDUCAO: "SEDUCAO",
  "CORRUPCAO DE MENORES": "CORRUPCAO DE MENORES",
  "NAO DELITUOSA": "NAO DELITUOSA",
  "ACIDENTES - OUTROS": "ACIDENTES - OUTROS",
  TORTURA: "TORTURA",
  "PRECOCEITO DE RACA OU DE COR": "PRECOCEITO DE RACA OU DE COR",
  "HOMICIDIO CULPOSO NO TRANSITO": "HOMICIDIO CULPOSO NO TRANSITO",
  "LESAO CORPORAL CULPOSA - TRANSITO": "LESAO CORPORAL CULPOSA - TRANSITO",
  "OUTROS CRIME CONTRA A VIDA": "OUTROS CRIME CONTRA A VIDA",
  "PERICLITACAO DA VIDA OU SAUDE": "PERICLITACAO DA VIDA OU SAUDE",
  RIXA: "RIXA",
  "OUTROS CRIMES CONTRA A LIBERDADE INDIVIDUAL":
    "OUTROS CRIMES CONTRA A LIBERDADE INDIVIDUAL",
  "ROUBO SEGUIDO DE MORTE (LATROCCINIO)":
    "ROUBO SEGUIDO DE MORTE (LATROCCINIO)",
  "OUTROS CRIMES CONTRA O PATRIMONIO": "OUTROS CRIMES CONTRA O PATRIMONIO",
  "CRIME CONTRA A PROPRIEDADE IMATERIAL":
    "CRIME CONTRA A PROPRIEDADE IMATERIAL",
  "CRIME CONTRA A ORGANIZACAO DO TRABALHO":
    "CRIME CONTRA A ORGANIZACAO DO TRABALHO",
  "CRIME CONTRA O SENTIMENTO RELIGIOSOS":
    "CRIME CONTRA O SENTIMENTO RELIGIOSOS",
  "CRIME CONTRA O RESPEITO AOS MORTOS": "CRIME CONTRA O RESPEITO AOS MORTOS",
  RAPTO: "RAPTO",
  "OUTROS CRIMES CONTRA OS COSTUMES": "OUTROS CRIMES CONTRA OS COSTUMES",
  "CRIME CONTRA A INCOLUMIDADE PUBLICA": "CRIME CONTRA A INCOLUMIDADE PUBLICA",
  "CRIME CONTRA A FE PUBLICA": "CRIME CONTRA A FE PUBLICA",
  "CRIME CONTRA A ADMINISTRACAO PUBLICA":
    "CRIME CONTRA A ADMINISTRACAO PUBLICA",
  "CONTRAVENCAO PENAL": "CONTRAVENCAO PENAL",
  "CRIME CONTRA O CONSUMIDOR": "CRIME CONTRA O CONSUMIDOR",
  "CRIME ELEITORAL": "CRIME ELEITORAL",
  "ABUSO DE AUTORIDADE": "ABUSO DE AUTORIDADE",
  "CRIME CONTRA A ORDEM TRIBUTARIA": "CRIME CONTRA A ORDEM TRIBUTARIA",
  AFOGAMENTO: "AFOGAMENTO",
  SUICIDIO: "SUICIDIO",
  "ACIDENTE DE TRABALHO": "ACIDENTE DE TRABALHO",
  "EXTRAVIO DE DOCUMENTOS/OBJETOS/VALORES":
    "EXTRAVIO DE DOCUMENTOS/OBJETOS/VALORES",
  "PORTE ILEGAL DE ARMA DE FOGO": "PORTE ILEGAL DE ARMA DE FOGO",
  "CRIME AMBIENTAL": "CRIME AMBIENTAL",
  "ROUBODE CARGA": "ROUBODE CARGA",
  "ROUBO DE VEICULO": "ROUBO DE VEICULO",
  "DIRECAO PERIGOSA": "DIRECAO PERIGOSA",
  "OUTROS CRIMES DE TRANSITO": "OUTROS CRIMES DE TRANSITO",
  "MORTE NATURAL": "MORTE NATURAL",
  "DESAPARECIMENTO DE PESSOA": "DESAPARECIMENTO DE PESSOA",
  "MORTE SUSPEITA": "MORTE SUSPEITA",
  "CRIME PREVISTO NO ESTATUTO DO MENO": "CRIME PREVISTO NO ESTATUTO DO MENO",
  "EXPLORACAO SEXUAL DE MENOR": "EXPLORACAO SEXUAL DE MENOR",
  "CRIME CONTRA A ORDEM ECONOMICA": "CRIME CONTRA A ORDEM ECONOMICA",
  "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES":
    "OUTRAS INFRAÇÕES À LEI DE ENTORPECENTES",
  "CRIME PREVISTOS NA LEI DE LICITAÇÕES":
    "CRIME PREVISTOS NA LEI DE LICITAÇÕES",
  "CRIME DE RESPONSABILIDADE DE PREFEITOS E VEREADORES":
    "CRIME DE RESPONSABILIDADE DE PREFEITOS E VEREADORES",
  "CRIME PREVISTOS NA LEI DE RESPONSABILIDADE FISCAL":
    "CRIME PREVISTOS NA LEI DE RESPONSABILIDADE FISCAL",
  "CRIME DE LAVAGEM OU OCULTAÇÃO DE BENS":
    "CRIME DE LAVAGEM OU OCULTAÇÃO DE BENS",
  "CRIME CONTRA A PAZ PUBLICA": "CRIME CONTRA A PAZ PUBLICA",
  "CRIME CONTRA A PROPRIEDADE INDUSTRIAL":
    "CRIME CONTRA A PROPRIEDADE INDUSTRIAL",
  "INTERCEPTACAO DE COMUNICAÇÕES TELEFÔNICAS":
    "INTERCEPTACAO DE COMUNICAÇÕES TELEFÔNICAS",
  "INTERCEPTAÇÃO DE SISTEMAS DE INFORMÁTICA OU TELEMÁTICA":
    "INTERCEPTAÇÃO DE SISTEMAS DE INFORMÁTICA OU TELEMÁTICA",
  "QUEBRA DE SEGREDO DE JUSTIÇA": "QUEBRA DE SEGREDO DE JUSTIÇA",
  "CRIME EM AÇÃO DE ALIMENTOS": "CRIME EM AÇÃO DE ALIMENTOS",
  "CRIME CONTRA A ADMINISTRAÇÃO PÚBLICA(PARC. SOLO URBADO)":
    "CRIME CONTRA A ADMINISTRAÇÃO PÚBLICA(PARC. SOLO URBADO)",
  "CRIME PREVISTO NA LEI DE IMPRENSA": "CRIME PREVISTO NA LEI DE IMPRENSA",
  "CRIME CONTRA A ECONOMIA POPULAR": "CRIME CONTRA A ECONOMIA POPULAR",
  "FUGA DE PRESO": "FUGA DE PRESO",
  "MORTEACIDENTAL NO TRANSITO (EXCETO HOMICIDIO CULPOSO)":
    "MORTEACIDENTAL NO TRANSITO (EXCETO HOMICIDIO CULPOSO)",
  "OUTRAS MORTES ACIDENTAIS (EXCETO HOMICIDIO CULPOSO)":
    "OUTRAS MORTES ACIDENTAIS (EXCETO HOMICIDIO CULPOSO)",
  "LESAO ACIDENTAL NO TRANSITO (EXCETO LESAO CORPORAL CULPOSA)":
    "LESAO ACIDENTAL NO TRANSITO (EXCETO LESAO CORPORAL CULPOSA)",
  "OUTRAS LESOES ACIDENTAIS (EXCETO LESAO CORPORAL CULPOSA)":
    "OUTRAS LESOES ACIDENTAIS (EXCETO LESAO CORPORAL CULPOSA)",
  "OUTRAS LESOES CORPORAIS CULPOSAS": "OUTRAS LESOES CORPORAIS CULPOSAS",
  "OUTROS CRIMES RESULTANTES EM LESAO CORPORAL":
    "OUTROS CRIMES RESULTANTES EM LESAO CORPORAL",
  "ROUBO COM RESTRICAO DE LIBERDADE DA VITIMA":
    "ROUBO COM RESTRICAO DE LIBERDADE DA VITIMA",
  "FURTO DE CARGA": "FURTO DE CARGA",
  "LAVAGEM OU OCULTACAO DE BENS,DIREITOS E VALORES":
    "LAVAGEM OU OCULTACAO DE BENS,DIREITOS E VALORES",
  "CRIME CONTRA O IDOSO": "CRIME CONTRA O IDOSO",
  "POSSE IRREGULAR DE ARMA DE FOGO DE USO PERMITITDO":
    "POSSE IRREGULAR DE ARMA DE FOGO DE USO PERMITITDO",
  "OMISSAO DE CAUTELA (POSSE DE ARMA DE FOGO)":
    "OMISSAO DE CAUTELA (POSSE DE ARMA DE FOGO)",
  "PORTE ILEGAL DE ARMA DE FOGO DE USO PERMITIDO":
    "PORTE ILEGAL DE ARMA DE FOGO DE USO PERMITIDO",
  "DISPARO DE ARMA DE FOGO": "DISPARO DE ARMA DE FOGO",
  "VIOLACAO AO ESTATUTO DE DEFESA DO TORCEDOR":
    "VIOLACAO AO ESTATUTO DE DEFESA DO TORCEDOR",
  "CRIME PREVISTO NA LEI 7347/85 ART 10":
    "CRIME PREVISTO NA LEI 7347/85 art 10",
  "CRIME PREVISTO NA LEI 9504/97 9 (NORMAS PARA ELEIÇÃO)":
    "CRIME PREVISTO NA LEI 9504/97 9 (NORMAS PARA ELEIÇÃO)",
  "FURTO DE PLACA DE VEICULO": "FURTO DE PLACA DE VEICULO",
  "FURTO DE DOCUMENTOS": "FURTO DE DOCUMENTOS",
  "EXTRAVIO DE DOCUMENTOS": "EXTRAVIO DE DOCUMENTOS",
  "QUEBRA DE SIGILO DE OPERAÇÕES FINANCEIRAS":
    "QUEBRA DE SIGILO DE OPERAÇÕES FINANCEIRAS",
  "USUARIOS OU DEPENDENTES DE DROGAS": "USUARIOS OU DEPENDENTES DE DROGAS",
  "TRAFICO ILICITO DE DRODAS": "TRAFICO ILICITO DE DRODAS",
  "VIOLAÇÃO DE DIREITOS DE AUTOR DE PROGRAMA DE COMPUTADOR":
    "VIOLAÇÃO DE DIREITOS DE AUTOR DE PROGRAMA DE COMPUTADOR",
  "CRIME DE VIOLENCIA DOMESTICA": "CRIME DE VIOLENCIA DOMESTICA",
  "TRAFICO INTERNACIONAL DE PESSOAS": "TRAFICO INTERNACIONAL DE PESSOAS",
  "TRAFICO INTERNO DE PESSOAS": "TRAFICO INTERNO DE PESSOAS",
  "OUTROS CRIMES COTRA A DIGNIDADE SEXUAL":
    "OUTROS CRIMES COTRA A DIGNIDADE SEXUAL",
  "ESTUPRO DE VULNERAVEL": "ESTUPRO DE VULNERAVEL",
  "CAUSA MORTIS IGNORADA": "CAUSA MORTIS IGNORADA",
  "EXTRAVIO DE ARMA DE FOGO": "EXTRAVIO DE ARMA DE FOGO",
  "ROUBO A BANCO": "ROUBO A BANCO",
  "ROUBO A CAIXA ELETRÔNICO": "ROUBO A CAIXA ELETRÔNICO",
  "ROUBO (SAIDINHA BANCÁRIA)": "ROUBO (SAIDINHA BANCÁRIA)",
  "DENUNCIAÇÃO CALUNIOSA": "DENUNCIAÇÃO CALUNIOSA",
  "ATENTADO CONTRA A SEG. DE TRANSP MARITIMO, FLUVIAL OU AEREO":
    "ATENTADO CONTRA A SEG. DE TRANSP MARITIMO, FLUVIAL OU AEREO",
  "ACIDENTE DE TRÂNSITO": "ACIDENTE DE TRÂNSITO",
  "ROUBO A PESSOA": "ROUBO A PESSOA",
  "ROUBO A RESIDÊNCIA": "ROUBO A RESIDÊNCIA",
  "RECUPERAÇÃO DE VEÍCULOS": "RECUPERAÇÃO DE VEÍCULOS",
  "ESTATUTO DA PESSOA COM DEFICIÊNCIA": "ESTATUTO DA PESSOA COM DEFICIÊNCIA",
  FEMINICÍDIO: "FEMINICIDIO",
  "LESÃO CORPORAL DECORRENTE DE OPOSIÇÃO À INTERVENÇÃO POLICIAL":
    "LESÃO CORPORAL DECORRENTE DE OPOSIÇÃO À INTERVENÇÃO POLICIAL",
  "HOMICÍDIO DECORRENTE DE OPOSIÇÃO À INTERVENÇÃO POLICIAL":
    "HOMICÍDIO DECORRENTE DE OPOSIÇÃO À INTERVENÇÃO POLICIAL",
  "CRUMPIMENTO DE MANDADO DE PRISÃO": "CRUMPIMENTO DE MANDADO DE PRISÃO",
  "RECAPTURA DE PRESO": "RECAPTURA DE PRESO",
  "MAUS-TRATOS AOS ANIMAIS": "MAUS-TRATOS AOS ANIMAIS",
  "PRECOCEITO DE RAÇA OU COR - CONDUTA HOMOFÓBICA":
    "PRECOCEITO DE RAÇA OU COR - CONDUTA HOMOFÓBICA",
  "PRECOCEITO DE RAÇA OU COR - CONDUTA TRANSFÓBICA":
    "PRECOCEITO DE RAÇA OU COR - CONDUTA TRANSFÓBICA",
  PERSEGUIÇÃO: "PERSEGUIÇÃO",
  "ORGANIZAÇÃO CRIMINOSA": "ORGANIZAÇÃO CRIMINOSA",
  "VIOLÊNCIA PSICOLÓGICA CONTRA A MULHER":
    "VIOLÊNCIA PSICOLÓGICA CONTRA A MULHER",
  "DESCUMPRIMENTO DE MEDIDAS PROTETIVAS DE URGÊNCIA":
    "DESCUMPRIMENTO DE MEDIDAS PROTETIVAS DE URGÊNCIA",
  "CRIMES DE TERRORISMO (LEI 13.260/2016)":
    "CRIMES DE TERRORISMO (LEI 13.260/2016)",
  "ROUBO DE DISPPOSITIVO DE TELEFONIA MÓVEL":
    "ROUBO DE DISPPOSITIVO DE TELEFONIA MÓVEL",
};

// Helper universal para identificar textos nulos ou "não informado"
function eInvalido(texto) {
  if (!texto) return true;
  const str = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return (
    str === "" ||
    str === "nao informado" ||
    str === "nao informada" ||
    str === "s/a" ||
    str === "sem informacao" ||
    str === "sem informacoes"
  );
}

export function parseRelatorioSipom(texto) {
  if (typeof texto === "object") return texto;

  const fichaCiops = texto.match(/Ficha (?:da )?CIOPS:\s*(\w+)/i)?.[1] || "";
  const naturezaBruta =
    texto.match(/Natureza (?:da Ocorrência)?:\s*(.+)/i)?.[1]?.trim() || "";
  const data = texto.match(/Data:\s*([\d\/]+)/i)?.[1] || "";
  const horaInicial = texto.match(/Inicial:\s*([\d\w:]+)/i)?.[1] || "00:00";
  const enderecoBruto = texto.match(/Endereço:\s*(.+)/i)?.[1] || "";

  // Formatação de Data/Hora (YYYY-MM-DDTHH:mm)
  let dataHoraFormatada = "";
  if (data) {
    const partesData = data.split("/");
    if (partesData.length === 3) {
      const [dia, mes, ano] = partesData;
      const horaLimpa = horaInicial
        .replace(/h|min/gi, ":")
        .replace(/:$/, "")
        .trim();
      const partesHora = horaLimpa.split(":");
      const h = (partesHora[0] || "00").padStart(2, "0");
      const m = (partesHora[1] || "00").padStart(2, "0");

      dataHoraFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}T${h}:${m}`;
    }
  }

  // Tratamento de Endereço
  const endLiso = (enderecoBruto || "").trim();

  let rua = "";
  let numero = "";
  let bairro = "";
  let cidade = "";

  // Trata o padrão: "Rua Jacy, 64 - Aracapé, Fortaleza - CE, Brasil"
  if (endLiso.includes("-") || endLiso.includes(",")) {
    const partesVirgula = endLiso.split(",").map((s) => s.trim());
    rua = partesVirgula[0] || "";

    if (partesVirgula[1]) {
      const subPartes = partesVirgula[1].split("-").map((s) => s.trim());
      numero = subPartes[0] || "";
      bairro = (subPartes[1] || "").toUpperCase();
    }

    if (partesVirgula[2]) {
      cidade = partesVirgula[2].split("-")[0].trim();
    }
  } else {
    const matchNumero = endLiso.match(/(.*?)\s+(\d+|S\/N)$/i);
    if (matchNumero) {
      rua = matchNumero[1].trim();
      numero = matchNumero[2].trim();
    } else {
      rua = endLiso;
    }
  }

  const opmLocal =
    typeof MAPA_BAIRROS_OPM !== "undefined" && MAPA_BAIRROS_OPM[bairro]
      ? MAPA_BAIRROS_OPM[bairro]
      : "2ªCIA/21ºBPM";
  const naturezaSipom =
    typeof MAPA_NATUREZAS_SIPOM !== "undefined" &&
    MAPA_NATUREZAS_SIPOM[naturezaBruta.toUpperCase()]
      ? MAPA_NATUREZAS_SIPOM[naturezaBruta.toUpperCase()]
      : naturezaBruta;

  // Extração do Histórico
  const historicoMatch = texto.split(/Histórico:/i);
  let historico = "";
  if (historicoMatch.length > 1) {
    const histBruto = historicoMatch[1].trim();
    if (!eInvalido(histBruto)) {
      historico = histBruto;
    }
  }

  // =========================================================
  // PESSOAS
  // =========================================================
  const pessoas = [];
  const blocoPessoasMatch = texto.match(
    /(?:Qualificação das Partes|Pessoas|Conduzidos?|Acusados?|Infratores?|Testemunhas?):([\s\S]*?)(?=(?:Delegado\/Delegacia|Material|Histórico|Composição):|$)/i,
  );
  const textoAnalisePessoas = blocoPessoasMatch ? blocoPessoasMatch[1] : texto;

  const blocosIndividuais = textoAnalisePessoas.split(
    /(?=(?:Infrator|Acusado|Conduzido|Vítima|Vitima|Suspeito|Testemunha):)/i,
  );

  for (const bloco of blocosIndividuais) {
    const matchNome = bloco.match(
      /(Infrator|Acusado|Conduzido|Vítima|Vitima|Suspeito|Testemunha):\s*([^\r\n]+)/i,
    );
    if (!matchNome) continue;

    const papel = matchNome[1].trim();
    const nomePessoa = matchNome[2].trim();

    // IGNORA SE O NOME FOR "NAO INFORMADO", VAZIO OU S/A
    if (eInvalido(nomePessoa)) continue;

    const matchMae = bloco.match(/(?:Mãe|Mae|Genitora):\s*([^\r\n]+)/i);
    const matchNasc = bloco.match(
      /(?:Nascimento|Data de Nascimento):\s*([^\r\n]+)/i,
    );

    const maePessoa =
      matchMae && !eInvalido(matchMae[1]) ? matchMae[1].trim() : "";
    const nascPessoa =
      matchNasc && !eInvalido(matchNasc[1]) ? matchNasc[1].trim() : "";

    let vinculo = "Vitima";
    if (/Infrator|Acusado|Conduzido|Suspeito/i.test(papel)) {
      vinculo = "Infrator";
    } else if (/Vítima|Vitima/i.test(papel)) {
      vinculo = "Vitima";
    } else if (/Testemunha/i.test(papel)) {
      vinculo = "Testemunha";
    }

    pessoas.push({
      nome: nomePessoa,
      vinculo: vinculo,
      mae: maePessoa,
      dataNascimento: nascPessoa,
    });
  }

  console.log(
    "[DEBUG PARSER] Pessoas capturadas:",
    JSON.stringify(pessoas, null, 2),
  );

  // =========================================================
  // PROCEDIMENTO
  // =========================================================
  const procLinha =
    texto.match(/Delegado\/Delegacia\/Procedimento:\s*(.+)/i)?.[1] || "";
  let procedimento = null;

  if (procLinha && !eInvalido(procLinha)) {
    const partesProc = procLinha.split("/").map((s) => s.trim());
    const delegado = !eInvalido(partesProc[0]) ? partesProc[0] : "";
    const delegaciaBruta = partesProc[1] || "";
    const tipoBruto = partesProc[2] || procLinha;

    const matchNum = procLinha.match(/(\d{3,4})\s*-\s*(\d+)(?:\/(\d{4}))?/);
    let codigoDelegacia = matchNum ? matchNum[1].trim() : "";
    let numeroProc = matchNum ? matchNum[2].trim() : "";
    let anoProc =
      matchNum && matchNum[3]
        ? matchNum[3].trim()
        : new Date().getFullYear().toString();

    let tipoProc = "Boletim de Ocorrência - BO";
    const procUpper = tipoBruto.toUpperCase();
    if (procUpper.includes("INQUERITO") || procUpper.includes(" IP "))
      tipoProc = "Inquérito Policial - IP";
    else if (
      procUpper.includes("TERMO CIRCUNSTANCIADO") ||
      procUpper.includes(" TCO ")
    )
      tipoProc = "Termo Circunstanciado de Ocorrência - TCO";
    else if (
      procUpper.includes("ATO INFRACIONAL") ||
      procUpper.includes(" AI ")
    )
      tipoProc = "Ato Infracional";

    if (delegado || codigoDelegacia || numeroProc || !eInvalido(tipoBruto)) {
      procedimento = {
        delegado: delegado,
        delegacia: codigoDelegacia || delegaciaBruta,
        numero: numeroProc,
        ano: anoProc,
        procedimento: tipoProc,
      };
    }
  }

  // =========================================================
  // MATERIAIS
  // =========================================================
  const materiais = [];
  const blocoMaterial =
    texto
      .split(/Material:/i)[1]
      ?.split(/(?:Histórico|Qualificação|Composição|Delegado):/i)[0] || "";

  if (blocoMaterial && !eInvalido(blocoMaterial)) {
    // A. Veículos
    const matchesVeiculo = blocoMaterial.matchAll(
      /(?:Ve[ií]culo|Autom[óo]vel|Motocicleta):\s*([^\r\n]+)/gi,
    );
    for (const matchVeiculo of matchesVeiculo) {
      const linhaVeiculo = matchVeiculo[1].trim();

      if (eInvalido(linhaVeiculo)) continue;

      const matchPlaca =
        linhaVeiculo.match(/([A-Z]{3}-?\d[A-Z0-9]\d{2})/i) ||
        linhaVeiculo.match(/placa\s*([A-Z0-9]{7})/i);
      const placaBruta = matchPlaca
        ? matchPlaca[1].replace("-", "").toUpperCase()
        : "";
      const placa = !eInvalido(placaBruta) ? placaBruta : "";

      // 🛑 SE NÃO HOUVER PLACA VÁLIDA (OU FOR "NAO INFORMADO"), IGNORA O VEÍCULO
      if (!placa) {
        console.log(
          `[PARSER] Veículo ignorado por falta de placa válida: "${linhaVeiculo}"`,
        );
        continue;
      }

      const situacao = /recuperad/i.test(linhaVeiculo)
        ? "Recuperado"
        : "Apreendido";

      materiais.push({
        tipo: "Veículo",
        descricao: linhaVeiculo,
        placa: placa,
        situacao: situacao,
      });
    }

    // B. Armas de Fogo
    const matchArma = blocoMaterial.match(
      /(?:Arma|Rev[óo]lver|Pistola|Espingarda|Garrucha|Carabina|Rifle|Fuzil):\s*([^\r\n]+)/i,
    );
    if (matchArma && !eInvalido(matchArma[1])) {
      const linhaArma = matchArma[1].trim();
      const matchSerie = linhaArma.match(
        /(?:N[º°]?|N|Série|Serie)\s*[:\-=]?\s*([\w]+)/i,
      );
      const matchMarca =
        linhaArma.match(/(?:marca|fabricante)\s*([A-Za-z0-9]+)/i) ||
        linhaArma.match(
          /(Taurus|Glock|Rossi|Imbel|Tanfoglio|Walther|Winchester|Canik)/i,
        );
      const matchCal = linhaArma.match(/(?:\.[\d]{2,3}|[\d]{1,2}mm)/i);

      let subTipoArma = "Revolver";
      if (/Pistola/i.test(linhaArma)) subTipoArma = "Pistola";
      else if (/Rev[óo]lver/i.test(linhaArma)) subTipoArma = "Revolver";
      else if (/Fuzil/i.test(linhaArma)) subTipoArma = "Fuzil";
      else if (/Simulacro/i.test(linhaArma)) subTipoArma = "Simulacro";
      else if (/Espingarda/i.test(linhaArma)) subTipoArma = "Espingarda";
      else if (/Carabina/i.test(linhaArma)) subTipoArma = "Carabina";
      else if (/Rifle/i.test(linhaArma)) subTipoArma = "Rifle";

      const numSerie = matchSerie ? matchSerie[1].toUpperCase() : "";

      materiais.push({
        tipo: "Arma de Fogo",
        subTipo: subTipoArma,
        marca: matchMarca ? matchMarca[1] : "Taurus",
        calibre: matchCal ? matchCal[0] : ".38",
        numeroSerie: !eInvalido(numSerie) ? numSerie : "",
        quantidade: "1",
        descricao: linhaArma,
      });
    }

    // C. Munições
    const matchMunicao = blocoMaterial.match(
      /Muniç[ãa]o:\s*(?:Calibre:\s*)?([^\r\n]+)/i,
    );
    if (matchMunicao && !eInvalido(matchMunicao[1])) {
      const linhaMunicao = matchMunicao[1].trim();
      const matchQtd =
        linhaMunicao.match(/Quantidade:\s*(\d+)/i) ||
        linhaMunicao.match(/^(\d+)/) ||
        linhaMunicao.match(/(\d+)\s*(?:muniç|unid|un)/i);
      const matchCal = linhaMunicao.match(/(?:\.[\d]{2,3}|[\d]{1,2}\s*mm)/i);

      materiais.push({
        tipo: "Munição",
        calibre: matchCal ? matchCal[0].replace(/\s+/g, "") : ".38",
        quantidade: matchQtd ? matchQtd[1] : "1",
      });
    }

    // D. Drogas
    const linhasDroga = blocoMaterial.matchAll(
      /(?:Droga|Entorpecente):\s*([^(\r\n]+)(?:\([^)]*\))?\s*(?:\(?(\d+(?:[.,]\d+)?)\s*g\)?)?/gi,
    );

    for (const match of linhasDroga) {
      const nomeBruto = match[1] ? match[1].trim() : "";
      if (eInvalido(nomeBruto)) continue;

      const matchGrama = match[0].match(/(\d+(?:[.,]\d+)?)\s*g/i);
      const gramas = matchGrama
        ? matchGrama[1].replace(",", ".")
        : match[2]
          ? match[2].replace(",", ".")
          : "";

      if (nomeBruto && gramas) {
        let nomeDrogaSipom = nomeBruto;
        const nomeUpper = nomeBruto.toUpperCase();

        if (nomeUpper.includes("SKANK") || nomeUpper.includes("SKUNK"))
          nomeDrogaSipom = "Skank";
        else if (nomeUpper.includes("COCA")) nomeDrogaSipom = "Cocaína";
        else if (nomeUpper.includes("CRACK")) nomeDrogaSipom = "Crack";
        else if (nomeUpper.includes("MACONHA")) nomeDrogaSipom = "Maconha";

        materiais.push({
          tipo: "Droga",
          nomeDroga: nomeDrogaSipom,
          quantidade: gramas,
        });
      }
    }

    // E. Dinheiro
    const matchDinheiro = blocoMaterial.match(/Dinheiro:\s*R\$\s*([\d.,]+)/i);
    if (matchDinheiro && !eInvalido(matchDinheiro[1])) {
      materiais.push({
        tipo: "Dinheiro",
        valor: matchDinheiro[1].replace(".", "").replace(",", "."),
      });
    }

    // F. Outros
    const matchOutros = blocoMaterial.matchAll(/Outros:\s*([^\r\n]+)/gi);
    for (const m of matchOutros) {
      if (m[1] && !eInvalido(m[1])) {
        materiais.push({
          tipo: "Outros",
          descricao: m[1].trim(),
          quantidade: "1",
        });
      }
    }
  }

  // =========================================================
  // COMPOSIÇÃO
  // =========================================================
  const MAPA_FUNCOES = {
    CMT: "Comandante",
    MOT: "Motorista",
    PAT: "Patrulheiro",
  };
  const composicao = [];
  const linhasComp = texto.match(/(CMT|MOT|PAT)[\s:]+[^\r\n]+/gi) || [];

  linhasComp.forEach((linha) => {
    if (eInvalido(linha)) return;

    const siglaMatch = linha.match(/(CMT|MOT|PAT)/i);
    if (!siglaMatch) return;

    const sigla = siglaMatch[1].toUpperCase();
    const matchMatricula = linha.match(
      /(?:M\.F\.?|Matr[ií]cula)\s*[:\-=]?\s*([\d.\-A-Za-z]+)/i,
    );
    let matriculaLimpa = matchMatricula
      ? matchMatricula[1].replace(/\./g, "").trim().toUpperCase()
      : "";

    if (eInvalido(matriculaLimpa)) return;

    const nomeLimpo = linha
      .replace(/(CMT|MOT|PAT)[\s:]+/i, "")
      .replace(/(?:M\.F\.?|Matr[ií]cula)\s*[:\-=]?\s*[^\r\n]+/i, "")
      .trim();

    if (eInvalido(nomeLimpo)) return;

    composicao.push({
      funcao: MAPA_FUNCOES[sigla] || "Patrulheiro",
      nome: nomeLimpo,
      matricula: matriculaLimpa,
    });
  });

  return {
    fichaCiops,
    naturezaSipom,
    dataHoraFormatada,
    rua,
    numero,
    bairro,
    cidade,
    opmLocal,
    opmAtendeu: opmLocal,
    historico,
    pessoas,
    procedimento,
    materiais,
    composicao,
  };
}
