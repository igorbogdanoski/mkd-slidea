export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { prompt, type, strategy = 'default' } = await req.json();
  const apiKey = process.env.VITE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI API key not configured' }), { status: 500 });
  }

  // Quota Saving Logic: Use FLASH for simple tasks, PRO for complex (Quiz or Advanced Strategies)
  const isAdvanced = strategy === 'cot' || strategy === 'tot';
  const modelToUse = (type === 'wordcloud' || type === 'poll' || type === 'open') && !isAdvanced 
    ? 'gemini-1.5-flash' 
    : 'gemini-1.5-pro';

  let strategyInstructions = "";
  if (strategy === 'cot') {
    strategyInstructions = "Користи Chain-of-Thought (CoT): Прво анализирај ја темата подлабоко, идентификувај ги клучните образовни цели и размисли кој е најдобриот концепт за прашање пред да го генерираш JSON-от.";
  } else if (strategy === 'tot') {
    strategyInstructions = "Користи Tree-of-Thoughts (ToT): Генерирај 3 различни идеи за ова прашање во себе, оцени ги според нивото на Bloom-овата таксономија и избери ја онаа што најмногу поттикнува критичко размислување кај учениците.";
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstructions }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            max_output_tokens: 300, // Quota saving: Limit output size
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

    // Double check if it's valid JSON
    const parsed = JSON.parse(resultText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return new Response(JSON.stringify({ error: 'Грешка при генерирање на содржината со AI.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
