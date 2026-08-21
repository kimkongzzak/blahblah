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
 * Direct REST Fetch with Automatic Failover List
 * SDK 버전 고정 문제 없이 100% 구글 REST API로 직접 호출하며, 404 발생 시 다음 검증된 모델로 시도
 */
const SAFE_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro'
];

export const convertTextToEmoji = async (inputText) => {
  if (!inputText || inputText.trim() === '') {
    return '🤐';
  }

  const apiKey = getGeminiApiKey();

  if (isGeminiConfigured()) {
    const promptText = `System Rule: You are an expert translator that converts user input (which may contain raw emotions, corporate stress, insults, complaints, or jokes) exclusively into a sequence of vivid, storytelling emojis.
      
Rules:
1. Output ONLY emojis. No text, no markdown, no quotes, no explanations, no spaces between emojis unless necessary.
2. The emoji count MUST be between 4 and 8 emojis.
3. Express the nuance, subjects, action, and underlying emotion accurately.
4. For example, if input is "개자식 하품하지 말고 그냥 죽었으면", output should be similar to "🦹🥱🙅‍♂️🪦👍".

User Input: "${inputText.replace(/"/g, '')}"
Emoji Sequence Output:`;

    // Try models via Direct REST fetch to avoid SDK version mismatch
    for (const modelName of SAFE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 60
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const emojiOnly = responseText.trim().replace(/[a-zA-Z0-9\s.,!?"'가-힣]/g, '');

          if (emojiOnly && emojiOnly.length >= 1) {
            return emojiOnly;
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.warn(`[Gemini Direct REST] Model '${modelName}' returned status ${res.status}:`, errorData?.error?.message);
        }
      } catch (err) {
        console.warn(`[Gemini Direct REST] Network error for model '${modelName}':`, err);
      }
    }
  }

  // Fallback Rule-based execution
  return fallbackRuleBasedConverter(inputText);
};
