import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are WeedMusic AI, a friendly voice assistant for a music streaming app called WeedMusic. You help users:
- Find and discover music (songs, albums, artists, genres)
- Get music recommendations based on mood, activity, or genre
- Learn about artists and their discographies
- Understand music trends and what's popular
- Navigate the app features (Kids Mode, Car Mode, Radio, etc.)

Keep responses concise (2-3 sentences max) since this is a voice conversation. Be warm and enthusiastic about music. If asked about non-music topics, gently redirect to music. You can suggest search queries the user might want to try.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body as { message: string; history: ChatMessage[] };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // Keep last 10 messages for context window
      { role: 'user', content: message.trim() },
    ];

    // Use z-ai-web-dev-sdk for AI chat
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 150, // Short responses for voice
    });

    const aiMessage = completion.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: aiMessage,
      provider: 'z-ai',
    });
  } catch (err) {
    console.error('[VoiceAssistant] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
