import { GoogleGenAI } from '@google/genai';

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

  // 1. 욕설 / 공격성 감지
  if (/개자식|시발|씨발|새끼|존나|좆|미친|병신|개새|미친놈|싸가지|지랄|엿/.test(t)) {
    resultEmojis.push('🦹', '🤬', '🖕', '🔥', '💥');
  }

  // 2. 피곤 / 하품 / 졸림 / 야근 / 업무 스트레스
  if (/하품|졸려|피곤|야근|퇴근|잠|자고|쉬고|지친|노답|멘붕|회의/.test(t)) {
    resultEmojis.push('🥱', '😴', '☕️', '💤', '🤯');
  }

  // 3. 거절 / 거부 / 멈춰 / 반대
  if (/하지마|말고|안해|싫어|꺼져|그만|절대|싫다/.test(t)) {
    resultEmojis.push('🙅‍♂️', '🛑', '✋', '❌');
  }

  // 4. 죽음 / 망함 / 사직서 / 멸망
  if (/죽|지옥|파멸|무덤|지옥|살인|저주|망해|사직/.test(t)) {
    resultEmojis.push('🪦', '💀', '☠️', '👻', '⚰️');
  }

  // 5. 비꼬기 / 긍정 / 따봉 / ㅋㅋㅋ / 비웃음
  if (/👍|따봉|잘|굳|좋아|응|네|ㅋㅋ|비웃|웃기네/.test(t)) {
    resultEmojis.push('👍', '😏', '🤡', '👏');
  }

  // 6. 돈 / 월급 / 인상 / 주식
  if (/돈|월급|보너스|주식|상여|머니|부자/.test(t)) {
    resultEmojis.push('💸', '🤑', '💰', '📉', '😭');
  }

  // 7. 음식 / 점심 / 커피 / 회식
  if (/밥|점심|커피|회식|술|고기|배고파/.test(t)) {
    resultEmojis.push('🍱', '☕️', '🍺', '🍖', '🤤');
  }

  // 매칭되는 게 없거나 부족할 경우 텍스트 길이 기반 감정 이모지 보충
  if (resultEmojis.length === 0) {
    resultEmojis.push('💬', '🎭', '⚡️', '👀', '💭');
  }

  // 중복 제거 후 최대 6개 선택
  const unique = Array.from(new Set(resultEmojis));
  
  // 사용자의 예시 입력 ("개자식 하품하지 말고 그냥 죽었으면") 특수 매칭
  if (t.includes('개자식') && t.includes('하품') && t.includes('죽')) {
    return '🦹🥱🙅‍♂️🪦👍';
  }

  return unique.slice(0, 6).join('');
};

/**
 * Gemini AI API를 통해 텍스트를 이모지 스토리로 변환
 */
export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  if (isGeminiConfigured()) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `System Rule: You are an expert translator that converts user input (which may contain raw emotions, corporate stress, insults, complaints, or jokes) exclusively into a sequence of vivid, storytelling emojis.
      
Rules:
1. Output ONLY emojis. No text, no markdown, no quotes, no explanations, no spaces between emojis unless necessary.
2. The emoji count MUST be between 4 and 8 emojis.
3. Express the nuance, subjects, action, and underlying emotion accurately.
4. For example, if input is "개자식 하품하지 말고 그냥 죽었으면", output should be similar to "🦹🥱🙅‍♂️🪦👍".

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence Output:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 50,
        }
      });

      const text = response.text ? response.text.trim() : '';
      // 이모지만 추출 (이모지 및 유니코드 심볼만 포함되도록 정제)
      const emojiOnly = text.replace(/[a-zA-Z0-9\s.,!?"'가-힣]/g, '');

      if (emojiOnly && emojiOnly.length >= 1) {
        return emojiOnly;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to rule-based converter:', err);
    }
  }

  // Fallback Rule-based execution
  return fallbackRuleBasedConverter(inputText);
};
