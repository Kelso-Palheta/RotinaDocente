import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { MASTER_ENEM_PROMPT } from "./constants";
import { callAI, executeGeminiNativeCall } from "../ai-provider-central";
import { AIProviders } from "@/dominio/ai/AIProviders";

// RN-49: limite de tokens por profundidade para o feedback não ser truncado.
// O prompt de deep pede no mínimo 1200 palavras — 4000 tokens estouravam.
const DEPTH_MAX_TOKENS = { basic: 3000, analyzed: 6000, deep: 9000 };

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
      maxTokens: DEPTH_MAX_TOKENS[depth] || 6000,
      userConfig,
    });
  } catch (error) {
    console.error(`[AI Provider ERROR - ${provider}]:`, error);
    throw error;
  }
}

async function transcribeWithGemini(imageBase64, mediaType, key, model) {
  const prompt = "Transcreva fielmente todo o texto desta redação manuscrita. IMPORTANTE: Não corrija nenhum erro de português, grafia, concordância ou pontuação. Transcreva exatamente como o aluno escreveu. Ignore a numeração das linhas na margem esquerda. Retorne APENAS a transcrição textual.";
  const clean = imageBase64.replace(/\s/g, "");

  // Caminho OpenAI-compat via fetch (sem SDK — testável com globalThis.fetch mock)
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${clean}` } }
          ]
        }]
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    }
    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `status ${res.status}`;
    if (!res.ok) console.warn("[Gemini OCR] Caminho OpenAI-compat falhou:", errMsg);
  } catch (e) {
    console.warn("[Gemini OCR] Caminho OpenAI-compat falhou, tentando API nativa com fallback de modelos:", e?.message || e);
  }

  // API nativa com cascata resiliente (404 modelo aposentado / 503 / 429 → modelos disponíveis da chave)
  const attempt = await executeGeminiNativeCall({
    apiKey: key,
    initialModel: model,
    geminiContents: [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: mediaType, data: clean } },
      ],
    }],
    temperature: 0.2,
    maxOutputTokens: 4096,
  });

  if (attempt.res.ok) {
    const parts = attempt.data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    if (text) return text;
  }

  const errMsg = attempt.data?.error?.message || JSON.stringify(attempt.data || {});
  throw new Error(`Gemini falhou na transcrição da imagem (${attempt.res.status}): ${errMsg}`);
}


/**
 * Transcreve uma imagem de redação manuscrita usando o provedor/modelo configurados pelo professor.
 * RN-47: o erro real do provedor é sempre propagado — a mensagem AI_KEY_REQUIRED
 * só aparece quando de fato não há chave configurada.
 */
export async function extractTextOnly(imageBase64, mediaType = "image/jpeg", userConfig = null) {
  console.log("[AI Provider] Extraindo texto da imagem...");

  const prov = userConfig?.provider;
  const key = userConfig?.apiKey;

  if (userConfig && !key) {
    throw new Error("AI_KEY_REQUIRED: Você precisa conectar sua chave de IA para utilizar a extração de texto.");
  }

  if (!key) {
    throw new Error("AI_KEY_REQUIRED: Conecte sua chave de IA para utilizar o recurso de OCR/extração de imagem.");
  }

  const model = userConfig?.model || AIProviders[prov]?.defaultModel || null;

  if (prov === "gemini") {
    return transcribeWithGemini(imageBase64, mediaType, key, model);
  }

  if (prov === "openai") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Transcreva fielmente todo o texto desta redação manuscrita. IMPORTANTE: Não corrija nenhum erro de português, grafia, concordância ou pontuação. Transcreva exatamente como o aluno escreveu, preservando erros para permitir a avaliação posterior. IMPORTANTE: Ignore a numeração das linhas (1, 2, 3... 30) na margem esquerda da folha de redação; transcreva apenas o texto escrito pelo aluno. Retorne APENAS a transcrição textual, sem comentários periféricos." },
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64.replace(/\s/g, '')}` } }
            ]
          }]
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Erro ${res.status}`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (e) {
      console.warn("OpenAI falhou na extração:", e?.message || e);
      throw new Error(`OpenAI falhou na transcrição da imagem: ${e?.message || e}`);
    }
  }

  if (prov === "anthropic") {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 3000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64.replace(/\s/g, '') } },
              { type: "text", text: "Você é um especialista em transcrição de redações manuscritas. Transcreva fielmente todo o texto desta imagem, exatamente como o aluno escreveu. ATENÇÃO: NÃO corrija nenhum erro ortográfico, gramatical, de concordância ou de pontuação. Ignore a numeração das linhas na margem esquerda. Retorne APENAS o texto transcrito." }
            ]
          }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Erro ${res.status}`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const block = data.content?.find(b => b.type === "text");
      if (block) return block.text;
      throw new Error("Resposta vazia do modelo.");
    } catch (e) {
      console.warn("Anthropic falhou na extração:", e?.message || e);
      throw new Error(`Anthropic falhou na transcrição da imagem: ${e?.message || e}`);
    }
  }

  if (prov === "maritaca") {
    try {
      const maritaca = new OpenAI({
        apiKey: key,
        baseURL: "https://chat.maritaca.ai/api"
      });
      const response = await maritaca.chat.completions.create({
        model: model || "sabiazinho-4",
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
      throw new Error(`Maritaca falhou na transcrição da imagem: ${e?.message || 'Erro desconhecido'}`);
    }
  }

  throw new Error(
    `O provedor "${prov || 'desconhecido'}" não suporta a transcrição de imagens. Conecte uma chave Gemini, OpenAI, Anthropic ou Maritaca nas configurações de IA.`
  );
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
