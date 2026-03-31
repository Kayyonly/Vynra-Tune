import { NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let initialized = false;

type TimedLyric = {
  time: number;
  text: string;
};

const FALLBACK = { lyrics: null as TimedLyric[] | null };

const getLyricsBrowseId = (payload: any): string | null => {
  const tabs = payload?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;

  if (!Array.isArray(tabs)) return null;

  for (const tab of tabs) {
    const pageType = tab?.tabRenderer?.endpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
    if (pageType === 'MUSIC_PAGE_TYPE_TRACK_LYRICS') {
      return tab?.tabRenderer?.endpoint?.browseEndpoint?.browseId || null;
    }
  }

  return null;
};

const parseLyricsText = (payload: any): string | null => {
  const runs = payload?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description?.runs;

  if (!Array.isArray(runs)) return null;

  const text = runs.map((run: { text?: string }) => run.text || '').join('').trim();
  if (!text || text.includes('Lyrics not available')) return null;

  return text;
};

const parseLrcToTimedLyrics = (lrc: string): TimedLyric[] => {
  const rows = lrc.split('\n').map((line) => line.trim()).filter(Boolean);
  const result: TimedLyric[] = [];

  for (const row of rows) {
    const match = row.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,2}))?\](.*)$/);
    if (!match) continue;

    const min = Number(match[1]);
    const sec = Number(match[2]);
    const cs = Number((match[3] || '0').padEnd(2, '0'));
    const text = match[4].trim();

    if (!text) continue;

    result.push({
      time: min * 60 + sec + cs / 100,
      text,
    });
  }

  return result.sort((a, b) => a.time - b.time);
};

const plainToTimedLyrics = (text: string): TimedLyric[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      time: index * 4,
      text: line,
    }));
};

async function fetchSyncedLyricsFromLrcLib(artist: string, title: string): Promise<TimedLyric[] | null> {
  if (!artist || !title) return null;

  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) return null;

    const payload = (await response.json()) as { syncedLyrics?: string };
    if (!payload.syncedLyrics) return null;

    const lyrics = parseLrcToTimedLyrics(payload.syncedLyrics);
    return lyrics.length > 0 ? lyrics : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').trim();
  const artist = (searchParams.get('artist') || '').trim();
  const title = (searchParams.get('title') || '').trim();

  if (!id || id.length !== 11) {
    return NextResponse.json(FALLBACK, { status: 200 });
  }

  try {
    const syncedLyrics = await fetchSyncedLyricsFromLrcLib(artist, title);
    if (syncedLyrics) {
      return NextResponse.json({ lyrics: syncedLyrics });
    }

    if (!initialized) {
      await ytmusic.initialize();
      initialized = true;
    }

    const nextPayload = await (ytmusic as any).constructRequest('next', { videoId: id });
    const browseId = getLyricsBrowseId(nextPayload);

    if (!browseId) {
      return NextResponse.json(FALLBACK);
    }

    const lyricsPayload = await (ytmusic as any).constructRequest('browse', { browseId });
    const lyricsText = parseLyricsText(lyricsPayload);

    if (!lyricsText) {
      return NextResponse.json(FALLBACK);
    }

    return NextResponse.json({ lyrics: plainToTimedLyrics(lyricsText) });
  } catch (error) {
    console.error(`Lyrics API failed for id ${id}:`, error);
    return NextResponse.json(FALLBACK);
  }
}
