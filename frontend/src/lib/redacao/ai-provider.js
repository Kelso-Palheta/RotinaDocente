import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { MASTER_ENEM_PROMPT } from "./constants";
import { callAI } from "../ai-provider-central";

export async function generateCorrection(payload) {
  const userConfig = payload.userConfig;
  const provider = userConfig?.provider || "gemini";
  let {
    text,
    imageBase64,
    studentName = "Estudante",
    studentClass = "N/A",
    essayTheme = "Geral",
    depth = "analyzed",
    competencies = "Todas",
    motivatorText = "Não fornecido",
    mediaType = "image/jpeg"
  } = payload;

  console.log(`[AI Provider] Iniciando correção (${depth}) via ${provider} para ${studentName}`);

  // openrouter e maritaca não suportam vision diretamente neste fluxo — transcrever antes
  const needsTranscriptionFallback = provider !== "openai" && provider !== "anthropic";

  if (needsTranscriptionFallback && imageBase64 && !text) {
    console.log(`[Vision Fallback] Transcrevendo imagem antes de corrigir com ${provider}...`);
    text = await extractTextOnly(imageBase64, mediaType, userConfig);
    imageBase64 = undefined;
  }

  const finalPrompt = MASTER_ENEM_PROMPT
    .replace(/{theme}/g, essayTheme)
    .replace(/{studentName}/g, studentName)
    .replace(/{studentClass}/g, studentClass)
    .replace(/{depth}/g, depth)
    .replace(/{competencies}/g, competencies)
    .replace(/{motivatorText}/g, motivatorText);

  try {
    const essayContent = text
      ? `Redação para correção:\n\n${text}`
      : "Por favor, corrija a redação com os critérios do INEP.";

    return await callAI({
      systemPrompt: finalPrompt,
      messages: [{ role: "user", content: essayContent }],
      temperature: 0.3,
      maxTokens: 4000,
      userConfig,
    });
  } catch (error) {
    console.error(`[AI Provider ERROR - ${provider}]:`, error);
    throw error;
  }
}

export async function extractTextOnly(imageBase64, mediaType = "image/jpeg", userConfig = null) {
  console.log("[AI Provider] Extraindo texto da imagem...");

  const prov = userConfig?.provider;
  const key = userConfig?.apiKey;

  if (userConfig && !key) {
    throw new Error("AI_KEY_REQUIRED: Você precisa conectar sua chave de IA para utilizar a extração de texto.");
  }

  if (key) {
    if (prov === "gemini") {
      try {
        const openai = new OpenAI({
          apiKey: key,
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        });
        const response = await openai.chat.completions.create({
          model: "gemini-1.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Transcreva fielmente todo o texto desta redação manuscrita. IMPORTANTE: Não corrija nenhum erro de português, grafia, concordância ou pontuação. Transcreva exatamente como o aluno escreveu. Ignore a numeração das linhas na margem esquerda. Retorne APENAS a transcrição textual." },
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64.replace(/\s/g, '')}` } }
            ]
          }]
        });
        return response.choices[0].message.content || "";
      } catch (e) {
        console.warn("Gemini falhou na extração:", e);
      }
    } else if (prov === "openai") {
      try {
        const openai = new OpenAI({ apiKey: key });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Transcreva fielmente todo o texto desta redação manuscrita. IMPORTANTE: Não corrija nenhum erro de português, grafia, concordância ou pontuação. Transcreva exatamente como o aluno escreveu, preservando erros para permitir a avaliação posterior. IMPORTANTE: Ignore a numeração das linhas (1, 2, 3... 30) na margem esquerda da folha de redação; transcreva apenas o texto escrito pelo aluno. Retorne APENAS a transcrição textual, sem comentários periféricos." },
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64.replace(/\s/g, '')}` } }
            ]
          }]
        });
        return response.choices[0].message.content || "";
      } catch (e) {
        console.warn("OpenAI falhou na extração.", e);
      }
    } else if (prov === "anthropic") {
      try {
        const anthropic = new Anthropic({ apiKey: key });
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 3000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64.replace(/\s/g, '') } },
              { type: "text", text: "Você é um especialista em transcrição de redações manuscritas. Transcreva fielmente todo o texto desta imagem, exatamente como o aluno escreveu. ATENÇÃO: NÃO corrija nenhum erro ortográfico, gramatical, de concordância ou de pontuação. Ignore a numeração das linhas na margem esquerda. Retorne APENAS o texto transcrito." }
            ]
          }],
        });
        const block = response.content.find(b => b.type === "text");
        if (block && block.type === "text") return block.text;
      } catch (e) {
        console.warn("Anthropic falhou na extração, tentando fallback...", e);
      }
    } else if (prov === "maritaca") {
      try {
        const maritaca = new OpenAI({
          apiKey: key,
          baseURL: "https://chat.maritaca.ai/api"
        });
        const response = await maritaca.chat.completions.create({
          model: "sabiazinho-4",
          messages: [{
            role: "user",
            content: [
              { type: "file", file: { filename: "redacao.jpg", file_data: `data:${mediaType};base64,${imageBase64.replace(/\s/g, '')}` } },
              { type: "text", text: "Transcreva fielmente todo o texto desta redação manuscrita. IMPORTANTE: Não corrija erros de português, de concordância, ortografia ou pontuação. Transcreva exatamente o que está escrito na imagem. Ignore a numeração das linhas. Retorne apenas o texto." }
            ]
          }]
        });
        return response.choices[0].message.content || "";
      } catch (e) {
        console.error("[Maritaca OCR] Falhou:", e?.message || e);
        throw new Error(`Maritaca OCR falhou: ${e?.message || 'Erro desconhecido'}`);
      }
    }
  }

  throw new Error("AI_KEY_REQUIRED: Conecte sua chave de IA para utilizar o recurso de OCR/extração de imagem.");
}

async function handleMaritaca(maritaca, text, imageBase64, mediaType = "image/jpeg", prompt) {
  const model = process.env.MARITACA_MODEL || "sabiazinho-4";
  const content = [];

  if (imageBase64) {
    content.push({
      type: "file",
      file: { filename: "redacao.jpg", file_data: `data:${mediaType};base64,${imageBase64.replace(/\s/g, '')}` }
    });
  }

  content.push({
    type: "text",
    text: text ? `Redação para correção: \n\n${text}` : "Por favor, corrija a redação contida no arquivo/imagem enviado utilizando os critérios do INEP."
  });

  const response = await maritaca.chat.completions.create({
    model,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

async function handleOpenAI(openai, text, imageBase64, prompt) {
  const content = [];
  if (text) content.push({ type: "text", text: `Redação para correção: \n\n${text}` });
  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${imageBase64.replace(/\s/g, '')}` },
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

async function handleAnthropic(anthropic, text, imageBase64, mediaType = "image/jpeg", prompt) {
  const content = [];
  if (imageBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: imageBase64.replace(/\s/g, '') },
    });
  }
  if (text) {
    content.push({ type: "text", text: `Redação para correção: \n\n${text}` });
  }

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 4000,
    temperature: 0.3,
    system: prompt,
    messages: [{ role: "user", content }],
  });

  const block = response.content.find(b => b.type === "text");
  return block && block.type === "text" ? block.text : "Ocorreu um erro na geração da resposta.";
}
