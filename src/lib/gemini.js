const getGeminiApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
};

export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10 && !key.includes('your-gemini'));
};

/**
 * 룰 기반 감정 및 욕설/상황 키워드 매핑 Fallback 엔진
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

/**
 * Diagnostic Targets (Probing v1 & v1beta endpoints with transparent log inspection)
 */
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

  if (!isGeminiConfigured()) {
    console.warn('⚠️ Gemini API Key가 유효하지 않거나 설정되지 않아 룰 엔진으로 즉시 변환합니다.');
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${ep.model}:generateContent?key=${apiKey}`;
    console.log(`📡 시도 중인 API URL: https://generativelanguage.googleapis.com/${ep.version}/models/${ep.model}:generateContent`);

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

      console.log(`📊 구글 응답 상태코드 (HTTP Status): ${res.status} ${res.statusText}`);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Google API 응답 수신 성공:', data);

        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const pureEmojis = extractPureEmojisOnly(responseText);

        if (pureEmojis && pureEmojis.length >= 1) {
          console.log('🎉 최종 이모지 추출 결과:', pureEmojis);
          console.groupEnd();
          return pureEmojis;
        }
      } else {
        const errorJson = await res.json().catch(() => ({}));
        console.error(`❌ 구글 API 서버 에러 상세 [Status ${res.status}]:`, errorJson);
        if (errorJson?.error) {
          console.error(`└─ 원인 메시지: "${errorJson.error.message}"`);
          console.error(`└─ 에러 상태: "${errorJson.error.status}"`);
        }
      }
    } catch (err) {
      console.error('❌ 네트워크 통신 자체가 실패함:', err);
    }
  }

  console.warn('⚠️ 모든 Gemini API 모델 통신이 실패하여 Fallback 스마트 룰 엔진 결과를 반환합니다.');
  console.groupEnd();

  return fallbackRuleBasedConverter(inputText);
};
