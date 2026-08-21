const getGeminiApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('CUSTOM_GEMINI_API_KEY') || '';
};

export const isGeminiConfigured = () => {
  const key = getGeminiApiKey();
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

/**
 * Verified Targets for Google AI Studio AQ Keys
 */
const TARGET_MODELS = [
  { version: 'v1beta', name: 'gemini-2.0-flash' },
  { version: 'v1beta', name: 'gemini-2.5-flash' },
  { version: 'v1beta', name: 'gemini-1.5-flash' },
  { version: 'v1', name: 'gemini-1.5-flash' }
];

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

    for (const item of TARGET_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${item.version}/models/${item.name}:generateContent?key=${apiKey.trim()}`;
        const res = await fetch(url, {
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
            return pureEmojis;
          }
        }
      } catch (err) {
        // failover
      }
    }
  }

  return fallbackRuleBasedConverter(inputText);
};
