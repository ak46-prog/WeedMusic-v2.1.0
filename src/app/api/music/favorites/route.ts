import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const favorites = await db.favorite.findMany({
    include: { track: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ items: favorites.map(f => f.track) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { videoId, title, artist, thumbnail, duration } = body;

  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

  // Upsert track
  const track = await db.track.upsert({
    where: { videoId },
    update: { title, artist, thumbnail, duration },
    create: { videoId, title, artist, thumbnail, duration },
  });

  // Add to favorites (ignore if already exists)
  try {
    await db.favorite.create({ data: { trackId: track.id } });
  } catch {
    // Already favorited
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

  const track = await db.track.findUnique({ where: { videoId } });
  if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

  await db.favorite.deleteMany({ where: { trackId: track.id } });
  return NextResponse.json({ success: true });
}
