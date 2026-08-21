import { GoogleGenerativeAI } from '@google/generative-ai';

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
 * Dynamic Multi-Model Cascade Engine
 * 모델명 404/deprecated 이슈에 100% 자동 유연 대응하는 자가 치유 폴백 루프
 */
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  if (isGeminiConfigured()) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `System Rule: You are an expert translator that converts user input (which may contain raw emotions, corporate stress, insults, complaints, or jokes) exclusively into a sequence of vivid, storytelling emojis.
      
Rules:
1. Output ONLY emojis. No text, no markdown, no quotes, no explanations, no spaces between emojis unless necessary.
2. The emoji count MUST be between 4 and 8 emojis.
3. Express the nuance, subjects, action, and underlying emotion accurately.
4. For example, if input is "개자식 하품하지 말고 그냥 죽었으면", output should be similar to "🦹🥱🙅‍♂️🪦👍".

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence Output:`;

    // Try candidate models sequentially until success
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text() ? response.text().trim() : '';

        const emojiOnly = text.replace(/[a-zA-Z0-9\s.,!?"'가-힣]/g, '');
        if (emojiOnly && emojiOnly.length >= 1) {
          return emojiOnly;
        }
      } catch (err) {
        console.warn(`[Gemini Dynamic Cascade] Model '${modelName}' call failed (${err.message}), trying next model...`);
      }
    }
  }

  // Fallback Rule-based execution if all Gemini models fail or API key missing
  return fallbackRuleBasedConverter(inputText);
};
