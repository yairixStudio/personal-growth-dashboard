/**
 * Binaural brainwave generator.
 *
 * Two sine oscillators are panned hard left and right; the difference between
 * their frequencies is the beat the brain perceives. Optional pink noise sits
 * underneath. Everything is synthesised at runtime — no audio files ship with
 * the app, and nothing is fetched.
 *
 * Headphones are required for the binaural effect to work at all.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Headphones, Pause, Play, Volume2 } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  /** Perceived beat, in Hz — the difference between the two ears. */
  beatHz: number;
  /** Base tone both ears hear. */
  carrierHz: number;
  description: string;
}

const PRESETS: readonly Preset[] = [
  { id: 'delta', name: 'Delta', beatHz: 2.5, carrierHz: 120, description: 'Deep rest' },
  { id: 'theta', name: 'Theta', beatHz: 6, carrierHz: 150, description: 'Drifting, creative' },
  { id: 'alpha', name: 'Alpha', beatHz: 10, carrierHz: 180, description: 'Calm focus' },
  { id: 'beta', name: 'Beta', beatHz: 18, carrierHz: 200, description: 'Alert, working' },
  { id: 'gamma', name: 'Gamma', beatHz: 40, carrierHz: 220, description: 'Sharp, engaged' },
] as const;

const FADE_SECONDS = 0.35;
const NOISE_RATIO = 0.35;

/** One second of pink-ish noise, looped. Voss-McCartney, cheap and stable. */
function createPinkNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = context.sampleRate;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

interface Graph {
  context: AudioContext;
  master: GainNode;
  left: OscillatorNode;
  right: OscillatorNode;
  noise: AudioBufferSourceNode;
  noiseGain: GainNode;
}

export function MusicPlayer() {
  const [presetId, setPresetId] = useState<string>('alpha');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [withNoise, setWithNoise] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [failed, setFailed] = useState(false);

  const graphRef = useRef<Graph | null>(null);
  const preset = PRESETS.find((entry) => entry.id === presetId) ?? PRESETS[2];

  const teardown = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graphRef.current = null;

    const stopAt = graph.context.currentTime + FADE_SECONDS;
    graph.master.gain.cancelScheduledValues(graph.context.currentTime);
    graph.master.gain.setTargetAtTime(0, graph.context.currentTime, FADE_SECONDS / 3);

    window.setTimeout(() => {
      try {
        graph.left.stop();
        graph.right.stop();
        graph.noise.stop();
      } catch {
        /* already stopped */
      }
      void graph.context.close();
    }, (stopAt - graph.context.currentTime) * 1000 + 60);
  }, []);

  // Build the graph on play, tear it down on pause. Keeping a context alive
  // while idle would hold an audio device open for nothing.
  useEffect(() => {
    if (!isPlaying) {
      teardown();
      return;
    }

    let graph: Graph;
    try {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const leftPan = context.createStereoPanner();
      leftPan.pan.value = -1;
      const rightPan = context.createStereoPanner();
      rightPan.pan.value = 1;
      leftPan.connect(master);
      rightPan.connect(master);

      const left = context.createOscillator();
      left.type = 'sine';
      left.frequency.value = preset.carrierHz;
      left.connect(leftPan);

      const right = context.createOscillator();
      right.type = 'sine';
      right.frequency.value = preset.carrierHz + preset.beatHz;
      right.connect(rightPan);

      const noiseGain = context.createGain();
      noiseGain.gain.value = withNoise ? NOISE_RATIO : 0;
      noiseGain.connect(master);

      const noise = context.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(context);
      noise.loop = true;
      noise.connect(noiseGain);

      left.start();
      right.start();
      noise.start();

      master.gain.setTargetAtTime(volume, context.currentTime, FADE_SECONDS / 3);

      graph = { context, master, left, right, noise, noiseGain };
      graphRef.current = graph;
      setFailed(false);
    } catch (error) {
      console.error('Could not start audio.', error);
      setFailed(true);
      setIsPlaying(false);
      return;
    }

    return teardown;
    // `volume`, `preset` and `withNoise` are applied by the effects below so
    // that changing them does not rebuild the graph mid-listen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, teardown]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.master.gain.setTargetAtTime(volume, graph.context.currentTime, 0.05);
  }, [volume]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const now = graph.context.currentTime;
    graph.left.frequency.setTargetAtTime(preset.carrierHz, now, 0.08);
    graph.right.frequency.setTargetAtTime(preset.carrierHz + preset.beatHz, now, 0.08);
  }, [preset]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.noiseGain.gain.setTargetAtTime(withNoise ? NOISE_RATIO : 0, graph.context.currentTime, 0.15);
  }, [withNoise]);

  useEffect(() => teardown, [teardown]);

  return (
    <aside
      aria-label="Brainwave player"
      className="fixed bottom-5 right-5 z-40 w-72 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <Headphones className="h-4 w-4 text-blue-500" aria-hidden />
          Brainwaves
        </h2>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand player' : 'Collapse player'}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} aria-hidden />
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPresetId(entry.id)}
                title={`${entry.description} · ${entry.beatHz} Hz`}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  entry.id === preset.id
                    ? 'bg-blue-500 font-medium text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {entry.name}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {preset.description} · {preset.beatHz} Hz beat
          </p>

          {failed && <p className="text-center text-xs text-red-500">Audio could not start on this device.</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((value) => !value)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600"
            >
              {isPlaying ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="ml-0.5 h-4 w-4" aria-hidden />}
            </button>

            <Volume2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Volume"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 dark:bg-gray-600"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={withNoise}
              onChange={(event) => setWithNoise(event.target.checked)}
              className="accent-blue-500"
            />
            Pink noise bed
          </label>

          <p className="text-center text-[11px] leading-tight text-gray-400 dark:text-gray-500">
            Use headphones — the effect comes from the difference between your ears.
          </p>
        </div>
      )}
    </aside>
  );
}
