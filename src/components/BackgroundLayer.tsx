/** The chosen wallpaper, with a scrim over it so panel text stays readable.
 *  The scrim takes the theme's own base colour, so raising it fades the photo
 *  back toward the plain background rather than tinting it some other shade. */
import type { Background } from '../types';

export const backgroundUrl = (file: string) => `media://background/${file}`;

interface BackgroundLayerProps {
  background: Background;
  darkMode: boolean;
}

export function BackgroundLayer({ background, darkMode }: BackgroundLayerProps) {
  if (!background.file) return null;

  const scrim = darkMode ? '17, 24, 39' : '249, 250, 251';

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <img src={backgroundUrl(background.file)} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(${scrim}, ${background.overlay})` }} />
    </div>
  );
}
