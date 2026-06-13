import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { PDFParse } from "pdf-parse";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to allow high-resolution prescription images/PDFs and long logs
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const api_key = process.env.GEMINI_API_KEY;

if (api_key) {
  ai = new GoogleGenAI({
    apiKey: api_key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check and environment probe
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

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
      items: {
        type: Type.OBJECT,
        properties: {
          medicamento: { type: Type.STRING, description: "Nome do medicamento, princípio ativo, solução ou soro" },
          dose: { type: Type.STRING, description: "Dose prescrita correspondente, ex: 1g, 500mg, 5mcg, 2ml, etc. Se ausente, 'Não informada'" },
          posologia: { type: Type.STRING, description: "Frequência, via de administração ou posologia, ex: de 6/6h, 1x ao dia, infusão contínua, via oral. Se ausente, 'Não informada'" }
        },
        required: ["medicamento", "dose", "posologia"]
      },
      description: "OBRIGATÓRIO: Lista contendo absolutamente TODOS, SEM EXCEÇÃO, os medicamentos, fármacos, soluções, eletrólitos, soros de diluição ou infusões ativas identificados na prescrição (texto e anexos). É um perigo clínico negligenciar qualquer item. Realize uma leitura exaustiva linha a linha."
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

// Summarization API Endpoint
app.post("/api/summarize", async (req, res) => {
  try {
    const { evolutionText, prescriptionText, fileData, fileMime, files } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não foi configurado. Por favor, adicione a sua chave de API do Gemini no painel de Configurações > Secrets do AI Studio.",
      });
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });
    }

    // 1. Normalize files list (handles either new multiple files array or legacy single file base64 fields)
    const normalizedFiles: Array<{ name: string; mimeType: string; data: string }> = [];
    if (files && Array.isArray(files)) {
      files.forEach((f, idx) => {
        if (f.data && f.mimeType) {
          normalizedFiles.push({
            name: f.name || `arquivo_${idx + 1}`,
            mimeType: f.mimeType,
            data: f.data,
          });
        }
      });
    } else if (fileData && fileMime) {
      normalizedFiles.push({
        name: "arquivo_anexo",
        mimeType: fileMime,
        data: fileData,
      });
    }

    // 2. OCR and text extraction for each uploaded file (runs in parallel for maximum speed)
    console.log(`[Summarize] Iniciando extração e OCR para ${normalizedFiles.length} arquivos...`);
    const extractedTextsPromises = normalizedFiles.map(async (f) => {
      let fileText = "";
      
      // Handle plain text files directly
      if (f.mimeType === "text/plain" || f.mimeType.startsWith("text/")) {
        try {
          fileText = Buffer.from(f.data, "base64").toString("utf-8");
          console.log(`[Summarize text] Extraído diretamente de arquivo de texto: ${f.name}`);
        } catch (e) {
          console.error(`[Summarize text] Erro ao descriptografar arquivo de texto ${f.name}:`, e);
        }
      } 
      // Handle PDF files (try PDFParse first to be fast)
      else if (f.mimeType === "application/pdf") {
        try {
          const buffer = Buffer.from(f.data, "base64");
          const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
          const textResult = await parser.getText();
          await parser.destroy();
          fileText = textResult.text || "";
          console.log(`[Summarize PDF] Extraído via PDFParse para: ${f.name} (${fileText.length} caracteres)`);
        } catch (pdfErr) {
          console.warn(`[Summarize PDF] Falha no PDFParse para ${f.name}, recuando para Gemini OCR:`, pdfErr);
        }
      }

      // If PDF has no text (scanned PDF) or it is an image, we use Gemini 3.5 Flash for dedicated OCR
      if (!fileText || fileText.trim().length < 100) {
        try {
          console.log(`[Summarize OCR] Executando OCR dedicado via Gemini para: ${f.name} (${f.mimeType})`);
          
          const ocrParts = [
            {
              inlineData: {
                mimeType: f.mimeType,
                data: f.data,
              }
            },
            {
              text: `Você é um leitor óptico clínico (OCR de Prancheta/Prescrição de UTI) ultra-analítico.
Sua única e exclusiva função é transcrever linha por linha, palavra por palavra, absolutamente TUDO o que encontrar no documento ou imagem fornecida.

DIRETRIZES DE EXTRAÇÃO ULTRA-RESILIENTE DE MEDICAÇÕES:
1. Faça uma varredura minuciosa e liste TODOS os medicamentos, princípios ativos, drogas de infusão, antibióticos, protetores gástricos, anticoagulantes, analgésicos, eletrólitos, soros e diluções.
2. Não ignore linhas de texto ou anotações à caneta/impressas.
3. Transcreva a dose de cada item (ex: "500 mg", "1g", "5mcg/kg/min", "1 ampola").
4. Transcreva a via de administração (ex: "EV", "VO", "SC", "nasogástrica").
5. Transcreva a posologia e frequência (ex: "de 6/6h", "uma vez ao dia", "infusão contínua", "se necessário").
6. Se encontrar dados sobre exames laboratoriais ou culturas no papel, transcreva-os também para complementar a ficha do paciente.

Dever Ético e de Segurança: Omissões de medicamentos em UTI põem vidas em perigo. Transcreva absolutamente tudo na íntegra, de forma literal e sem fazer resumos ou observações pessoais.`
            }
          ];

          const ocrResponse = await generateContentWithRetry({
            model: "gemini-3.5-flash",
            contents: { parts: ocrParts },
            config: {
              temperature: 0.1, // Near-deterministic response
            }
          });

          fileText = ocrResponse.text || "";
          console.log(`[Summarize OCR] OCR concluído para ${f.name}. Caracteres extraídos: ${fileText.length}`);
        } catch (ocrErr) {
          console.error(`[Summarize OCR] Erro ao executar OCR via Gemini para ${f.name}:`, ocrErr);
        }
      }

      return {
        name: f.name,
        mimeType: f.mimeType,
        text: fileText.trim()
      };
    });

    const extractionResults = await Promise.all(extractedTextsPromises);
    const validExtractions = extractionResults.filter((r) => r.text.length > 0);
    
    // Combine all extracted text blocks into a single comprehensive context block
    let ocrCombinedText = "";
    if (validExtractions.length > 0) {
      ocrCombinedText = validExtractions.map((r, i) => {
        return `=== ARQUIVO DE PRESCRIÇÃO/EXAME ANEXADO #${i + 1} (Nome: ${r.name}) ===\n[INÍCIO DA TRANSCRIÇÃO OCR]\n${r.text}\n[FIM DA TRANSCRIÇÃO OCR]`;
      }).join("\n\n");
    }

    // 3. Build parts for the final structured main clinical summary call
    const parts: any[] = [
      {
        text: `Você é um Médico Intensivista Senior e Assistente Inteligente de UTI de altíssimo nível. Seu objetivo é analisar a Evolução Clínica do paciente e as Prescrições Médicas fornecidas (fornecidas tanto por texto digitado quanto por transcrições OCR de arquivos anexados) para gerar um Resumo de Prontuário extremamente preciso, cirúrgico, estruturado e 100% fidedigno.

DIRETRIZ DE SEGURANÇA MÁXIMA - EXTRAÇÃO DE MEDICAÇÕES (ÁREA 9):
1. É ABSOLUTAMENTE CRÍTICO e OBRIGATÓRIO extrair 100% de TODAS as medicações, drogas e substâncias ativas constantes na Prescrição Médica. 
2. NÃO OMITA, NÃO ABREVIE e NÃO AGRUPE nenhum item. Se houver 15 medicamentos descritos nas imagens, páginas ou textos, você deve retornar exatamente uma lista com todos os 15 itens individuais no campo 'prescricaoMedica'.
3. Realize uma busca e varredura exaustiva linha por linha nos arquivos e textos em busca de:
   - Antibióticos, antivirais e antifúngicos;
   - Drogas vasoativas e sedativos/analgésicos (independente de estarem na evolução ou na prescrição em anexo);
   - Medicamentos de uso continuado ou profiláticos (anticoagulantes como Heparina/Enoxaparina, gastroprotetores como Omeprazol/Pantoprazol);
   - Soluções de hidratação, soros, eletrólitos (Cloreto de Potássio - KCl, Sulfato de Magnésio, Glicose, Soro Fisiológico) e diluentes de infusões;
   - Sintomáticos, antieméticos e analgésicos simples (Dipirona, Metoclopramida, etc.).
4. Para cada medicamento, você DEVE preencher cuidadosamente o objeto com as propriedades: 'medicamento', 'dose' e 'posologia'.

Instruções específicas para o preenchimento de cada área:
1. Identidade: Extraia nome, sexo, idade, peso e procedência. Caso não conste na evolução, escreva 'Não informado'.
2. Dias de internação e datas importantes: Busque pela data de admissão e calcule/extraia o total de dias de internação. Identifique marcos fundamentais como data de IOT (intubação), PCR (parada cardiorrespiratória), ou intercorrências importantes (choque, picos febris, etc.).
3. HDA (História da Doença Atual): Redija um resumo breve (máximo de 6 lines), focado e coeso de por que o paciente ingressou na UTI e a evolução médica geral.
4. Patologias prévias e medicação de casa: Divida entre comorbidades pregressas, medicações de uso crônico domiciliar e alergias.
5. Exames: Extraia exames laboratoriais mais recentes e seus resultados numéricos. Agrupe também os principais achados de exames de imagem (ex: Raio-X de tórax bilateral, TC crânio, focado etc.).
6. Culturas / Antibióticos: Lista detalhada contendo culturas colhidas e resultados. Liste antimicrobianos prévios que já foram suspensos/completados com os dias de uso e a data/dia de início se estiver indicado. Liste também os antimicrobianos atuais em uso, com o respectivo dia atual (D1, D2, D3, etc.), dose e obrigatoriamente a data de início ou dia de início se essa informação constar no texto original (ex: 'Ceftriaxona (D4) - Iniciado em 03/06/2026').
7. Sinais vitais, Balanço hídrico, DVA e Ventilação: Liste os sinais vitais, balanço hídrico das últimas 24h, dose de drogas vasoativas em uso (Noradrenalina, Vasopressina, Dobutamina, etc.) e parâmetros completos de ventilação mecânica se o paciente estiver intubado/traqueostomizado.
8. Plano Terapêutico e Condutas/Pendências: Liste as condutas terapêuticas estabelecidas (ex: manter cabeceira elevada, profilaxias ativas, etc.) e pendências (ex: aguardar resultado de PCR, solicitar parecer da nefrologia).
9. Prescrição Médica: Relacione as medicações ativas na prescrição. Faça uma lista organizada contendo 100% de todos os fármacos identificados na prescrição (pode ser enviada no campo 'prescriptionText', extraída diretamente dos arquivos PDF/imagem anexos, ou uma combinação).

Seja fidedigno ao texto original. Nunca invente dados clínicos que não existam ou não possam ser deduzidos de forma segura. Se um dado importante estiver ausente nos relatos, declare como 'Não informado' ou 'Não consta no registro'.

CONTEÚDO PARA ANÁLISE COMPLETA:
=== EVOLUÇÃO CLÍNICA ===
${evolutionText || "Nenhuma evolução clínica anexada."}

=== PRESCRIÇÃO MÉDICA (COPIADA/DIGITADA EM TEXTO) ===
${prescriptionText || "Nenhuma prescrição por texto anexada."}

=== TEXTOS/CONTEÚDOS EXTRAÍDOS DOS DOCUMENTOS E IMAGENS EM ANEXO ===
${ocrCombinedText || "Nenhum documento ou imagem anexo para OCR."}
`,
      },
    ];

    // Keep the raw images/PDFs in parts for secondary visual check fallback
    normalizedFiles.forEach((f) => {
      parts.push({
        inlineData: {
          mimeType: f.mimeType,
          data: f.data,
        },
      });
    });

    parts.push({
      text: `ATENÇÃO CRÍTICA FINAL: Utilize prioritariamente as descrições de texto e as transcrições OCR acima fornecidas para mapear a área 'prescricaoMedica'. Certifique-se de que cada item mapeado contém o parágrafo ou linha da medicação completo, dividindo-o com precisão entre o nome ('medicamento'), a 'dose' (ex: '20mg', '1g', '5ml/h' - nunca deixe em branco, use 'Não informada' se ausente) e a 'posologia' (ex: 'via oral de 12/12h', 'EV de 8/8h' - nunca deixe em branco, use 'Não informada' se ausente).`
    });

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "Você é um Médico Intensivista Sênior que realiza OCR clínico e análises estruturadas de alta fidelidade sem margem para erro. Em relação à prescrição do paciente, seu maior dever ético é listar absolutamente TODOS os itens médicos descritos (soros, diluições, eletrólitos, ampolas, doses de resgate, anticoagulantes, protetores gástricos, antibióticos e sintomáticos). É terminantemente proibido pular ou agrupar medicamentos listados na folha de prescrição médica enviada por imagem ou texto.",
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        temperature: 0.1, // Zero creativity, maximum precision and recall
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo Gemini retornou uma resposta vazia.");
    }

    try {
      const summaryData = JSON.parse(resultText.trim());
      res.json(summaryData);
    } catch (parseError: any) {
      console.error("Erro ao analisar JSON retornado de Gemini:", resultText);
      throw new Error("O modelo Gemini retornou um formato de dados inválido e não pôde ser lido.");
    }
  } catch (error: any) {
    console.error("Erro na rota de resumo:", error);
    res.status(500).json({
      error: error.message || "Erro desconhecido ao processar a requisição com o Gemini.",
    });
  }
});

// NotebookLM - Clinical AI Search Assistant Route
app.post("/api/notebook-chat", async (req, res) => {
  try {
    const { query, sources, chatHistory, strictMode } = req.body;

    if (!query) {
      return res.status(400).json({ error: "A pergunta/pesquisa é obrigatória." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não foi configurado. Por favor, adicione a sua chave de API do Gemini no painel de Configurações > Secrets do AI Studio.",
      });
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });
    }

    // Format text sources into a readable clinical document context list
    let sourcesContext = "=== FONTES DE INFORMAÇÃO / PRONTUÁRIOS ATIVOS ===\n";
    const contents: any[] = [];
    let hasPdfs = false;

    if (sources && sources.length > 0) {
      sources.forEach((src: any, idx: number) => {
        if (src.type === "pdf" && src.pdfData) {
          hasPdfs = true;
          contents.push({
            inlineData: {
              mimeType: "application/pdf",
              data: src.pdfData
            }
          });
        } else {
          sourcesContext += `\n[FONTE DE REFERÊNCIA DE BOLSO #${idx + 1}]\n`;
          sourcesContext += `Nome: ${src.name}\n`;
          sourcesContext += `Categoria/Tipo: ${src.type}\n`;
          sourcesContext += `Conteúdo:\n${src.content}\n`;
          sourcesContext += `-------------------------------------------\n`;
        }
      });
    } else {
      sourcesContext += "Nenhuma fonte adicional escrita selecionada pelo médico. Use seu conhecimento geral atualizado em medicina intensiva, pediatria, pneumologia ou clínica médica.\n";
    }

    // Prepare previous conversation logs
    let historyContext = "";
    if (chatHistory && chatHistory.length > 0) {
      historyContext = "=== HISTÓRICO DE DIÁLOGO DESTA SESSÃO ===\n";
      chatHistory.forEach((cht: any) => {
        const role = cht.role === "user" ? "Médico" : "Notebook Clínico IA";
        historyContext += `${role}: ${cht.text}\n\n`;
      });
    }

    let systemInstruction = `Você é um elite Notebook Médico Inteligente (inspirado no NotebookLM de UTI). Seu objetivo é responder dúvidas científicas, resumir dados clínicos, indicar diretrizes, propor diagnósticos diferenciais e cruzar parâmetros laboratoriais ou ventilatórios de forma segura, ética e fidedigna.

Siga rigorosamente as diretrizes abaixo:
1. Responda estritamente sob uma ótica profissional médica de alta complexidade. Seja preciso, use terminologia correta em português (Brasil).
2. Se houver informações de fontes/pacientes ativos fornecidas abaixo (ou em documentos de arquivos de anexo associados), faça correlações explícitas (ex: "Conforme o prontuário de Sebastião...", "De acordo com o PDF anexado..."). Se não houver dados clínicos correspondentes ao que foi perguntado, reporte isso com precisão e formule uma recomendação padrão.
3. Use marcadores (bullet points), negrito e tabelas para deixar a leitura rápida e limpa em ambientes de plantão intensivos corriqueiros.
4. Ao final da sua resposta, inclua obrigatoriamente uma área demarcada com as sugestões de perguntas relacionadas de forma simples.`;

    if (strictMode) {
      systemInstruction += `\n\n[REQUISITO CRÍTICO DE RESTRIÇÃO - MODO PESQUISA RESTRITA DE ARTIGOS/BIBLIOGRAFIA]
Você está operando atualmente no 'Módulo Estrito de Grounding Científico'. Você deve responder à pergunta do médico baseando-se ÚNICA E EXCLUSIVAMENTE nas fontes e nos PDFs anexados ativos fornecidos.
Se a informação necessária para formular a resposta completa não estiver contida nos documentos fornecidos ou não puder ser logicamente provada por eles, responda estritamente: "Não encontrei esta informação específica nas bibliografias e prontuários selecionados para esta consulta." Não tente adivinhar, supor ou usar seu conhecimento clínico pré-existente se a resposta não constar nas fontes. Seja extremamente rígido ao responder apenas o que está referenciado.`;
    }

    systemInstruction += `\n\nFormato esperado da resposta:
[Seu texto principal estruturado com tópicos claros]

===SUGESTOES===
[Sugestão de Pergunta Relacionada 1]
[Sugestão de Pergunta Relacionada 2]
[Sugestão de Pergunta Relacionada 3]`;

    const promptText = `${sourcesContext}

${historyContext}

=== PERGUNTA CLINICA ATUAL ===
Médico pergunta: ${query}

Notebook Clínico IA, responda com rigor e clareza:`;

    // Add prompt as the final text part or the single text element
    contents.push({
      text: promptText
    });

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: strictMode ? 0.05 : 0.25, // Very low temperature when strict mode is active to prevent hallucinations
      },
    });

    const fullResponseText = response.text || "Ops, o assistente inteligente não gerou nenhum texto.";

    // Separate main content from suggested questions
    let mainContent = fullResponseText;
    let suggestions: string[] = [];

    if (fullResponseText.includes("===SUGESTOES===")) {
      const parts = fullResponseText.split("===SUGESTOES===");
      mainContent = parts[0].trim();
      const suggestionsText = parts[1].trim();
      suggestions = suggestionsText
        .split("\n")
        .map((s) => s.replace(/^\s*[-*]?\s*/, "").trim())
        .filter((s) => s.length > 0)
        .slice(0, 3); // Max 3 suggestions
    }

    res.json({
      answer: mainContent,
      suggestions: suggestions.length > 0 ? suggestions : [
        "Quais as contraindicações de dornase alfa na SARA?",
        "Qual o cálculo de bicarbonato na acidose grave?",
        "Quais exames solicitar na suspeita de sepse de foco urinário?"
      ]
    });

  } catch (error: any) {
    console.error("Erro na rota do Notebook Chat:", error);
    res.status(500).json({
      error: error.message || "Erro de conexão ao processar com o Gemini.",
    });
  }
});

// ==========================================
// PRECEPTOR IA RAG VECTOR DATABASE ENGINE
// ==========================================

interface RAGDocument {
  id: string;
  name: string;
  size: number;
  chunkCount: number;
  uploadedAt: string;
}

interface RAGChunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  embedding: number[];
}

interface PreceptorDatabase {
  documents: RAGDocument[];
  chunks: RAGChunk[];
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "preceptor_rag.json");

function loadPreceptorDB(): PreceptorDatabase {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Erro ao carregar o banco de dados do preceptor RAG:", error);
  }
  return { documents: [], chunks: [] };
}

function savePreceptorDB(db: PreceptorDatabase) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao gravar o banco de dados do preceptor RAG:", error);
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function chunkText(text: string, defaultChunkSize = 2800, defaultOverlap = 400): string[] {
  let chunkSize = defaultChunkSize;
  let overlap = defaultOverlap;

  // Adaptive Chunking Strategy:
  // We want to avoid generating more than ~220 chunks to prevent database bloat
  // and keep processing times well within the API limits.
  // Standard avg page contains ~2,000 characters.
  // If text is extremely large (e.g., 2,000,000 characters for 1000 pages):
  // 2,000,000 / 15,000 = 133 chunks.
  if (text.length > 500000) { // Approx >250 pages of dense text
    // Automatically scale the chunk size up, starting from 2800 to up to 25000 chars.
    // We compute the target chunk size so that we stay below 200 chunks.
    const targetChunks = 180;
    chunkSize = Math.max(defaultChunkSize, Math.ceil(text.length / targetChunks));
    // Let's cap the chunkSize to 25000 to keep reasonable semantic units
    if (chunkSize > 25000) {
      chunkSize = 25000;
    }
    overlap = Math.max(defaultOverlap, Math.floor(chunkSize * 0.12));
    console.log(`[RAG Adaptive Chunking] Texto muito longo (${text.length} caracteres). Ajustando chunkSize=${chunkSize}, overlap=${overlap} dinamicamente.`);
  }

  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    let end = index + chunkSize;
    if (end > text.length) {
      end = text.length;
    } else {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > index + chunkSize / 2) {
        end = lastSpace;
      }
    }
    chunks.push(text.slice(index, end).trim());
    index += (chunkSize - overlap);
    if (index >= text.length) break;
  }
  return chunks.filter(c => c.length > 25);
}

function extractRetryDelayMs(err: any): number | null {
  if (!err) return null;
  const errStr = typeof err === "string" ? err : err.message || JSON.stringify(err) || "";
  
  // Try matching "Please retry in X.XXs"
  const pleaseRetryMatch = errStr.match(/please\s+retry\s+in\s+([\d.]+)\s*s/i);
  if (pleaseRetryMatch && pleaseRetryMatch[1]) {
    const secs = parseFloat(pleaseRetryMatch[1]);
    if (!isNaN(secs)) {
      return Math.ceil(secs * 1000);
    }
  }
  
  // Try matching "retryDelay": "Xs" or "retryDelay": "X" or "retryDelay": X
  const retryDelayMatch = errStr.match(/"retryDelay"\s*:\s*"(\d+)s?"/i);
  if (retryDelayMatch && retryDelayMatch[1]) {
    const secs = parseInt(retryDelayMatch[1], 10);
    if (!isNaN(secs)) {
      return secs * 1000;
    }
  }
  
  return null;
}

async function getEmbedding(text: string, retries = 10, delay = 1500): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada.");
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = (await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: text,
      })) as any;

      let values: number[] | undefined;
      if (response && response.embedding && Array.isArray(response.embedding.values)) {
        values = response.embedding.values;
      } else if (response && Array.isArray(response.embeddings) && response.embeddings[0] && Array.isArray(response.embeddings[0].values)) {
        values = response.embeddings[0].values;
      }

      if (!values) {
        console.error("[RAG Embedding Error] Estrutura inesperada na resposta do embedding:", response);
        throw new Error("Falha ao obter vetor de incorporação (embedding).");
      }
      return values;
    } catch (err: any) {
      const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err) || "";
      const isRateLimit = err?.status === 429 || 
                          errStr.includes("RESOURCE_EXHAUSTED") || 
                          errStr.includes("quota") || 
                          errStr.includes("limit") || 
                          errStr.includes("Limit") || 
                          errStr.includes("429");
                          
      const isUnavailable = err?.status === 503 ||
                            errStr.includes("UNAVAILABLE") ||
                            errStr.includes("temporary") ||
                            errStr.includes("demand") ||
                            errStr.includes("experiencing high demand") ||
                            errStr.includes("503");
      
      if ((isRateLimit || isUnavailable) && attempt < retries) {
        let backoff = extractRetryDelayMs(err);
        if (backoff) {
          backoff += 2500; // Add extra safety padding
        } else {
          backoff = Math.ceil(delay * Math.pow(1.8, attempt) + Math.random() * 1000);
        }
        console.warn(`[RAG Embedding Check] Cota ou Indisponibilidade detectada (${isRateLimit ? '429' : '503'}) (tentativa ${attempt}/${retries}). Aguardando ${backoff}ms antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      console.error(`[RAG Embedding System Error] Erro ao requerer embedding do Gemini (tentativa ${attempt}/${retries}):`, err);
      if (attempt === retries) {
        throw err;
      }
    }
  }
  throw new Error("Falha na geração do embedding após múltiplas tentativas de cota.");
}

async function generateContentWithRetry(params: any, retries = 10, delay = 1500): Promise<any> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada.");
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (err: any) {
      const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err) || "";
      const isRateLimit = err?.status === 429 || 
                          errStr.includes("RESOURCE_EXHAUSTED") || 
                          errStr.includes("quota") || 
                          errStr.includes("limit") || 
                          errStr.includes("Limit") || 
                          errStr.includes("429");
                          
      const isUnavailable = err?.status === 503 ||
                            errStr.includes("UNAVAILABLE") ||
                            errStr.includes("temporary") ||
                            errStr.includes("demand") ||
                            errStr.includes("experiencing high demand") ||
                            errStr.includes("503");

      if ((isRateLimit || isUnavailable) && attempt < retries) {
        let backoff = extractRetryDelayMs(err);
        if (backoff) {
          backoff += 2500; // Add extra safety padding
        } else {
          backoff = Math.ceil(delay * Math.pow(1.8, attempt) + Math.random() * 1000);
        }
        console.warn(`[Gemini Content Retry] Cota ou Indisponibilidade detectada (${isRateLimit ? '429' : '503'}) (tentativa ${attempt}/${retries}). Aguardando ${backoff}ms antes de tentar novamente... Erro: ${errStr.slice(0, 150)}`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      console.error(`[Gemini Content Error] Erro irrecuperável ou limite de tentativas excedido (tentativa ${attempt}/${retries}):`, err);
      throw err;
    }
  }
  throw new Error("Falha na geração de conteúdo do Gemini após múltiplas tentativas de cota/indisponibilidade.");
}

async function getEmbeddingsBatch(texts: string[], maxBatchSize = 15, retries = 10, delay = 1500): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("A chave GEMINI_API_KEY não foi configurada.");
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += maxBatchSize) {
    const batchTexts = texts.slice(i, i + maxBatchSize);
    
    if (i > 0) {
      // Pace batches to avoid high RPM peaks
      console.log(`[RAG Embedding Batch] Aguardando 1500ms de segurança entre fatias para respeitar o limite de cota...`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    
    console.log(`[RAG Embedding Batch] Processando lote de embeddings: ${Math.floor(i / maxBatchSize) + 1}/${Math.ceil(texts.length / maxBatchSize)} (fatias ${i} a ${i + batchTexts.length - 1} de ${texts.length})`);
    
    const contentsParam = batchTexts.map(text => ({
      parts: [{ text }]
    }));
    
    let batchSuccess = false;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = (await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: contentsParam,
        })) as any;
        
        let batchValues: number[][] = [];
        if (response && Array.isArray(response.embeddings)) {
          batchValues = response.embeddings.map((emb: any) => emb?.values).filter(Boolean);
        }
        
        if (batchValues.length !== batchTexts.length) {
          console.error(`[RAG Embedding Batch Error] Recebidos ${batchValues.length} embeddings, mas requisitamos ${batchTexts.length}.`, response);
          throw new Error("Tamanho da resposta de embeddings não coincide com o lote.");
        }
        
        allEmbeddings.push(...batchValues);
        batchSuccess = true;
        break;
      } catch (err: any) {
        const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err) || "";
        const isRateLimit = err?.status === 429 || 
                            errStr.includes("RESOURCE_EXHAUSTED") || 
                            errStr.includes("quota") || 
                            errStr.includes("limit") || 
                            errStr.includes("Limit") || 
                            errStr.includes("429");
                            
        const isUnavailable = err?.status === 503 ||
                              errStr.includes("UNAVAILABLE") ||
                              errStr.includes("temporary") ||
                              errStr.includes("demand") ||
                              errStr.includes("experiencing high demand") ||
                              errStr.includes("503");
        
        if ((isRateLimit || isUnavailable) && attempt < retries) {
          let backoff = extractRetryDelayMs(err);
          if (backoff) {
            backoff += 2500; // Add extra safety padding
          } else {
            backoff = Math.ceil(delay * Math.pow(1.8, attempt) + Math.random() * 1000);
          }
          console.warn(`[RAG Embedding Batch Check] Cota ou Indisponibilidade detectada (${isRateLimit ? '429' : '503'}) no lote (tentativa ${attempt}/${retries}). Aguardando ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }
        console.error(`[RAG Embedding Batch System Error] Erro ao requerer embeddings em lote (tentativa ${attempt}/${retries}):`, err);
        if (attempt === retries) {
          throw err;
        }
      }
    }
  }
  
  return allEmbeddings;
}

async function seedDefaultProtocols() {
  try {
    const db = loadPreceptorDB();
    if (db.documents.length > 0) return;

    console.log("[Preceptor RAG] Semeando diretrizes de UTI padrão...");
    const defaultDocs = [
      {
        name: "Diretrizes de Ventilação Mecânica Protetora (SARA).txt",
        chunks: [
          "SARA (Síndrome do Desconforto Respiratório Agudo): Ventilação protetora é mandatória. Use volume corrente (VC) ultra-protetor de 4 a 6 mL/kg de peso ideal (relação baseada na altura e sexo, nunca no peso real). Mantenha a Pressão de Platô (Pplatô) rigorosamente abaixo de 30 cmH2O and a Driving Pressure (Pressão de Distensão = Pplatô - PEEP) abaixo de 15 cmH2O. Se a Driving Pressure estiver > 15, diminua o volume corrente para até 4 mL/kg ou aumente a PEEP com cautela, desde que o platô permaneça seguro.",
          "Titulação de PEEP e Suporte Avançado na SARA: Em casos de SARA moderada a grave com relação PaO2/FiO2 < 150, indique posição prona por no mínimo 16 horas consecutivas. A PEEP deve ser titulada utilizando a tabela PEEP alta versus FiO2 estimando a melhor complacência pulmonar estática. Se houver assincronia grave ou complacência critically low, utilize bloqueador neuromuscular contínuo (ex: Cisatracúrio) nas primeiras 48 horas como estratégia coadjuvante de estabilização pulmonar.",
          "Ventilação de Obstrução de Vias Aéreas (DPOC e Asma): Nas crises severas de asma e exacerbação de DPOC na UTI, evite aprisionamento aéreo e Auto-PEEP. Fixe uma frequência respiratória baixa (8 a 12 rpm) e aumente o fluxo inspiratório para proporcionar uma relação I:E longa de 1:3 ou 1:4. Tolere hipercapnia permissiva (pH > 7.20) para evitar pressões elevadas. A PEEP aplicada deve ser baixa: em torno de 3 a 5 cmH2O (ou menor que 80% da auto-PEEP medida) apenas para facilitar o disparo do ventilador."
        ]
      },
      {
        name: "Protocolo de Sepse e Choque Séptico (Sepsis-3).txt",
        chunks: [
          "Definição de Sepse e Choque Séptico: Sepse é definida como disfunção de órgãos com risco de morte, decorrente de resposta desregulada do paciente a um processo infeccioso suspeito ou confirmado (escore SOFA aumentado em >= 2 pontos). O Choque Séptico é identificado clinicamente pela necessidade contínua de vasopressor para manter Pressão Arterial Média (PAM) acima de 65 mmHg E lactato sérico elevado (> 2.0 mmol/L ou 18 mg/dL) mesmo após ressuscitação volêmica adequada.",
          "Pacote de Primeira Hora da Sepse (Sepsis-3 Bundle): Inicie as condutas de suporte imediatamente na suspeita de sepse na primeira hora: 1. Meça o lactato sérico (repita o exame se > 2 mmol/L nas próximas 2 a 4h); 2. Cole pelo menos dois pares de hemoculturas (de acessos diferentes) antes de infundir os antibióticos; 3. Administre antimicrobianos de amplo espectro empíricos direcionados; 4. Inicie ressuscitação hídrica agressiva imediata com 30 mL/kg de cristaloides (ex: Ringer Lactato ou Soro Fisiológico) para pacientes apresentando hipotensão arterial ou lactato >= 4 mmol/L.",
          "Suporte Hemodinâmico no Choque Séptico: Se o paciente persistir hipotenso após a infusão do cristaloide (30 mL/kg) ou se as pressões estiverem criticamente baixas antes da infusão total terminar, instale imediatamente a infusão contínua de Noradrenalina (vasopressor de primeira escolha) no acesso central. O alvo hemodinâmico estrito é manter a PAM >= 65 mmHg. Avalie a responsividade fluida através de exames dinâmicos (como elevação passiva de pernas, variação de pressão de pulso) para evitar hiper-hidratação."
        ]
      },
      {
        name: "Protocolo de Intubação de Sequência Rápida (ISR) em UTI.txt",
        chunks: [
          "As Sete Etapas da Intubação de Sequência Rápida (ISR): 1. Preparação (equipe, monitor, vias aéreas principal/reserva); 2. Pré-oxigenação (O2 100% por 3-5 minutos na máscara ou VNI); 3. Otimização hemodinâmica (soro ou vasopressores rápidos em hipotensos); 4. Pré-tratamento (Lidocaína 1.5 mg/kg em broncoespasmo/HIC, ou Fentanil 1-2 mcg/kg se disfunção coronariana); 5. Sedação rápida indutiva; 6. Bloqueio neuromuscular (paralisia imediata); 7. Passagem do tubo e confirmação por capnografia.",
          "Sedativos de Escolha para Indução de ISR: Etomidato (0.3 mg/kg IV) é o indutor mais estável hemodinamicamente, ideal na hipotensão, embora possa inibir transitoriamente a adrenal. Cetamina (1.5 a 2.0 mg/kg IV) é excelente em asmáticos e pacientes chocados pela liberação de catecolaminas endógenas (causa broncodilatação e leve elevação pressórica). Propofol (1.0 a 2.0 mg/kg IV) deve ser evitado ou usado em doses muito baixas se o paciente estiver instável, pois causa vasodilatação profunda e depressão miocárdica direta.",
          "Bloqueadores Neuromusculares na Sequência Rápida: Succinilcolina (1.0 a 1.5 mg/kg IV) é o relaxante despolarizante clássico de ação mais veloz (início 45s, duração de 5-10 minutos). É contraindicada em pacientes com hipercalemia (> 5.5 mEq/L), histórico de hipertermia maligna, queimaduras extensas há mais de 72h ou rabdomiólise crônica. O Rocurônio (1.2 mg/kg IV) é a alternativa não despolarizante ideal com início em 60s e ação mais longa (40-60 minutos), podendo ter o seu efeito revertido prontamente por Sugamadex."
        ]
      }
    ];

    if (!process.env.GEMINI_API_KEY) {
      console.log("[Preceptor RAG] Semeadeira pulada: Chave do Gemini ausente.");
      return;
    }

    for (const doc of defaultDocs) {
      const docId = "seed-" + doc.name.replace(/\s+/g, "-").toLowerCase();
      console.log(`[Preceptor RAG] Indexando documento padrão: ${doc.name}`);
      
      const embeddings = await getEmbeddingsBatch(doc.chunks);
      const chunkEntities: RAGChunk[] = doc.chunks.map((text, i) => ({
        id: `${docId}-chunk-${i}`,
        docId,
        docName: doc.name,
        text,
        embedding: embeddings[i]
      }));

      const totalSize = doc.chunks.reduce((acc, text) => acc + text.length, 0);
      const docEntity: RAGDocument = {
        id: docId,
        name: doc.name,
        size: totalSize,
        chunkCount: doc.chunks.length,
        uploadedAt: new Date().toISOString()
      };

      db.documents.push(docEntity);
      db.chunks.push(...chunkEntities);
    }

    savePreceptorDB(db);
    console.log("[Preceptor RAG] Semeadeira finalizada com sucesso! Documentos carregados:", db.documents.length);
  } catch (err) {
    console.error("[Preceptor RAG] Erro durante a semeadeira automática:", err);
  }
}

// 1. List reference documents in index
app.get("/api/preceptor/documents", async (req, res) => {
  try {
    const db = loadPreceptorDB();
    if (db.documents.length === 0 && process.env.GEMINI_API_KEY) {
      await seedDefaultProtocols();
      const loaded = loadPreceptorDB();
      return res.json({ documents: loaded.documents });
    }
    res.json({ documents: db.documents });
  } catch (error: any) {
    console.error("Erro ao listar documentos RAG:", error);
    res.status(500).json({ error: error.message || "Falha técnica ao carregar lista de documentos." });
  }
});

// 2. Index raw copy-pasted text
app.post("/api/preceptor/upload-text", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content || !content.trim()) {
      return res.status(400).json({ error: "O título e o conteúdo textual são obrigatórios." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "A chave API do Gemini não está definida no ambiente do AI Studio." });
    }

    const db = loadPreceptorDB();
    const docId = "text-" + Date.now();
    const chunks = chunkText(content);
    if (chunks.length === 0) {
      return res.status(400).json({ error: "O texto do documento é curto demais para ser indexado." });
    }
    if (chunks.length > 500) {
      return res.status(422).json({
        error: `O texto copiado "${title}" excede o limite máximo de fatias suportado (${chunks.length} fatias geradas, máximo de 500 fatias). Por favor, fragmente o conteúdo em partes menores para garantir uma indexação segura.`
      });
    }

    console.log(`[RAG Upload Text] Sincronizando "${title}": fatias=${chunks.length}`);
    const embeddings = await getEmbeddingsBatch(chunks);
    const chunkEntities: RAGChunk[] = chunks.map((text, i) => ({
      id: `${docId}-chunk-${i}`,
      docId,
      docName: title,
      text,
      embedding: embeddings[i]
    }));

    const docEntity: RAGDocument = {
      id: docId,
      name: title,
      size: content.length,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString()
    };

    db.documents.push(docEntity);
    db.chunks.push(...chunkEntities);
    savePreceptorDB(db);

    res.json({ success: true, document: docEntity });
  } catch (error: any) {
    console.error("Erro ao indexar texto:", error);
    res.status(500).json({ error: error.message || "Erro interno de indexação de texto." });
  }
});

// 3. Index and transcribe clinical file (PDF, TXT, etc.)
app.post("/api/preceptor/upload-file", async (req, res) => {
  try {
    const { name, mimeType, base64Data } = req.body;
    if (!name || !mimeType || !base64Data) {
      return res.status(400).json({ error: "As propriedades do arquivo (name, mimeType, base64Data) são obrigatórias." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "A chave API do Gemini não está definida no ambiente do AI Studio." });
    }

    let extractedText = "";

    if (mimeType.startsWith("text/") || mimeType === "application/json" || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
      extractedText = Buffer.from(base64Data, "base64").toString("utf-8");
    } else {
      let pdfParsedText = "";
      if (mimeType === "application/pdf") {
        try {
          console.log(`[RAG PDF Extractor] Tentando extração de texto via PDFParse para: ${name}`);
          const buffer = Buffer.from(base64Data, "base64");
          const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
          const textResult = await parser.getText();
          await parser.destroy();
          pdfParsedText = textResult.text || "";
          console.log(`[RAG PDF Extractor] Extração concluída. Texto extraído: ${pdfParsedText.length} caracteres.`);
        } catch (pdfErr: any) {
          console.warn("[RAG PDF Extractor] Falha na extração direta com PDFParse, recorrendo ao Gemini OCR:", pdfErr);
        }
      }

      if (pdfParsedText.trim().length > 100) {
        extractedText = pdfParsedText;
      } else {
        // PDF (scanned/empty directly) or Image - Use Gemini to extract literal text contents
        if (!ai) {
          ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });
        }

        console.log(`[RAG Gemini OCR/PDF] Processando arquivo: ${name} (${mimeType})`);
        const parts = [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            }
          },
          {
            text: "Você é um extrator cirúrgico de documentos clínicos em PDF ou imagem. Transcreva na íntegra todo o conteúdo, diretrizes, esquemas e fluxogramas médicos contidos neste documento de forma literal, estruturada e sequencial, do início ao fim. Retorne apenas o texto transcrito, sem acrescentar comentários ou resumos."
          }
        ];

        const extractionResult = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: { parts }
        });

        extractedText = extractionResult.text || "";
      }
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ error: "O extrator inteligente não conseguiu ler nenhum texto deste arquivo." });
    }

    const db = loadPreceptorDB();
    const docId = "file-" + Date.now();
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return res.status(422).json({ error: "O texto extraído do arquivo é curto demais para o fatiamento RAG." });
    }
    if (chunks.length > 500) {
      return res.status(422).json({
        error: `O manual clínico "${name}" excede o limite máximo de fatias suportado (${chunks.length} fatias geradas, máximo de 500 fatias). Por favor, divida o arquivo em partes ou capítulos menores para garantir uma indexação segura.`
      });
    }

    console.log(`[RAG Upload File] Sincronizando "${name}": fatias=${chunks.length}`);
    const embeddings = await getEmbeddingsBatch(chunks);
    const chunkEntities: RAGChunk[] = chunks.map((text, i) => ({
      id: `${docId}-chunk-${i}`,
      docId,
      docName: name,
      text,
      embedding: embeddings[i]
    }));

    const docEntity: RAGDocument = {
      id: docId,
      name,
      size: extractedText.length,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString()
    };

    db.documents.push(docEntity);
    db.chunks.push(...chunkEntities);
    savePreceptorDB(db);

    res.json({ success: true, document: docEntity });
  } catch (error: any) {
    console.error("Erro ao indexar arquivo:", error);
    res.status(500).json({ error: error.message || "Erro interno de transcrição/indexação de arquivo." });
  }
});

// 3b. Import document directly from Google Drive
app.post("/api/preceptor/import-drive-file", async (req, res) => {
  try {
    const { fileId, name, mimeType, accessToken } = req.body;
    if (!fileId || !name || !mimeType || !accessToken) {
      return res.status(400).json({ error: "As propriedades do documento (fileId, name, mimeType, accessToken) são obrigatórias." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "A chave API do Gemini não está definida no ambiente do AI Studio." });
    }

    const headers = { Authorization: `Bearer ${accessToken}` };
    let base64Data = "";
    let resolvedMimeType = mimeType;

    console.log(`[RAG Drive Import] Iniciando download do Google Drive: "${name}" (ID: ${fileId}) [MimeType original: ${mimeType}]`);

    const encodedFileId = encodeURIComponent(fileId);

    if (mimeType === "application/vnd.google-apps.document") {
      // Export Google Doc as plain text, passing supportsAllDrives=true for shared folders/files
      const fetchUrl = `https://www.googleapis.com/drive/v3/files/${encodedFileId}/export?mimeType=text/plain&supportsAllDrives=true`;
      console.log(`[RAG Drive Import] Exportando Google Doc como texto plano: ${fetchUrl}`);
      const response = await fetch(fetchUrl, { headers });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[RAG Drive Import Error] Falha ao exportar documento. Status: ${response.status}. Corpo:`, errText);
        throw new Error(`Erro ao exportar documento do Google Drive (${response.status}): ${errText}`);
      }
      const textContent = await response.text();
      base64Data = Buffer.from(textContent, "utf-8").toString("base64");
      resolvedMimeType = "text/plain";
      console.log(`[RAG Drive Import] Exportação concluída com sucesso! Tamanho base64: ${base64Data.length}`);
    } else {
      // Download standard file contents (PDF, text, etc), incorporating supportsAllDrives=true and acknowledgeAbuse=true
      const fetchUrl = `https://www.googleapis.com/drive/v3/files/${encodedFileId}?alt=media&supportsAllDrives=true&acknowledgeAbuse=true`;
      console.log(`[RAG Drive Import] Baixando arquivo binário padrão: ${fetchUrl}`);
      const response = await fetch(fetchUrl, { headers });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[RAG Drive Import Error] Falha ao baixar arquivo binário. Status: ${response.status}. Corpo:`, errText);
        throw new Error(`Erro ao baixar arquivo do Google Drive (${response.status}): ${errText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString("base64");
      console.log(`[RAG Drive Import] Download concluído com sucesso! Tamanho base64: ${base64Data.length}`);
    }

    let extractedText = "";

    // For text-based formats (text/plain, md, csv, json) or GDoc text export
    if (
      resolvedMimeType.startsWith("text/") || 
      resolvedMimeType === "application/json" || 
      name.endsWith(".txt") || 
      name.endsWith(".md") || 
      name.endsWith(".csv")
    ) {
      extractedText = Buffer.from(base64Data, "base64").toString("utf-8");
    } else {
      let pdfParsedText = "";
      if (resolvedMimeType === "application/pdf") {
        try {
          console.log(`[RAG PDF Extractor] Tentando extração de texto via PDFParse para import do Drive: ${name}`);
          const buffer = Buffer.from(base64Data, "base64");
          const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
          const textResult = await parser.getText();
          await parser.destroy();
          pdfParsedText = textResult.text || "";
          console.log(`[RAG PDF Extractor] Extração concluída para Drive import. Texto extraído: ${pdfParsedText.length} caracteres.`);
        } catch (pdfErr: any) {
          console.warn("[RAG PDF Extractor] Falha na extração direta com PDFParse para import do Drive, recorrendo ao Gemini OCR:", pdfErr);
        }
      }

      if (pdfParsedText.trim().length > 100) {
        extractedText = pdfParsedText;
      } else {
        // PDF (scanned/empty directly) or Image - Use Gemini to extract text via OCR
        if (!ai) {
          ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { "User-Agent": "aistudio-build" } },
          });
        }

        console.log(`[RAG Gemini OCR/PDF] Processando import do Drive: ${name} (${resolvedMimeType})`);
        const parts = [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: base64Data,
            }
          },
          {
            text: "Você é um extrator cirúrgico de documentos clínicos em PDF ou imagem. Transcreva na íntegra todo o conteúdo, diretrizes, esquemas e fluxogramas médicos contidos neste documento de forma literal, estruturada e sequencial, do início ao fim. Retorne apenas o texto transcrito, sem acrescentar comentários ou resumos."
          }
        ];

        const extractionResult = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: { parts }
        });

        extractedText = extractionResult.text || "";
      }
    }

    if (!extractedText.trim()) {
      return res.status(422).json({ error: "O extrator inteligente não conseguiu converter ou ler nenhum texto deste documento." });
    }

    const db = loadPreceptorDB();
    const docId = "drive-" + Date.now();
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      return res.status(422).json({ error: "O texto extraído do documento é curto demais para realizar o fatiamento RAG." });
    }
    if (chunks.length > 500) {
      return res.status(422).json({
        error: `O documento do Google Drive "${name}" excede o limite máximo de fatias suportado (${chunks.length} fatias geradas, máximo de 500 fatias). Por favor, fragmente o arquivo original no seu Drive em partes menores para garantir uma sincronização segura.`
      });
    }

    console.log(`[RAG Drive Import] Sincronizando "${name}": fatias=${chunks.length}`);
    const embeddings = await getEmbeddingsBatch(chunks);
    const chunkEntities: RAGChunk[] = chunks.map((text, i) => ({
      id: `${docId}-chunk-${i}`,
      docId,
      docName: name,
      text,
      embedding: embeddings[i]
    }));

    const docEntity: RAGDocument = {
      id: docId,
      name,
      size: extractedText.length,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString()
    };

    db.documents.push(docEntity);
    db.chunks.push(...chunkEntities);
    savePreceptorDB(db);

    res.json({ success: true, document: docEntity });
  } catch (error: any) {
    console.error("Erro ao importar do Google Drive:", error);
    res.status(500).json({ error: error.message || "Erro interno de importação do Google Drive." });
  }
});

// 4. Delete document & chunks
app.delete("/api/preceptor/document/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = loadPreceptorDB();

    db.documents = db.documents.filter((d) => d.id !== id);
    db.chunks = db.chunks.filter((c) => c.docId !== id);

    savePreceptorDB(db);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao apagar documento:", error);
    res.status(500).json({ error: error.message || "Erro técnico ao excluir o documento do RAG." });
  }
});

// 5. Query / RAG Semantic search & Citation synthesis
app.post("/api/preceptor/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "A pergunta é obrigatória." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Chave do Gemini ausente na configuração." });
    }

    const db = loadPreceptorDB();

    if (db.documents.length === 0) {
      await seedDefaultProtocols();
      Object.assign(db, loadPreceptorDB());
    }

    if (db.chunks.length === 0) {
      return res.json({
        answer: "Seu banco de dados do **Preceptor IA** está vazio. Faça upload de arquivos (PDF, TXT, imagens) ou cole o texto dos seus manuais médicos preferidos para que eu possa orientá-lo estritamente sobre suas referências!",
        matches: []
      });
    }

    // Embed query
    const queryVector = await getEmbedding(query);

    // Calc similarity
    const matches = db.chunks.map((chunk) => {
      const similarity = cosineSimilarity(queryVector, chunk.embedding);
      return {
        id: chunk.id,
        docName: chunk.docName,
        text: chunk.text,
        similarity
      };
    });

    // Sort descending
    matches.sort((a, b) => b.similarity - a.similarity);

    // Filter by acceptable threshold. Embedding models usually give 0.5 to 0.8. Pick 0.4 as soft guard
    const filteredMatches = matches.filter((m) => m.similarity > 0.4).slice(0, 4);

    if (filteredMatches.length === 0) {
      return res.json({
        answer: "Não encontrei nenhuma seção no banco de dados do **Preceptor IA** suficientemente correlacionada com a sua pergunta.\n\nPor favor, faça upload de manuais adicionais sobre este tema clínico na barra lateral do Preceptor.",
        matches: []
      });
    }

    // Build grounding
    let contextText = "=== PRONTUÁRIOS, LIVROS E MANUAIS SELECIONADOS PELO MÉDICO (RAG) ===\n";
    filteredMatches.forEach((match, index) => {
      contextText += `[MANUAL CITAÇÃO #${index + 1}] Origem: ${match.docName} (Relevância Semântica: ${(match.similarity * 100).toFixed(1)}%)\n${match.text}\n---------------------\n`;
    });

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    }

    const systemInstruction = `Você é o "Preceptor IA", um assistente de ensino médico de altíssima complexidade operando em serviços intensivos.
DIRETRIZ DE INTEGRALIDADE E EXCLUSIVIDADE:
1. Responda à dúvida do médico baseando-se RIGOROSAMENTE E EXCLUSIVAMENTE nas fontes clínicas reais fornecidas abaixo (RAG).
2. Se a resposta não puder ser substanciada pelas fontes, responda que a informação não consta nas diretrizes indexadas e proponha que o médico adicione manuais compatíveis.
3. Use citações explícitas elegantes (ex: "Conforme o protocolo de Sepse e Choque Séptico...", "De acordo com o documento de SARA...").
4. Formate a resposta de maneira impecável para telas ou celulares de UTI: use tópicos de leitura rápida, tabelas curtas (se agregarem valor), negrito bem focado em dosagens ou parâmetros pressóricos/respiratórios.
5. Seja claro, pragmático, evite textos longos enrolados. Mostre as condutas com foco em segurança absoluta.`;

    const promptText = `
Responda de forma completa e pragmática à consulta do médico com base EXCLUSIVA no contexto do RAG fornecido abaixo.

PERGUNTA DE INFUSÃO/CONDUTA: "${query}"

FONTES EXTRAÍDAS E ANCORADAS:
${contextText}

Preceptor IA, formule o seu parecer:`;

    const result = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.15
      }
    });

    const answer = result.text || "Ops! O assistente inteligente não gerou resposta.";

    res.json({
      answer,
      matches: filteredMatches.map((m) => ({
        docName: m.docName,
        text: m.text,
        relevance: m.similarity
      }))
    });

  } catch (error: any) {
    console.error("Erro ao rodar RAG no preceptor IA:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar resposta semântica." });
  }
});

// Setup Vite Dev Server / Static deployment fallback
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Medic Round Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

boot();
