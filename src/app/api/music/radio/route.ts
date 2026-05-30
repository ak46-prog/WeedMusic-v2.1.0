import { NextRequest, NextResponse } from 'next/server';

// Radio Browser API - free, open-source radio directory
const RADIO_BROWSER_API = 'https://de1.api.radio-browser.info';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('q');
  const country = request.nextUrl.searchParams.get('country');
  const genre = request.nextUrl.searchParams.get('genre');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30');

  try {
    let url = '';
    
    if (search) {
      url = `${RADIO_BROWSER_API}/json/stations/byname/${encodeURIComponent(search)}?limit=${limit}&order=clickcount&reverse=true`;
    } else if (country) {
      url = `${RADIO_BROWSER_API}/json/stations/bycountry/${encodeURIComponent(country)}?limit=${limit}&order=clickcount&reverse=true`;
    } else if (genre) {
      url = `${RADIO_BROWSER_API}/json/stations/bytag/${encodeURIComponent(genre)}?limit=${limit}&order=clickcount&reverse=true`;
    } else {
      // Popular stations (trending)
      url = `${RADIO_BROWSER_API}/json/stations/search?limit=${limit}&order=clickcount&reverse=true&has_geo_info=true`;
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeedMusic/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error('Radio API failed');
    }

    const data = await res.json();
    
    const stations = (Array.isArray(data) ? data : []).map((station: any) => ({
      id: station.stationuuid || '',
      name: station.name || 'Unknown Station',
      url: station.url_resolved || station.url || '',
      homepage: station.homepage || '',
      favicon: station.favicon || '',
      country: station.country || '',
      countryCode: station.countrycode || '',
      state: station.state || '',
      tags: station.tags || '',
      genre: station.tags?.split(',')[0] || 'General',
      language: station.language || '',
      codec: station.codec || '',
      bitrate: station.bitrate || 0,
      isLive: station.lastcheckok === 1,
      votes: station.votes || 0,
      clickCount: station.clickcount || 0,
      geoLat: station.geo_lat || 0,
      geoLon: station.geo_lon || 0,
    })).filter((s: any) => s.url); // Only stations with a stream URL

    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json({ stations: [], error: 'Radio stations temporarily unavailable' });
  }
}
