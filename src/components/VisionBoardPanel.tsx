/** Images the user picks through a native dialog. The main process copies each
 *  file into the app's own directory and serves it back over `media://`, so the
 *  board keeps working after the original file moves. */
import { useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { VisionImage } from '../types';
import { Panel } from './Panel';

export const mediaUrl = (image: VisionImage) => `media://vision/${image.file}`;

interface VisionBoardPanelProps {
  title: string;
  icon: LucideIcon;
  images: VisionImage[];
  isDimmed: boolean;
  isSpotlit: boolean;
  onSelect?: () => void;
  onAdd: () => void;
  onRemove: (image: VisionImage) => void;
}

export function VisionBoardPanel({
  title,
  icon,
  images,
  isDimmed,
  isSpotlit,
  onSelect,
  onAdd,
  onRemove,
}: VisionBoardPanelProps) {
  const { t } = useI18n();
  const [lightbox, setLightbox] = useState<VisionImage | null>(null);

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
      >
        <div className="grid grid-cols-2 gap-2" onClick={(event) => event.stopPropagation()}>
          {images.map((image) => (
            <figure key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => setLightbox(image)}
                className="h-full w-full"
                aria-label={t('vision.view', { name: image.name })}
              >
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

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8"
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
      )}
    </>
  );
}
