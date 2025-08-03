import { streamText } from 'ai';
import { defaultModels } from '@/lib/ai-config';

export async function POST(req: Request) {
  try {
    const { messages, provider = 'openai' } = await req.json();

    const model = defaultModels[provider as keyof typeof defaultModels];

    if (!model) {
      return new Response('Invalid provider', { status: 400 });
    }

    const result = await streamText({
      model,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}