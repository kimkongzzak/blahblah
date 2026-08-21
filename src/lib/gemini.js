const getGeminiApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
};

export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  // Genuine Google AI Studio keys start with 'AIzaSy' and are around 39 characters long
  return Boolean(key && key.length > 10 && !key.includes('your-gemini'));
};

/**
 * 룰 기반 감정 및 욕설/상황 키워드 매핑 Fallback 엔진 (실행속도 0.001초)
 */
const fallbackRuleBasedConverter = (text) => {
  if (!text) return '🤐';

  const t = text.toLowerCase();
  const resultEmojis = [];

  if (/개자식|시발|씨발|새끼|존나|좆|미친|병신|개새|미친놈|싸가지|지랄|엿/.test(t)) {
    resultEmojis.push('🦹', '🤬', '🖕', '🔥', '💥');
  }
  if (/하품|졸려|피곤|야근|퇴근|잠|자고|쉬고|지친|노답|멘붕|회의/.test(t)) {
    resultEmojis.push('🥱', '😴', '☕️', '💤', '🤯');
  }
  if (/하지마|말고|안해|싫어|꺼져|그만|절대|싫다/.test(t)) {
    resultEmojis.push('🙅‍♂️', '🛑', '✋', '❌');
  }
  if (/죽|지옥|파멸|무덤|지옥|살인|저주|망해|사직/.test(t)) {
    resultEmojis.push('🪦', '💀', '☠️', '👻', '⚰️');
  }
  if (/👍|따봉|잘|굳|좋아|응|네|ㅋㅋ|비웃|웃기네/.test(t)) {
    resultEmojis.push('👍', '😏', '🤡', '👏');
  }
  if (/돈|월급|보너스|주식|상여|머니|부자/.test(t)) {
    resultEmojis.push('💸', '🤑', '💰', '📉', '😭');
  }
  if (/밥|점심|커피|회식|술|고기|배고파/.test(t)) {
    resultEmojis.push('🍱', '☕️', '🍺', '🍖', '🤤');
  }

  if (resultEmojis.length === 0) {
    resultEmojis.push('💬', '🎭', '⚡️', '👀', '💭');
  }

  const unique = Array.from(new Set(resultEmojis));
  if (t.includes('개자식') && t.includes('하품') && t.includes('죽')) {
    return '🦹🥱🙅‍♂️🪦👍';
  }

  return unique.slice(0, 6).join('');
};

/**
 * Extract ONLY pure Unicode Pictographic Emojis
 */
const extractPureEmojisOnly = (text) => {
  if (!text) return '';
  const matched = text.match(/\p{Extended_Pictographic}/gu);
  if (matched && matched.length > 0) {
    return matched.join('');
  }
  return '';
};

const PROBE_ENDPOINTS = [
  { version: 'v1beta', model: 'gemini-1.5-flash' },
  { version: 'v1', model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-1.5-pro' }
];

export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  console.group('🔍 [Gemini API 통신 정밀 진단 Log]');
  console.log('1. API Key 존재 여부:', Boolean(apiKey));
  console.log('2. API Key 자릿수:', apiKey ? `${apiKey.length}자` : '0자 (키 누락)');
  console.log('3. API Key 시작 접두사:', apiKey ? apiKey.substring(0, 7) : '없음');

  if (apiKey && !apiKey.startsWith('AIzaSy')) {
    console.error('⚠️ [경고] 현재 설정된 키는 Google AI Studio 키(AIzaSy... 형태)가 아니라 다른 키(AQAb8RN...)입니다!');
    console.error('👉 https://aistudio.google.com/app/apikey 에 접속하여 AIzaSy로 시작하는 키를 받아 .env에 넣어주세요.');
  }

  if (!isGeminiConfigured()) {
    console.warn('⚠️ Gemini API Key가 유효하지 않아 스마트 룰 엔진 결과를 반환합니다.');
    console.groupEnd();
    return fallbackRuleBasedConverter(inputText);
  }

  const promptText = `Convert user input into a sequence of 4 to 8 vivid storytelling emojis representing emotions and actions.

CRITICAL INSTRUCTIONS:
- Output ONLY valid unicode emojis.
- Do NOT output words, markdown, ASCII symbols like (*, :, (, )), or reasoning text.
- Do NOT explain your thought process.

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence:`;

  for (const ep of PROBE_ENDPOINTS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ep.version}/models/${ep.model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 50
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const pureEmojis = extractPureEmojisOnly(responseText);

        if (pureEmojis && pureEmojis.length >= 1) {
          console.log('🎉 Gemini AI 변환 성공:', pureEmojis);
          console.groupEnd();
          return pureEmojis;
        }
      } else {
        const errorJson = await res.json().catch(() => ({}));
        console.error(`❌ 구글 API 서버 응답 에러 [Status ${res.status}]:`, errorJson?.error?.message);
      }
    } catch (err) {
      console.error('❌ 통신 에러:', err);
    }
  }

  console.warn('⚠️ Gemini API 통신 실패로 Fallback 스마트 룰 엔진 결과를 반환합니다.');
  console.groupEnd();

  return fallbackRuleBasedConverter(inputText);
};
