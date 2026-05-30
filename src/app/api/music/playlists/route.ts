import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const playlists = await db.playlist.findMany({
    include: { 
      items: { 
        include: { track: true },
        orderBy: { position: 'asc' },
      } 
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ playlists });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description } = body;

  if (!name) return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });

  const playlist = await db.playlist.create({
    data: { name, description: description || '' },
  });

  return NextResponse.json({ playlist });
}
