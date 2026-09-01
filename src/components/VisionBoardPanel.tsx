/** Images the user picks through a native dialog or drops from the desktop. The
 *  main process copies each file into the app's own directory and serves it back
 *  over `media://`, so the board keeps working after the original file moves.
 *
 *  Two layouts: a card in the grid, and a full-bleed collage on the focus stage. */
import { useCallback, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { hasFiles, imagePathsFrom, useDropZone } from '../lib/useDropZone';
import type { VisionImage } from '../types';
import { Panel } from './Panel';

export const mediaUrl = (image: VisionImage) => `media://vision/${image.file}`;

/** Stable pseudo-random in [0,1) from a string — the same image always lands in
 *  the same place, so the collage does not reshuffle on every render. */
function jitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

interface VisionBoardPanelProps {
  title: string;
  icon: LucideIcon;
  images: VisionImage[];
  isDimmed: boolean;
  isSpotlit: boolean;
  /** Full-bleed collage instead of a card — used on the focus stage. */
  bleed?: boolean;
  onSelect?: () => void;
  onAdd: () => void;
  onDropFiles: (paths: string[]) => void;
  onRemove: (image: VisionImage) => void;
}

export function VisionBoardPanel({
  title,
  icon,
  images,
  isDimmed,
  isSpotlit,
  bleed = false,
  onSelect,
  onAdd,
  onDropFiles,
  onRemove,
}: VisionBoardPanelProps) {
  const { t } = useI18n();
  const [lightbox, setLightbox] = useState<VisionImage | null>(null);

  const handleDrop = useCallback(
    (data: DataTransfer) => {
      const paths = imagePathsFrom(data);
      if (paths.length) onDropFiles(paths);
    },
    [onDropFiles],
  );
  const { isOver, dropProps } = useDropZone(handleDrop, hasFiles);

  const lightboxView = lightbox && (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-8"
      onClick={() => setLightbox(null)}
      role="dialog"
      aria-modal="true"
      aria-label={lightbox.name}
    >
      <button
        type="button"
        onClick={() => setLightbox(null)}
        aria-label={t('common.close')}
        className="absolute end-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" aria-hidden />
      </button>
      <img
        src={mediaUrl(lightbox)}
        alt={lightbox.name}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );

  // ---- focus stage: a loose collage straight onto the backdrop ----
  if (bleed) {
    return (
      <>
        <div
          {...dropProps}
          className={`h-full w-full rounded-3xl px-2 transition-colors ${
            isOver ? 'bg-blue-500/10 outline-dashed outline-2 outline-blue-400/60' : ''
          }`}
        >
          {images.length === 0 ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
              <ImagePlus className="h-10 w-10" aria-hidden />
              <p className="text-lg">{t('vision.dropHint')}</p>
            </div>
          ) : (
            // More columns on a wide screen keeps each image small enough that
            // a full board still fits without scrolling.
            <div className="columns-2 gap-4 py-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [column-fill:_balance]">
              {images.map((image) => {
                const tilt = (jitter(image.id + 'r') - 0.5) * 5;
                const nudge = (jitter(image.id + 'y') - 0.5) * 22;
                return (
                  <figure
                    key={image.id}
                    className="group relative mb-4 break-inside-avoid"
                    style={{ transform: `rotate(${tilt.toFixed(2)}deg) translateY(${nudge.toFixed(1)}px)` }}
                  >
                    <button type="button" onClick={() => setLightbox(image)} className="block w-full" aria-label={t('vision.view', { name: image.name })}>
                      <img
                        src={mediaUrl(image)}
                        alt={image.name}
                        loading="lazy"
                        className="w-full rounded-xl object-cover shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(image)}
                      aria-label={t('vision.remove', { name: image.name })}
                      className="absolute end-2 top-2 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 dark:bg-gray-900/90"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </figure>
                );
              })}
            </div>
          )}
        </div>
        {lightboxView}
      </>
    );
  }

  // ---- grid: the usual card ----
  return (
    <>
      <Panel
        title={title}
        icon={icon}
        isDimmed={isDimmed}
        isSpotlit={isSpotlit}
        onSelect={onSelect}
        onAdd={onAdd}
        addLabel={t('vision.add')}
        isDropTarget={isOver}
        dropProps={dropProps}
      >
        <div className="grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
          {images.map((image) => (
            <figure key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <button type="button" onClick={() => setLightbox(image)} className="h-full w-full" aria-label={t('vision.view', { name: image.name })}>
                <img
                  src={mediaUrl(image)}
                  alt={image.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => onRemove(image)}
                aria-label={t('vision.remove', { name: image.name })}
                className="absolute end-1 top-1 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 dark:bg-gray-900/90"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </figure>
          ))}

          <button
            type="button"
            onClick={onAdd}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-600 dark:text-gray-500"
          >
            <ImagePlus className="h-7 w-7" aria-hidden />
            <span className="text-xs">{t('vision.add')}</span>
          </button>
        </div>
      </Panel>
      {lightboxView}
    </>
  );
}
