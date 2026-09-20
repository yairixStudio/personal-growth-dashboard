/** The chosen wallpaper, behind a single frosted-glass layer so panel text
 *  stays readable. One slider (`overlay`, 0–1) drives both how dark the glass
 *  reads and how blurred it is — darker always means more opaque and more
 *  blurred, like real frosted glass rather than a plain tinted scrim.
 *  The tint takes the theme's own base colour, so raising it fades the photo
 *  back toward the plain background rather than tinting it some other shade. */
import type { Background } from '../types';

export const backgroundUrl = (file: string) => (file.startsWith('http') ? file : `media://background/${file}`);

/** Max blur radius, in px, at overlay = 1. */
const MAX_BLUR_PX = 24;

interface BackgroundLayerProps {
  background: Background;
  darkMode: boolean;
}

export function BackgroundLayer({ background, darkMode }: BackgroundLayerProps) {
  if (!background.file) return null;

  const scrim = darkMode ? '17, 24, 39' : '249, 250, 251';
  const blurPx = background.overlay * MAX_BLUR_PX;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Scaled up past the blur radius so the blurred edges don't feather
          the page background into view around the viewport's border. */}
      <img
        src={backgroundUrl(background.file)}
        alt=""
        className="h-full w-full scale-110 object-cover"
        style={{ filter: `blur(${blurPx}px)` }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(${scrim}, ${background.overlay})` }} />
    </div>
  );
}
