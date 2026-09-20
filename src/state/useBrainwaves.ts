/**
 * Binaural brainwave playback, lifted out of `MusicPlayer` so a single audio
 * graph survives the switch between normal view and focus mode instead of
 * being torn down and rebuilt on every mount/unmount.
 *
 * Two sine oscillators are panned hard left and right; the difference between
 * their frequencies is the beat the brain perceives. Optional pink noise sits
 * underneath. Everything is synthesised at runtime — no audio files ship with
 * the app, and nothing is fetched. Headphones are required for the binaural
 * effect to work at all.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StringKey } from '../i18n/strings';

export interface BrainwavePreset {
  id: string;
  nameKey: StringKey;
  descriptionKey: StringKey;
  /** Perceived beat, in Hz — the difference between the two ears. */
  beatHz: number;
  /** Base tone both ears hear. */
  carrierHz: number;
}

export const BRAINWAVE_PRESETS: readonly BrainwavePreset[] = [
  { id: 'delta', nameKey: 'music.delta', descriptionKey: 'music.deltaDesc', beatHz: 2.5, carrierHz: 120 },
  { id: 'theta', nameKey: 'music.theta', descriptionKey: 'music.thetaDesc', beatHz: 6, carrierHz: 150 },
  { id: 'alpha', nameKey: 'music.alpha', descriptionKey: 'music.alphaDesc', beatHz: 10, carrierHz: 180 },
  { id: 'beta', nameKey: 'music.beta', descriptionKey: 'music.betaDesc', beatHz: 18, carrierHz: 200 },
  { id: 'gamma', nameKey: 'music.gamma', descriptionKey: 'music.gammaDesc', beatHz: 40, carrierHz: 220 },
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

export interface Brainwaves {
  preset: BrainwavePreset;
  presetId: string;
  setPresetId: (id: string) => void;
  isPlaying: boolean;
  togglePlaying: () => void;
  volume: number;
  setVolume: (value: number) => void;
  withNoise: boolean;
  setWithNoise: (value: boolean) => void;
  failed: boolean;
}

/**
 * One logical player for the whole app. Mount this once (in `App.tsx`) and
 * hand the returned state down to every `<MusicPlayer>` instance so playback
 * is continuous across normal view and focus mode.
 *
 * @param suspended Something else owns the speakers right now (a video) —
 *   hold playback and resume automatically once it releases them.
 */
export function useBrainwaves(suspended: boolean): Brainwaves {
  const [presetId, setPresetId] = useState<string>('alpha');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [withNoise, setWithNoise] = useState(true);
  const [failed, setFailed] = useState(false);

  const graphRef = useRef<Graph | null>(null);
  const preset = BRAINWAVE_PRESETS.find((entry) => entry.id === presetId) ?? BRAINWAVE_PRESETS[2];

  const teardown = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graphRef.current = null;

    const stopAt = graph.context.currentTime + FADE_SECONDS;
    graph.master.gain.cancelScheduledValues(graph.context.currentTime);
    graph.master.gain.setTargetAtTime(0, graph.context.currentTime, FADE_SECONDS / 3);

    window.setTimeout(
      () => {
        try {
          graph.left.stop();
          graph.right.stop();
          graph.noise.stop();
        } catch {
          /* already stopped */
        }
        void graph.context.close();
      },
      (stopAt - graph.context.currentTime) * 1000 + 60,
    );
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

  // A video takes over the speakers: stop, and resume afterwards only if this
  // was actually playing beforehand. Entering/leaving focus mode does *not*
  // touch this — the two are deliberately independent.
  const resumeAfterSuspend = useRef(false);
  useEffect(() => {
    if (suspended) {
      setIsPlaying((playing) => {
        if (playing) resumeAfterSuspend.current = true;
        return false;
      });
    } else if (resumeAfterSuspend.current) {
      resumeAfterSuspend.current = false;
      setIsPlaying(true);
    }
  }, [suspended]);

  return {
    preset,
    presetId,
    setPresetId,
    isPlaying,
    togglePlaying: () => setIsPlaying((value) => !value),
    volume,
    setVolume,
    withNoise,
    setWithNoise,
    failed,
  };
}
