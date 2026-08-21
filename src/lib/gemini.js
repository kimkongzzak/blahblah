import { GoogleGenerativeAI } from '@google/generative-ai';
import { logAiExecution } from './supabase';

/**
 * 🔑 Gemini API Key 획득
 */
const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
  return (envKey || localKey).trim();
};

/**
 * UTF-8 Safe Base64 Helper
 */
export const encodeSafeBase64 = (str) => {
  try {
    return btoa(encodeURIComponent(str || ''));
  } catch (e) {
    return '';
  }
};

export const decodeSafeBase64 = (base64Str) => {
  try {
    return decodeURIComponent(atob(base64Str || ''));
  } catch (e) {
    return base64Str || '';
  }
};

/**
 * 🧹 순수 유니코드 그림 이모지 정제함수
 */
const extractPureEmojisOnly = (text) => {
  if (!text) return '';
  const matched = text.match(/\p{Extended_Pictographic}/gu);
  return matched && matched.length > 0 ? matched.join('') : '';
};

/**
 * 🎨 최후의 네트워크 장애 대비 룰 엔진 (최소 4개 이모지 반환 보장)
 */
const emergencyFallbackConverter = (text, reason = '네트워크 통신 지연') => {
  if (reason.includes('429') || reason.includes('Quota exceeded') || reason.includes('rate-limits')) {
    console.warn(`⏳ [Google API 쿼터 초과] 약 30초 후 또는 새 API Key 등록 시 자동 복구됩니다.`);
  } else {
    console.log(`📢 [대체 이모지 모드] AI 응답 대기/지연으로 룰 이모지를 생성했습니다. (사유: ${reason})`);
  }

  if (!text) return '🤐💬👀💭';
  const emojis = ['🎭', '💬', '⚡️', '👀', '💭', '🔮', '✨', '🔥', '🏃‍♂️', '🤬', '🛑', '💥'];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  const start = Math.abs(hash) % emojis.length;
  const result = [
    emojis[start],
    emojis[(start + 1) % emojis.length],
    emojis[(start + 2) % emojis.length],
    emojis[(start + 3) % emojis.length],
    emojis[(start + 4) % emojis.length]
  ].join('');

  logAiExecution({
    inputText: encodeSafeBase64(text),
    isSuccess: false,
    usedModel: 'emergency-fallback-engine',
    outputEmoji: result,
    errorMessage: reason
  });

  return result;
};

const STABLE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-1.5-flash'
];

/**
 * 🚀 구글 AI Studio 신규 및 구형 API 키 100% 호환 모델 탐색
 */
export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐💬👀💭';
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return emergencyFallbackConverter(inputText, 'Gemini API Key 미설정');
  }

  const promptText = `You are a creative translator. Convert user input into a vivid storytelling sequence of 4 to 8 emojis.

EXAMPLES:
Input: "퇴근하고 구글 보고서 작성해야 함" -> 💼😴☕️🏃‍♂️💥
Input: "니가 알아서 퇴사해 꾸역꾸역 다니지 말고" -> 🤬🚪🏃‍♂️💨🙅‍♂️
Input: "점심에 맛있는 회식 고기 먹으러 가자" -> 🍱🍖🍺🤤🥳
Input: "야근 지옥에서 언제 탈출하냐" -> 🪦💀☕️💥🏃‍♂️

STRICT RULES:
- Output ONLY valid unicode emojis (between 4 and 8 emojis).
- NEVER append fixed repetitive emojis like (💬, 👀, 💭).
- Express the action, emotion, and story naturally using unique, diverse emojis.

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence:`;

  let lastErrorMessage = '';
  const encodedInput = encodeSafeBase64(inputText);
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of STABLE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const responseText = response.text() ? response.text().trim() : '';
      const pureEmojis = extractPureEmojisOnly(responseText);

      if (pureEmojis && pureEmojis.length >= 1) {
        console.log(`✅ [Gemini AI 변환 성공] 모델: ${modelName} ➡️ 이모지: ${pureEmojis}`);

        logAiExecution({
          inputText: encodedInput,
          isSuccess: true,
          usedModel: `${modelName}-sdk`,
          outputEmoji: pureEmojis,
          errorMessage: null
        });

        return pureEmojis;
      }
    } catch (sdkErr) {
      lastErrorMessage = sdkErr?.message || String(sdkErr);

      // REST 2차 시도
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const pureEmojis = extractPureEmojisOnly(responseText);

          if (pureEmojis && pureEmojis.length >= 1) {
            console.log(`✅ [Gemini AI 변환 성공] 모델: ${modelName} (REST) ➡️ 이모지: ${pureEmojis}`);

            logAiExecution({
              inputText: encodedInput,
              isSuccess: true,
              usedModel: `${modelName}-rest`,
              outputEmoji: pureEmojis,
              errorMessage: null
            });

            return pureEmojis;
          }
        }
      } catch (restErr) {}
    }
  }

  return emergencyFallbackConverter(inputText, lastErrorMessage);
};
