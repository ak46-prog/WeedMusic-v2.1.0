import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const history = await db.history.findMany({
    include: { track: true },
    orderBy: { playedAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ items: history.map(h => ({ ...h.track, playedAt: h.playedAt })) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoId, title, artist, thumbnail, duration } = body;

  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

  const track = await db.track.upsert({
    where: { videoId },
    update: { title, artist, thumbnail, duration },
    create: { videoId, title, artist, thumbnail, duration },
  });

  await db.history.create({ data: { trackId: track.id } });
  return NextResponse.json({ success: true });
}
