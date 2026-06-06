import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;

// JSON Schema for structured clinical summary
const summarySchema = {
  type: Type.OBJECT,
  properties: {
    identidade: {
      type: Type.OBJECT,
      properties: {
        nome: { type: Type.STRING, description: "Nome completo do paciente" },
        sexo: { type: Type.STRING, description: "Sexo do paciente" },
        idade: { type: Type.STRING, description: "Idade do paciente, ex: 72 anos" },
        peso: { type: Type.STRING, description: "Peso ideal ou real do paciente" },
        procedencia: { type: Type.STRING, description: "Procedência ou origem do paciente (ex: Pronto Socoro, enfermaria, casa)" },
        outrosDados: { type: Type.STRING, description: "Outros dados relevantes de identificação (ex: leito, prontuário)" }
      },
      required: ["nome", "sexo", "idade", "peso"]
    },
    diasInternacao: {
      type: Type.OBJECT,
      properties: {
        dataInternacao: { type: Type.STRING, description: "Data de admissão/internação do paciente" },
        diasTotais: { type: Type.STRING, description: "Total de dias de internação calculados ou informados" },
        diaIOT: { type: Type.STRING, description: "Dia em que ocorreu a Intubação Orotraqueal (IOT) de forma legível, se aplicável, ou 'Não aplicável'" },
        diaPCR: { type: Type.STRING, description: "Dia em que ocorreu a Parada Cardiorrespiratória (PCR), se aplicável, ou 'Não aplicável'" },
        intercorrencias: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de datas importantes e intercorrências clínicas registradas"
        }
      },
      required: ["dataInternacao", "diasTotais", "diaIOT", "diaPCR", "intercorrencias"]
    },
    hda: {
      type: Type.STRING,
      description: "Resumo breve, objetivo e bem estruturado da História da Doença Atual (HDA) focando na internação"
    },
    antecedentes: {
      type: Type.OBJECT,
      properties: {
        patologiasPrevias: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de patologias, comorbidades e antecedentes importantes"
        },
        medicacoesCasa: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de medicações de uso domiciliar antes da internação"
        },
        alergias: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Alergias conhecidas relatas ou 'Nega alergias'"
        }
      },
      required: ["patologiasPrevias", "medicacoesCasa", "alergias"]
    },
    exames: {
      type: Type.OBJECT,
      properties: {
        laboratoriais: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Resultados e achados dos principais exames laboratoriais mais recentes"
        },
        imagem: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Achados relevantes dos exames de imagem (ex: Raio-X de tórax, TC crânio, ressonância, eco, etc.)"
        }
      },
      required: ["laboratoriais", "imagem"]
    },
    culturasAntibioticos: {
      type: Type.OBJECT,
      properties: {
        culturas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Resultados de culturas relatadas (Secreção traqueal, urocultura, hemoculturas, etc.)"
        },
        antibioticosPrevios: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Antimicrobianos prévios informando o tempo/dias de uso se disponível"
        },
        antibioticosAtuais: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Antimicrobianos atualmente em uso com o dia de tratamento no formato 'Antibiótico (Dx)' (ex: Ceftriaxona (D5))"
        }
      },
      required: ["culturas", "antibioticosPrevios", "antibioticosAtuais"]
    },
    sinaisEParametros: {
      type: Type.OBJECT,
      properties: {
        sinaisVitais: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Sinais vitais consolidados (Pressão, FC, FR, Temp, SatO2, etc.)"
        },
        balancoHidrico: { type: Type.STRING, description: "Resumo do balanço hídrico se houver registros, se não, 'Não registrado'" },
        drogasVasoativas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Drogas vasoativas em infusão com dose (ex: Noradrenalina 0.2 mcg/kg/min) ou 'Nenhuma'"
        },
        parametrosVentilatorios: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Parâmetros de ventilação mecânica relatados (PEEP, FiO2, VC, FR, modo ventilatório, etc.) se presente"
        }
      },
      required: ["sinaisVitais", "balancoHidrico", "drogasVasoativas", "parametrosVentilatorios"]
    },
    planoCondutas: {
      type: Type.OBJECT,
      properties: {
        condutas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Condutas terapêuticas estabelecidas ou planejadas"
        },
        pendencias: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Pendências de exames, avaliações de especialistas, pendências administrativas ou de condutas"
        }
      },
      required: ["condutas", "pendencias"]
    },
    prescricaoMedica: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de todos os medicamentos extraídos em uso na prescrição médica enviada por texto ou anexo"
    }
  },
  required: [
    "identidade",
    "diasInternacao",
    "hda",
    "antecedentes",
    "exames",
    "culturasAntibioticos",
    "sinaisEParametros",
    "planoCondutas",
    "prescricaoMedica"
  ]
};

export default async function handler(req: any, res: any) {
  // CORS configuration headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { evolutionText, prescriptionText, fileData, fileMime } = req.body;

    const api_key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!api_key) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não foi configurada no ambiente do seu servidor (Vercel). " +
               "Por favor, configure esta chave nas configurações de Environment Variables do seu projeto no Vercel.",
      });
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });
    }

    const parts: any[] = [
      {
        text: `Você é um Assistente Médico Inteligente de UTI de alto nível. Seu objetivo é analisar a Evolução Clínica do paciente e opcionalmente uma Prescrição Médica para criar um Resumo de Prontuário extremamente preciso, fidedigno e estruturado.

Instruções específicas para o preenchimento de cada área:
1. Identidade: Extraia nome, sexo, idade, peso e procedência. Caso não conste na evolução, escreva 'Não informado'.
2. Dias de internação e datas importantes: Busque pela data de admissão e calcule/extraia o total de dias de internação. Identifique marcos fundamentais como data de IOT (intubação), PCR (parada cardiorrespiratória), ou intercorrências importantes (choque, picos febris, etc.).
3. HDA (História da Doença Atual): Redija um resumo breve (máximo de 6 linhas), focado e coeso de por que o paciente ingressou na UTI e a evolução médica geral.
4. Patologias prévias e medicação de casa: Divida entre comorbidades pregressas, medicações de uso crônico domiciliar e alergias.
5. Exames: Extraia exames laboratoriais mais recentes e seus resultados numéricos. Agrupe também os principais achados de exames de imagem (ex: Raio-X de tórax bilateral, TC crânio, focado etc.).
6. Culturas / Antibióticos: Lista detalhada contendo culturas colhidas e resultados. Liste antimicrobianos prévios que já foram suspensos/completados com os dias de uso e a data/dia de início se estiver indicado. Liste também os antimicrobianos atuais em uso, com o respectivo dia atual (D1, D2, D3, etc.), dose e obrigatoriamente a data de início ou dia de início se essa informação constar no texto original (ex: 'Ceftriaxona (D4) - Iniciado em 03/06/2026').
7. Sinais vitais, Balanço hídrico, DVA e Ventilação: Liste os sinais vitais, balanço hídrico das últimas 24h, dose de drogas vasoativas em uso (Noradrenalina, Vasopressina, Dobutamina, etc.) e parâmetros completos de ventilação mecânica se o paciente estiver intubado/traqueostomizado.
8. Plano Terapêutico e Condutas/Pendências: Liste as condutas terapêuticas estabelecidas (ex: manter cabeceira elevada, profilaxias ativas, etc.) e pendências (ex: aguardar resultado de PCR, solicitar parecer da nefrologia).
9. Prescrição Médica: Relacione as medicações ativas na prescrição. Faça uma lista organizada com todos os fármacos identificados na prescrição (pode ser enviada no campo 'prescriptionText' ou extraída diretamente do arquivo PDF/imagem anexo).

Seja fidedigno ao texto original. Nunca invente dados clínicos que não existam ou não possam ser deduzidos de forma segura. Se um dado importante estiver ausente nos relatos, declare como 'Não informado' ou 'Não consta no registro'.

CONTEÚDO PARA ANÁLISE:
=== EVOLUÇÃO CLÍNICA ===
${evolutionText || "Nenhuma evolução clínica anexada."}

=== PRESCRIÇÃO MÉDICA (TEXTO) ===
${prescriptionText || "Nenhuma prescrição por texto anexada."}
`,
      },
    ];

    if (fileData && fileMime) {
      parts.push({
        inlineData: {
          mimeType: fileMime,
          data: fileData,
        },
      });
      parts.push({
        text: `O arquivo anexo acima é o documento da Prescrição Médica ou Exame complementar do paciente. Por favor, extraia dele as medicações que constam na prescrição e quaisquer dados relevantes para complementar os exames, culturas ou dados clínicos exigidos.`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        temperature: 0.2,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo Gemini retornou uma resposta vazia.");
    }

    try {
      const summaryData = JSON.parse(resultText.trim());
      res.status(200).json(summaryData);
    } catch (parseError: any) {
      console.error("Erro ao analisar JSON retornado do Gemini:", resultText);
      throw new Error("O modelo Gemini retornou um formato de dados inválido e não pôde ser lido.");
    }
  } catch (error: any) {
    console.error("Erro na rota de resumo:", error);
    res.status(500).json({
      error: error.message || "Erro desconhecido ao processar a requisição com o Gemini.",
    });
  }
}
