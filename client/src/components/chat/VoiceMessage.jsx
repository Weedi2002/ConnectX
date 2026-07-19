import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { formatBytes, formatDuration } from '../../utils/format.js';

export default function VoiceMessage({ url, name, size, own }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: own ? 'rgba(255,255,255,0.5)' : 'rgba(148,163,184,0.7)',
      progressColor: own ? '#ffffff' : '#818cf8',
      cursorColor: own ? '#ffffff' : '#a5b4fc',
      barWidth: 2,
      barGap: 2,
      height: 32,
      url,
    });
    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setReady(true);
      setDuration(ws.getDuration());
    });
    ws.on('timeupdate', (t) => setCurrent(t));
    ws.on('play', () => setPlaying(true));
    ws.on('pause', () => setPlaying(false));
    ws.on('finish', () => setPlaying(false));

    return () => ws.destroy();
  }, [url, own]);

  const toggle = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-2">
      <button
        type="button"
        onClick={toggle}
        className={
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ' +
          (own ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-500 hover:bg-indigo-600')
        }
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div className="min-w-0 flex-1">
        <div ref={containerRef} className="w-40 max-w-full sm:w-56" />
        <div className="mt-0.5 flex items-center justify-between text-[10px] opacity-80">
          <span>
            {formatDuration(current)} / {formatDuration(duration)}
          </span>
          {ready && <span>{formatBytes(size)}</span>}
        </div>
      </div>
      <a
        href={url}
        download={name || 'voice-message.webm'}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg px-2 py-1 text-sm hover:bg-black/20"
        title="Download"
      >
        ⬇
      </a>
    </div>
  );
}
