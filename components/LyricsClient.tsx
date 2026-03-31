'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
interface LyricsTrack {
  videoId: string;
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
type TimedLyric = {
  time: number;
  text: string;
};
interface LyricsTrack {
  videoId: string;
  name?: string;
  artist?: { name: string } | { name: string }[];
}

interface LyricsClientProps {
  track: LyricsTrack | null;
}
const FALLBACK_LYRICS = 'Lirik tidak tersedia';
async function fetchLyrics(videoId: string): Promise<string> {
  if (!videoId) {
    return FALLBACK_LYRICS;
  }
  try {
    const response = await fetch(`/api/lyrics?id=${encodeURIComponent(videoId)}`);
  currentTime: number;
  isPlaying: boolean;
}
const FALLBACK_LYRICS: TimedLyric[] = [{ time: 0, text: 'Lirik tidak tersedia' }];
const FALLBACK: TimedLyric[] = [{ time: 0, text: 'Lirik tidak tersedia' }];
const getArtistName = (artist?: LyricsTrack['artist']) => {
  if (!artist) return '';
  return Array.isArray(artist) ? artist.map((item) => item.name).join(', ') : artist.name;
};
async function fetchLyrics(track: LyricsTrack): Promise<TimedLyric[]> {
  try {
    const params = new URLSearchParams({
      id: track.videoId,
      title: track.name || '',
      artist: getArtistName(track.artist),
    });

    const response = await fetch(`/api/lyrics?${params.toString()}`);
    if (!response.ok) {
      return FALLBACK_LYRICS;
    }
    const payload = (await response.json()) as { lyrics?: string | null };
    const lyrics = payload.lyrics?.trim();
    return lyrics || FALLBACK_LYRICS;
  } catch {
    return FALLBACK_LYRICS;
  }
}

export default function LyricsClient({ track }: LyricsClientProps) {
  const [lyrics, setLyrics] = useState(FALLBACK_LYRICS);
  const [isLoading, setIsLoading] = useState(false);

    const payload = (await response.json()) as { lyrics?: TimedLyric[] | null };
    if (!Array.isArray(payload.lyrics) || payload.lyrics.length === 0) {
      return FALLBACK_LYRICS;
    if (!response.ok) return FALLBACK;
    const payload = (await response.json()) as { lyrics?: TimedLyric[] | null };
    if (!Array.isArray(payload.lyrics) || payload.lyrics.length === 0) {
      return FALLBACK;
    }
    return payload.lyrics;
  } catch {
    return FALLBACK_LYRICS;
    return FALLBACK;
  }
}

export default function LyricsClient({ track, currentTime, isPlaying }: LyricsClientProps) {
  const [lyrics, setLyrics] = useState<TimedLyric[]>(FALLBACK_LYRICS);
  const [lyrics, setLyrics] = useState<TimedLyric[]>(FALLBACK);
  const [isLoading, setIsLoading] = useState(false);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  useEffect(() => {
    let isMounted = true;

    const loadLyrics = async () => {
      if (!track?.videoId) {
        setLyrics(FALLBACK_LYRICS);
        setLyrics(FALLBACK);
        return;
      }
      setIsLoading(true);
      const nextLyrics = await fetchLyrics(track.videoId);
      const nextLyrics = await fetchLyrics(track);

      if (isMounted) {
        setLyrics(nextLyrics);
        setIsLoading(false);
      }
    };
    loadLyrics();
    return () => {
      isMounted = false;
    };
  }, [track?.videoId]);

  const lines = useMemo(
    () => lyrics.split('\n').map((line) => line.trim()).filter(Boolean),
    [lyrics],
  );

  }, [track]);
  const visibleLyrics = useMemo(
    () => lyrics.filter((line) => line.text.trim().length > 0),
    [lyrics],
  );

  const currentLyricIndex = useMemo(() => {
    if (!visibleLyrics.length) return 0;

    return visibleLyrics.reduce((activeIndex, lyric, index) => {
      if (lyric.time <= currentTime) return index;
      return activeIndex;
    }, 0);
  }, [visibleLyrics, currentTime]);

  const currentLyricIndex = useMemo(() => {
    if (!lyrics.length) return 0;

    return lyrics.reduce((activeIndex, lyric, index) => {
      if (lyric.time <= currentTime) return index;
      return activeIndex;
    }, 0);
  }, [lyrics, currentTime]);
  useEffect(() => {
    console.log('[Lyrics Sync]', { currentTime, currentLyricIndex });
  }, [currentTime, currentLyricIndex]);

  useEffect(() => {
    const currentLine = lineRefs.current[currentLyricIndex];
    if (currentLine) {
      currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLyricIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    console.log('[Lyrics Playback]', { currentTime, currentLyricIndex });
  }, [isPlaying, currentTime, currentLyricIndex]);
  const visibleLyrics = useMemo(() => lyrics.filter((line) => line.text.trim().length > 0), [lyrics]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={track?.videoId || 'empty-lyrics'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        transition={{ duration: 0.25 }}
        className="h-64 overflow-y-auto rounded-xl bg-white/5 p-4 no-scrollbar"
      >
        {isLoading ? (
          <div className="text-sm text-white/60">Memuat lirik...</div>
        ) : (
          <div className="space-y-2 text-sm leading-6 text-white/85 whitespace-pre-wrap">
            {lines.length > 0 ? (
              lines.map((line, index) => (
                <p
                  key={`${line}-${index}`}
                  className={index === 0 ? 'text-white font-medium' : 'text-white/70'}
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-white/60">{FALLBACK_LYRICS}</p>
            )}
          <div className="space-y-3 text-sm leading-7 whitespace-pre-wrap">
            {visibleLyrics.length > 0 ? (
              visibleLyrics.map((line, index) => {
                const isActive = index === currentLyricIndex;

                return (
                  <p
                    key={`${line.time}-${line.text}-${index}`}
                    ref={(el) => {
                      lineRefs.current[index] = el;
                    }}
                    className={`transition-all duration-300 origin-left ${
                      isActive ? 'text-white font-bold scale-105' : 'text-gray-400'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <p className="text-white/60">{FALLBACK_LYRICS[0].text}</p>
            )}
            {visibleLyrics.map((line, index) => {
              const isActive = index === currentLyricIndex;

              return (
                <p
                  key={`${line.time}-${line.text}-${index}`}
                  ref={(el) => {
                    lineRefs.current[index] = el;
                  }}
                  className={[
                    'transition-all duration-300 origin-left',
                    isActive
                      ? 'text-white font-bold scale-105'
                      : 'text-gray-400',
                  ].join(' ')}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
