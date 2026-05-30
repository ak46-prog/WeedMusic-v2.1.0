import { NextRequest, NextResponse } from 'next/server';

/**
 * Stream Info Endpoint — Redirects to /api/music/proxy
 *
 * This endpoint is maintained for backward compatibility.
 * All stream resolution logic now lives in /api/music/proxy.
 *
 * Returns JSON with resolved stream metadata.
 */

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  const type = request.nextUrl.searchParams.get('type') || 'audio';
  const audioQuality = request.nextUrl.searchParams.get('audioQuality') || '256';
  const videoQuality = request.nextUrl.searchParams.get('videoQuality') || '720';
  const carMode = request.nextUrl.searchParams.get('carMode') === 'true';
  const format = request.nextUrl.searchParams.get('format') || 'mp4';

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // Forward to the proxy endpoint which resolves the stream
  const proxyUrl = `/api/music/proxy?id=${encodeURIComponent(videoId)}&format=${format}`;
  
  try {
    const res = await fetch(new URL(proxyUrl, request.url));
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Stream unavailable', fallback: 'youtube' },
        { status: res.status },
      );
    }

    // Transform proxy response to match old stream API format
    const result: any = {
      videoId,
      title: data.title || '',
      artist: data.artist || '',
      thumbnail: data.thumbnail || '',
      duration: data.duration || 0,
      audioQuality,
      videoQuality,
      streamUrl: data.directUrl || '',
      directUrl: data.directUrl || '',
      mimeType: data.mimeType || 'audio/mp4',
      qualityLabel: type === 'audio' ? `${audioQuality}kbps` : `${videoQuality}p`,
      source: data.source || 'stream',
      itag: data.itag,
    };

    if (carMode) {
      result.carMode = true;
      result.availableQualities = (data.invidiousFallbacks || []).map((fb: any) => ({
        url: fb.url,
        mimeType: fb.mimeType,
        label: '128kbps',
      }));
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Stream unavailable', fallback: 'youtube' },
      { status: 503 },
    );
  }
}
