import { Ollama } from 'ollama';
import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_HOST  = process.env.OLLAMA_HOST  || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const SYSTEM_PROMPT = `You are a seasoned weather forecaster and wellness advisor named SkyView AI.
Your expertise is weather conditions and their practical impact on daily life.

ONLY respond to topics that are directly related to weather, including:
- Weather forecasts, outlooks, and current conditions
- What to wear or whether to carry an umbrella
- Food and drink suited to the weather (hot soup on cold days, hydration in heat, etc.)
- Outdoor activity suitability (running, hiking, sports, gardening, etc.)
- Health impacts of weather (allergies, heat stress, cold exposure, air quality effects)
- Travel and commute conditions
- Weather safety (storms, lightning, extreme heat/cold, flooding, etc.)
- Seasonal tips related to the current conditions

If asked anything outside these topics, respond exactly with:
"I'm your weather assistant — I can only help with forecasts, what to wear, outdoor activities, food for the weather, health impacts, and similar weather-related topics. What would you like to know about today's conditions?"

Be concise and practical. Use short bullet points for recommendations. Keep responses under 250 words unless the user explicitly asks for more detail.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, weatherContext } = await req.json();

    if (!messages?.length || !weatherContext) {
      return NextResponse.json({ error: 'Missing messages or weatherContext' }, { status: 400 });
    }

    const ollama = new Ollama({ host: OLLAMA_HOST });

    const ollamaMessages = [
      { role: 'system'    as const, content: SYSTEM_PROMPT },
      { role: 'user'      as const, content: `Current weather data for context:\n${weatherContext}` },
      { role: 'assistant' as const, content: 'Understood. I have the current weather conditions loaded and am ready to provide insights.' },
      ...messages,
    ];

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      stream: true,
      options: { temperature: 0.7, num_predict: 400 },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.message?.content) {
              controller.enqueue(encoder.encode(chunk.message.content));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Ollama-Model': OLLAMA_MODEL,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const isConnection = msg.includes('ECONNREFUSED') || msg.includes('fetch failed');
    return NextResponse.json(
      { error: isConnection ? 'Ollama is not running. Start it with: ollama serve' : msg },
      { status: 503 }
    );
  }
}
