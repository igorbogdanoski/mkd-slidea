export const config = {
  runtime: 'edge',
};

// IP-based rate limiting (per Edge instance — good enough for basic abuse prevention)
const rateLimitMap = new Map();
const RATE_LIMIT = 10;       // max requests
const RATE_WINDOW_MS = 60 * 1000; // per 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Премногу барања. Обидете се повторно за 1 минута.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { prompt, type, strategy = 'default' } = body;

  const VALID_TYPES = ['poll', 'quiz', 'wordcloud', 'open', 'rating', 'ranking'];
  const VALID_STRATEGIES = ['default', 'cot', 'tot'];

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3 || prompt.length > 500) {
    return new Response(JSON.stringify({ error: 'Промптот мора да биде меѓу 3 и 500 знаци.' }), { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return new Response(JSON.stringify({ error: 'Невалиден тип на активност.' }), { status: 400 });
  }
  if (!VALID_STRATEGIES.includes(strategy)) {
    return new Response(JSON.stringify({ error: 'Невалидна стратегија.' }), { status: 400 });
  }

  // Use GEMINI_API_KEY (no VITE_ prefix — VITE_ env vars are client-only, not available in Edge Functions)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  // Quota Saving Logic: Use Flash for simple tasks, Flash for complex too (2.0 is fast+capable)
  // Upgrade to gemini-2.5-pro for CoT/ToT when quota allows
  const isAdvanced = strategy === 'cot' || strategy === 'tot';
  const modelToUse = isAdvanced
    ? 'gemini-2.5-pro-preview-03-25'
    : 'gemini-2.0-flash';

  let strategyInstructions = '';
  if (strategy === 'cot') {
    strategyInstructions = 'Користи Chain-of-Thought (CoT): Прво анализирај ја темата подлабоко, идентификувај ги клучните образовни цели и размисли кој е најдобриот концепт за прашање пред да го генерираш JSON-от.';
  } else if (strategy === 'tot') {
    strategyInstructions = 'Користи Tree-of-Thoughts (ToT): Генерирај 3 различни идеи за ова прашање во себе, оцени ги според нивото на Bloom-овата таксономија и избери ја онаа што најмногу поттикнува критичко размислување кај учениците.';
  }

  const systemInstructions = `Ти си светски експерт за Prompt Engineering и EdTech за MKD Slidea.
Креирај ${type === 'quiz' ? 'КВИЗ' : 'ИНТЕРАКТИВНА АКТИВНОСТ'} на тема: "${prompt}".
${strategyInstructions}

ПРАВИЛА:
1. Излезот МОРА да биде САМО валиден JSON објект (без markdown, без објаснувања).
2. Користи чист МАКЕДОНСКИ јазик (литературен).
3. Прашањата треба да бидат провокативни, интересни и едукативни.

JSON Шема за ${type}:
{
  "question": "Коректно формулирано прашање",
  "type": "${type}",
  "is_quiz": ${type === 'quiz'},
  "options": [
    {"text": "Одговор 1", "is_correct": true},
    {"text": "Одговор 2", "is_correct": false}
  ]
}

За квиз точно 3-4 опции. За wordcloud, open и rating опциите се [].
За rating прашањето треба да биде оцена од 1 до 5.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstructions }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            max_output_tokens: 300,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No content returned from AI');
    }

    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return new Response(
      JSON.stringify({ error: 'Грешка при генерирање на содржината со AI.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
