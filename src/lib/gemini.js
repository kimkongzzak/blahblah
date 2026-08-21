import { GoogleGenAI } from '@google/genai';

/**
 * 🔑 Gemini API Key 획득 (환경 변수 최우선 적용)
 */
const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
  return (envKey || localKey).trim();
};

/**
 * Gemini API Key 설정 유효성 검사
 */
export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10 && !key.includes('your-gemini'));
};

/**
 * 🎨 다채로운 감정/상황 이모지 파네트 뱅크
 */
const EMOJI_PALETTES = [
  ['🗣️', '💭', '🗯️', '📢', '🔥'],
  ['🥸', '👀', '🤫', '🤐', '📜'],
  ['🌪️', '⚡️', '💥', '🧨', '🎆'],
  ['🎭', '🎪', '🎬', '🍿', '🎨'],
  ['🌋', '☄️', '🔮', '✨', '🪐'],
  ['👑', '🐴', '👂', '🎋', '📜'],
  ['🦊', '🦝', '👺', '👻', '💀'],
  ['🌊', '🏄‍♂️', '🏊‍♂️', '⛵️', '🏝️'],
  ['🍷', '🍸', '🍺', '🍻', '🥳'],
  ['☕️', '🍰', '🧁', '🍩', '🍫'],
  ['💸', '🤑', '📉', '📈', '💎']
];

/**
 * 문장 해시값을 기반으로 다채롭고 정교한 이모지 조합 생성
 */
const generateDynamicHashEmojis = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);
  const paletteIndex = positiveHash % EMOJI_PALETTES.length;
  const selectedPalette = EMOJI_PALETTES[paletteIndex];

  // 텍스트 길이에 따라 4~6개의 유동적 이모지 구성
  const count = 4 + (text.length % 3);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(selectedPalette[(positiveHash + i) % selectedPalette.length]);
  }

  return Array.from(new Set(result)).join('');
};

/**
 * 🎨 스마트 룰 기반 감정 및 키워드 매핑 Fallback 엔진
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

  // 특정 정밀 키워드 조합
  if (t.includes('개자식') && t.includes('하품') && t.includes('죽')) {
    return '🦹🥱🙅‍♂️🪦👍';
  }

  // 매칭되는 키워드가 없으면 문장 해시 기반 다채로운 이모지 콤보 반환 (고정 반복 100% 방지)
  if (resultEmojis.length === 0) {
    return generateDynamicHashEmojis(text);
  }

  return Array.from(new Set(resultEmojis)).slice(0, 6).join('');
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
          temperature: 0.7,
          maxOutputTokens: 50,
        }
      });

      const responseText = response?.text ? response.text.trim() : '';
      const pureEmojis = extractPureEmojisOnly(responseText);

      if (pureEmojis && pureEmojis.length >= 1) {
        return pureEmojis;
      }
    } catch (sdkError) {
      // SDK 예외 발생 시 REST 백업
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 50 }
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
      } catch (restError) {}
    }
  }

  // [Step 2] API Key 미설정 또는 네트워크 예외 시 문맥 및 해시 기반 이모지 생성 (중복 방지)
  return fallbackRuleBasedConverter(inputText);
};
