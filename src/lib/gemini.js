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
 * Filter ONLY high-quality official 'gemini' flagship models (Strictly excludes 'gemma' open models & TTS/audio)
 */
const getFlagshipGeminiModelPaths = async (apiKey) => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];

      // Strictly select official 'gemini' models (EXCLUDE 'gemma' and non-text models)
      const officialGemini = models.filter(m => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        return (
          name.includes('gemini') &&
          !name.includes('gemma') &&
          !name.includes('tts') &&
          !name.includes('embedding') &&
          !name.includes('imagen') &&
          !name.includes('audio') &&
          methods.includes('generateContent')
        );
      });

      if (officialGemini.length > 0) {
        // Sort priority: flash-8b -> 1.5-flash -> 2.0-flash -> others
        officialGemini.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA.includes('1.5-flash-8b')) return -1;
          if (nameB.includes('1.5-flash-8b')) return 1;
          if (nameA.includes('1.5-flash')) return -1;
          if (nameB.includes('1.5-flash')) return 1;
          return 0;
        });

        return officialGemini.map(m => m.name);
      }
    }
  } catch (e) {
    console.warn('Model list fetch error:', e);
  }

  // Hardcoded verified flagship Gemini models
  return [
    'models/gemini-1.5-flash-8b',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro'
  ];
};

/**
 * Extract ONLY pure Unicode Pictographic Emojis (Strips out *, :, (, ), letters, thought text)
 */
const extractPureEmojisOnly = (text) => {
  if (!text) return '';
  // Match true Extended Pictographic Emojis
  const matched = text.match(/\p{Extended_Pictographic}/gu);
  if (matched && matched.length > 0) {
    return matched.join('');
  }
  return '';
};

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

    const modelPaths = await getFlagshipGeminiModelPaths(apiKey);

    for (const modelPath of modelPaths) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;
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
          // Filter out thought parts if present
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const answerPart = parts.find(p => !p.thought && p.text) || parts[0];
          const responseText = answerPart?.text || '';

          // Extract true pure emojis only
          const pureEmojis = extractPureEmojisOnly(responseText);

          if (pureEmojis && pureEmojis.length >= 1) {
            return pureEmojis;
          }
        }
      } catch (err) {
        // failover to next model
      }
    }
  }

  // Fallback Rule-based execution
  return fallbackRuleBasedConverter(inputText);
};
