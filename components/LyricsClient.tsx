'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface LyricsTrack {
  videoId: string;
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

  useEffect(() => {
    let isMounted = true;

    const loadLyrics = async () => {
      if (!track?.videoId) {
        setLyrics(FALLBACK_LYRICS);
        return;
      }

      setIsLoading(true);
      const nextLyrics = await fetchLyrics(track.videoId);

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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={track?.videoId || 'empty-lyrics'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
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
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
