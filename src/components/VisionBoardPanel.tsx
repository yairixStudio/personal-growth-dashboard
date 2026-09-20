/** Images the user picks through a native dialog or drops from the desktop. The
 *  main process copies each file into the app's own directory and serves it back
 *  over `media://`, so the board keeps working after the original file moves.
 *
 *  Two layouts: a card in the grid, and a full-bleed collage on the focus stage. */
import { useCallback, useState } from 'react';
import { ImagePlus, Pencil, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { hasFiles, imagePathsFrom, useDropZone } from '../lib/useDropZone';
import type { VisionImage } from '../types';
import { Panel } from './Panel';

export const mediaUrl = (image: VisionImage) =>
  image.file.startsWith('http') ? image.file : `media://vision/${image.file}`;

/** Custom drag type for swapping a thumbnail into the hero slot — not a file,
 *  so the panel's OS-file drop zone ignores it. */
const SWAP_TYPE = 'application/x-vision-swap';

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

/** Column count that keeps the collage roughly square: 1, 2×1, 2×2, 3×2, 3×3, 4×… */
function boardColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
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
  /** Makes the given image the big one on the card. */
  onSetHero: (id: string) => void;
  /** Saves the note written in the grid and shown on the card's back in focus mode. */
  onSetNote: (id: string, note: string) => void;
  onFocusHere?: () => void;
  focusLabel?: string;
  onRename?: (name: string) => void;
  onIconChange?: (iconKey: string) => void;
  onRequestMenu?: (x: number, y: number) => void;
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
  onSetHero,
  onSetNote,
  onFocusHere,
  focusLabel,
  onRename,
  onIconChange,
  onRequestMenu,
}: VisionBoardPanelProps) {
  const { t } = useI18n();
  const [lightbox, setLightbox] = useState<VisionImage | null>(null);
  const [isSwapTarget, setIsSwapTarget] = useState(false);
  /** Focus mode: the card turned to its back (hover). Grid: the card whose
   *  note is open for editing. */
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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
            // A board, not a strip: columns grow with the count so 4 images sit
            // 2×2 and 6 sit 3×2, with the whole thing kept to a squarish area.
            <div
              className="mx-auto grid gap-5 py-2"
              style={{
                gridTemplateColumns: `repeat(${boardColumns(images.length)}, minmax(0, 1fr))`,
                maxWidth: `${Math.min(boardColumns(images.length) * 22, 72)}rem`,
              }}
            >
              {images.map((image) => {
                const tilt = (jitter(image.id + 'r') - 0.5) * 5;
                const nudge = (jitter(image.id + 'y') - 0.5) * 16;
                const isFlipped = flippedId === image.id;
                return (
                  <figure
                    key={image.id}
                    className="relative [perspective:1400px]"
                    style={{ transform: `rotate(${tilt.toFixed(2)}deg) translateY(${nudge.toFixed(1)}px)` }}
                    onMouseEnter={() => setFlippedId(image.id)}
                    onMouseLeave={() => setFlippedId((current) => (current === image.id ? null : current))}
                  >
                    <div
                      className="relative aspect-[4/3] w-full transition-transform duration-700 [transform-style:preserve-3d]"
                      style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                      <img
                        src={mediaUrl(image)}
                        alt={image.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full rounded-xl object-cover shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] [backface-visibility:hidden]"
                      />

                      {/* Back: the same photo behind frosted glass, note centred on it. */}
                      <div
                        className="absolute inset-0 overflow-hidden rounded-xl shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] [backface-visibility:hidden]"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        <img src={mediaUrl(image)} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
                        <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/75" />
                        <div className="relative flex h-full w-full items-center justify-center p-6">
                          <p className="whitespace-pre-wrap text-center text-lg font-medium leading-snug text-gray-900 dark:text-white">
                            {image.note || <span className="text-gray-500 dark:text-gray-400">{image.name}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
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
        onFocusHere={onFocusHere}
        focusLabel={focusLabel}
        onRename={onRename}
        onIconChange={onIconChange}
      onRequestMenu={onRequestMenu}
        onAdd={onAdd}
        addLabel={t('vision.add')}
        isDropTarget={isOver}
        dropProps={dropProps}
      >
        {/* Hero + L: the first image takes a 3×3 block at the start, the next
            three stack in the column beside it, the rest (and the add tile)
            run along the row beneath. */}
        <div className="grid grid-cols-4 gap-1.5" onClick={(event) => event.stopPropagation()}>
          {images.map((image, index) => {
            const isHero = index === 0;
            const isEditing = editingNoteId === image.id;

            const commitNote = (value: string) => {
              onSetNote(image.id, value);
              setEditingNoteId(null);
            };

            return (
              <figure
                key={image.id}
                draggable={!isHero && !isEditing}
                onDragStart={(event) => {
                  event.dataTransfer.setData(SWAP_TYPE, image.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (isHero && event.dataTransfer.types.includes(SWAP_TYPE)) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setIsSwapTarget(true);
                  }
                }}
                onDragLeave={() => isHero && setIsSwapTarget(false)}
                onDrop={(event) => {
                  const id = event.dataTransfer.getData(SWAP_TYPE);
                  if (!isHero || !id) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setIsSwapTarget(false);
                  onSetHero(id);
                }}
                className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 ${
                  isHero ? 'col-span-3 row-span-3' : isEditing ? '' : 'cursor-grab active:cursor-grabbing'
                } ${isHero && isSwapTarget ? 'ring-4 ring-blue-500/50' : ''}`}
              >
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
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>

                {isEditing && (
                  <div className="absolute inset-0 z-10 overflow-hidden">
                    <img src={mediaUrl(image)} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
                    <div className="absolute inset-0 bg-white/75 dark:bg-gray-900/75" />
                    <textarea
                      autoFocus
                      defaultValue={image.note ?? ''}
                      placeholder={t('vision.notePlaceholder')}
                      onFocus={(event) => {
                        const length = event.currentTarget.value.length;
                        event.currentTarget.setSelectionRange(length, length);
                      }}
                      onBlur={(event) => commitNote(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          commitNote(event.currentTarget.value);
                        }
                        if (event.key === 'Escape') setEditingNoteId(null);
                      }}
                      className="relative h-full w-full resize-none bg-transparent p-2 text-center text-xs text-gray-900 outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
                    />
                  </div>
                )}

                {!isEditing && (
                  <div className="absolute end-1 top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(image.id)}
                      aria-label={t('vision.noteEdit', { name: image.name })}
                      title={t('vision.noteEdit', { name: image.name })}
                      className="rounded-full bg-white/90 p-1.5 text-gray-400 shadow transition-colors hover:text-blue-500 dark:bg-gray-900/90 dark:text-gray-500"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(image)}
                      aria-label={t('vision.remove', { name: image.name })}
                      className="rounded-full bg-white/90 p-1.5 text-gray-400 shadow transition-colors hover:text-red-500 dark:bg-gray-900/90 dark:text-gray-500"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                )}
              </figure>
            );
          })}

          <button
            type="button"
            onClick={onAdd}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-600 dark:text-gray-500 ${
              images.length === 0 ? 'col-span-4 aspect-[3/1]' : 'aspect-square'
            }`}
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
