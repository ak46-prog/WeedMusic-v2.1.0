import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlist = await db.playlist.findUnique({
    where: { id },
    include: { items: { include: { track: true }, orderBy: { position: 'asc' } } },
  });
  if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  return NextResponse.json({ playlist });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { videoId, title, artist, thumbnail, duration } = body;

  if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

  const track = await db.track.upsert({
    where: { videoId },
    update: { title, artist, thumbnail, duration },
    create: { videoId, title, artist, thumbnail, duration },
  });

  const existingItems = await db.playlistItem.findMany({ where: { playlistId: id } });
  const position = existingItems.length;

  try {
    await db.playlistItem.create({
      data: { playlistId: id, trackId: track.id, position },
    });
  } catch {
    // Already in playlist
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.playlist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
