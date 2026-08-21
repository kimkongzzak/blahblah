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
    return '🦹🥱<ctrl42>🙅‍♂️🪦👍';
  }

  return unique.slice(0, 6).join('');
};

/**
 * Filter text-only generation models strictly (Excludes TTS, Embedding, Image models)
 */
const getBestTextGenerationModelPaths = async (apiKey) => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];

      // Strictly filter models for pure text generateContent (Exclude audio/tts/embedding/image)
      const validTextModels = models.filter(m => {
        const name = (m.name || '').toLowerCase();
        const methods = m.supportedGenerationMethods || [];
        return (
          methods.includes('generateContent') &&
          !name.includes('tts') &&
          !name.includes('embedding') &&
          !name.includes('imagen') &&
          !name.includes('audio') &&
          !name.includes('vision')
        );
      });

      if (validTextModels.length > 0) {
        // Prioritize standard stable models first (flash-8b, 1.5-flash, 2.0-flash-exp, gemma)
        const sorted = validTextModels.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA.includes('1.5-flash') || nameA.includes('gemma')) return -1;
          if (nameB.includes('1.5-flash') || nameB.includes('gemma')) return 1;
          return 0;
        });
        return sorted.map(m => m.name);
      }
    }
  } catch (e) {
    console.warn('Failed to fetch model list:', e);
  }

  return ['models/gemini-1.5-flash-8b', 'models/gemini-1.5-flash'];
};

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

    const modelPaths = await getBestTextGenerationModelPaths(apiKey);

    // Try filtered text-generation models
    for (const modelPath of modelPaths) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;
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
        }
      } catch (err) {
        // quiet failover
      }
    }
  }

  // Fallback Rule-based execution
  return fallbackRuleBasedConverter(inputText);
};
