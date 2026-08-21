import { GoogleGenAI } from '@google/genai';

/**
 * 🔑 Gemini API Key 획득
 */
const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
  return (envKey || localKey).trim();
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
 * 🎨 최후의 네트워크 장애 대비 룰 엔진
 */
const emergencyFallbackConverter = (text, reason = '알 수 없는 원인') => {
  console.warn(`⚠️ [네트워크 장애 / API 오류 발생]`);
  console.warn(`└─ 실패 원인: ${reason}`);
  console.warn(`└─ 📢 [대체 룰 이모지 모드] AI API 대신 내장 룰 이모지를 생성하여 반환합니다.`);

  if (!text) return '🤐';
  const emojis = ['🎭', '💬', '⚡️', '👀', '💭', '🔮', '✨', '🔥'];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  const start = Math.abs(hash) % emojis.length;
  return [emojis[start], emojis[(start + 1) % emojis.length], emojis[(start + 2) % emojis.length], emojis[(start + 3) % emojis.length]].join('');
};

/**
 * 🚀 무슨 텍스트가 들어오든 100% 우선적으로 Gemini AI API를 직접 호출하여 이모지로 변환
 */
export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn(`⚠️ [Gemini API Key 미설정] VITE_GEMINI_API_KEY 환경 변수가 없습니다.`);
    return emergencyFallbackConverter(inputText, 'Gemini API Key 미설정');
  }

  const promptText = `Convert user input into a sequence of 4 to 8 vivid storytelling emojis representing emotions and actions.

CRITICAL INSTRUCTIONS:
- Output ONLY valid unicode emojis.
- Do NOT output words, markdown, ASCII symbols like (*, :, (, )), or reasoning text.
- Do NOT explain your thought process.

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence:`;

  let lastErrorMessage = '';

  // [1순위] Google 공식 @google/genai SDK로 gemini-3.5-flash AI 직접 호출
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });

    const responseText = response?.text ? response.text.trim() : '';
    const pureEmojis = extractPureEmojisOnly(responseText);

    if (pureEmojis && pureEmojis.length >= 1) {
      console.log(`✅ [Gemini AI 변환 성공] 모델: gemini-3.5-flash (SDK)`);
      console.log(`└─ 입력: "${inputText}" ➡️ 이모지: ${pureEmojis}`);
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
          generationConfig: { temperature: 0.8, maxOutputTokens: 50 }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const pureEmojis = extractPureEmojisOnly(responseText);

        if (pureEmojis && pureEmojis.length >= 1) {
          console.log(`✅ [Gemini AI 변환 성공] 모델: gemini-3.5-flash (REST)`);
          console.log(`└─ 입력: "${inputText}" ➡️ 이모지: ${pureEmojis}`);
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

  // 서버 통신 장애 시 최후의 비상 안전망 및 투명 로그 출력
  return emergencyFallbackConverter(inputText, lastErrorMessage);
};
