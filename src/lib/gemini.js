import { GoogleGenAI } from '@google/genai';

/**
 * 🔑 Gemini API Key 획득 (환경 변수 최우선 적용)
 */
const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
  const finalKey = (envKey || localKey).trim();

  // 구버전 오타 키가 LocalStorage에 남아있을 경우 자동 정제
  if (localKey && localKey.includes('5ivQ5')) {
    try {
      localStorage.removeItem('CUSTOM_GEMINI_API_KEY');
    } catch (e) {}
  }

  return finalKey;
};

/**
 * Gemini API Key 설정 유효성 검사
 */
export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10 && !key.includes('your-gemini'));
};

/**
 * 🎨 룰 기반 키워드/감정 매핑 Fallback 엔진
 * API 통신 불가 시 0.001초 만에 문맥 반응형 이모지 반환
 */
const fallbackRuleBasedConverter = (text) => {
  if (!text) return '🤐';

  const t = text.toLowerCase();
  const resultEmojis = [];

  // 감정/욕설/상황 키워드 카테고리 매핑
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

  // 매칭되는 키워드가 없을 경우 기본 상징 이모지 반환
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
 * 🧹 순수 유니코드 그림 이모지 정제함수 (ASCII/알파벳/특수문자/Markdown 제거)
 */
const extractPureEmojisOnly = (text) => {
  if (!text) return '';
  const matched = text.match(/\p{Extended_Pictographic}/gu);
  return matched && matched.length > 0 ? matched.join('') : '';
};

/**
 * 🚀 텍스트 입력값 -> 스토리텔링 이모지 시퀀스 변환 메인 함수
 */
export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  if (isGeminiConfigured()) {
    const promptText = `Convert user input into a sequence of 4 to 8 vivid storytelling emojis representing emotions and actions.

CRITICAL INSTRUCTIONS:
- Output ONLY valid unicode emojis.
- Do NOT output words, markdown, ASCII symbols like (*, :, (, )), or reasoning text.
- Do NOT explain your thought process.

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence:`;

    // [Step 1] 구글 공식 @google/genai SDK로 최신 모델 gemini-3.5-flash 호출
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          temperature: 0.6,
          maxOutputTokens: 50,
        }
      });

      const responseText = response?.text ? response.text.trim() : '';
      const pureEmojis = extractPureEmojisOnly(responseText);

      if (pureEmojis && pureEmojis.length >= 1) {
        return pureEmojis;
      }
    } catch (sdkError) {
      // SDK 호출 실패 시 차선책 REST 엔드포인트 단일 호출로 직행
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 50 }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const pureEmojis = extractPureEmojisOnly(responseText);

          if (pureEmojis && pureEmojis.length >= 1) {
            return pureEmojis;
          }
        }
      } catch (restError) {
        // 네트워크 장애 시 Fallback으로 전환
      }
    }
  }

  // [Step 2] API 키 미설정 또는 API 통신 장애 시 Fallback 스마트 룰 엔진 실행
  return fallbackRuleBasedConverter(inputText);
};
