import { GoogleGenAI } from '@google/genai';
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
const emergencyFallbackConverter = (text, reason = '알 수 없는 원인') => {
  console.warn(`⚠️ [네트워크 장애 / API 오류 발생]`);
  console.warn(`└─ 실패 원인: ${reason}`);
  console.warn(`└─ 📢 [대체 룰 이모지 모드] AI API 대신 내장 룰 이모지를 생성하여 반환합니다.`);

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

/**
 * 🚀 무슨 텍스트가 들어오든 100% 우선적으로 Gemini AI API를 직접 호출하여 4~8개 이모지로 변환
 */
export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐💬👀💭';
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn(`⚠️ [Gemini API Key 미설정] VITE_GEMINI_API_KEY 환경 변수가 없습니다.`);
    return emergencyFallbackConverter(inputText, 'Gemini API Key 미설정');
  }

  const promptText = `Convert the following user input into a rich storytelling sequence of EXACTLY 4 to 8 vivid emojis.

STRICT INSTRUCTIONS:
- You MUST output EXACTLY between 4 and 8 emojis.
- NEVER return a single emoji or less than 4 emojis. Single emoji output is STRICTLY FORBIDDEN.
- Output ONLY valid unicode emojis. No words, no markdown, no quotes, no ASCII symbols like (*, :, (, )).
- Express the subject, action, emotion, and story in a 4 to 8 emoji sequence.

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence (4-8 emojis):`;

  let lastErrorMessage = '';
  const encodedInput = encodeSafeBase64(inputText);

  // [1순위] Google 공식 @google/genai SDK로 gemini-3.5-flash AI 직접 호출 (maxOutputTokens: 100으로 넉넉하게 확장)
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100, // MAX_TOKENS 절단 방지를 위해 100으로 확장
      }
    });

    const responseText = response?.text ? response.text.trim() : '';
    let pureEmojis = extractPureEmojisOnly(responseText);

    if (pureEmojis && pureEmojis.length >= 1) {
      if (Array.from(pureEmojis).length < 4) {
        pureEmojis += '💬👀💭⚡️'.substring(0, (4 - Array.from(pureEmojis).length) * 2);
      }

      console.log(`✅ [Gemini AI 변환 성공] 모델: gemini-3.5-flash (SDK)`);
      console.log(`└─ 입력: "${inputText}" ➡️ 이모지 (4~8개): ${pureEmojis}`);

      logAiExecution({
        inputText: encodedInput,
        isSuccess: true,
        usedModel: 'gemini-3.5-flash-sdk',
        outputEmoji: pureEmojis,
        errorMessage: null
      });

      return pureEmojis;
    } else {
      console.warn(`⚠️ [Gemini AI 응답 정제 실패] 응답 텍스트에 이모지가 없어 재시도합니다. 원문: "${responseText}"`);
    }
  } catch (sdkErr) {
    lastErrorMessage = sdkErr?.message || String(sdkErr);
    console.error(`❌ [Google GenAI SDK 호출 실패]:`, sdkErr);

    // REST 직통 2차 시도
    try {
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let pureEmojis = extractPureEmojisOnly(responseText);

        if (pureEmojis && pureEmojis.length >= 1) {
          if (Array.from(pureEmojis).length < 4) {
            pureEmojis += '💬👀💭⚡️'.substring(0, (4 - Array.from(pureEmojis).length) * 2);
          }

          console.log(`✅ [Gemini AI 변환 성공] 모델: gemini-3.5-flash (REST)`);
          console.log(`└─ 입력: "${inputText}" ➡️ 이모지 (4~8개): ${pureEmojis}`);

          logAiExecution({
            inputText: encodedInput,
            isSuccess: true,
            usedModel: 'gemini-3.5-flash-rest',
            outputEmoji: pureEmojis,
            errorMessage: null
          });

          return pureEmojis;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastErrorMessage = errData?.error?.message || `Status ${res.status}`;
        console.error(`❌ [Gemini REST API 실패 - Status ${res.status}]:`, errData);
      }
    } catch (restErr) {
      lastErrorMessage = restErr?.message || String(restErr);
      console.error(`❌ [Gemini REST 통신 실패]:`, restErr);
    }
  }

  return emergencyFallbackConverter(inputText, lastErrorMessage);
};
