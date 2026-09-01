/** YouTube shelf. Only ids that match the embed pattern are ever loaded, so a
 *  pasted non-YouTube URL is reported rather than dropped into an iframe. */
import { useEffect, useState } from 'react';
import { Trash2, Video as VideoIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { VideoItem } from '../types';
import { Panel } from './Panel';

const YOUTUBE_ID = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;

export function youtubeId(url: string): string | null {
  const match = YOUTUBE_ID.exec(url);
  return match ? match[1] : null;
}

interface VideoPanelProps {
  title: string;
  icon: LucideIcon;
  videos: VideoItem[];
  isDimmed: boolean;
  isSpotlit: boolean;
  onSelect?: () => void;
  onAdd: (title: string, url: string) => void;
  onRemove: (id: string) => void;
}

export function VideoPanel({
  title,
  icon,
  videos,
  isDimmed,
  isSpotlit,
  onSelect,
  onAdd,
  onRemove,
}: VideoPanelProps) {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(videos[0]?.id ?? null);

  // Keep the selection valid when videos are added or removed.
  useEffect(() => {
    if (videos.length === 0) {
      setSelectedId(null);
    } else if (!videos.some((video) => video.id === selectedId)) {
      setSelectedId(videos[0].id);
    }
  }, [videos, selectedId]);

  const selected = videos.find((video) => video.id === selectedId) ?? null;
  const selectedEmbedId = selected ? youtubeId(selected.url) : null;

  const submit = () => {
    const name = draftTitle.trim();
    const url = draftUrl.trim();
    if (!name || !url) {
      setError(t('video.needBoth'));
      return;
    }
    if (!youtubeId(url)) {
      setError(t('video.notYouTube'));
      return;
    }
    onAdd(name, url);
    setDraftTitle('');
    setDraftUrl('');
    setError(null);
    setIsAdding(false);
  };

  return (
    <Panel
      title={title}
      icon={icon}
      isDimmed={isDimmed}
      isSpotlit={isSpotlit}
      onSelect={onSelect}
      onAdd={() => setIsAdding(true)}
      addLabel={t('video.add')}
    >
      {isAdding && (
        <div className="mb-3 space-y-2" onClick={(event) => event.stopPropagation()}>
          <input
            type="text"
            autoFocus
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder={t('video.title')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="url"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submit()}
            placeholder={t('video.url')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              {t('video.submit')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <p className="py-2 text-sm text-gray-400 dark:text-gray-500">{t('video.empty')}</p>
      ) : (
        <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            {selectedEmbedId ? (
              <iframe
                key={selectedEmbedId}
                src={`https://www.youtube.com/embed/${selectedEmbedId}`}
                title={selected?.title ?? 'Video'}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                <VideoIcon className="me-2 h-4 w-4" aria-hidden />
                {t('video.unplayable')}
              </div>
            )}
          </div>

          <ul className="space-y-1">
            {videos.map((video) => (
              <li
                key={video.id}
                className={`group flex items-center gap-1 rounded-lg px-1 transition-colors ${
                  video.id === selectedId ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(video.id)}
                  className="min-w-0 flex-1 truncate px-2 py-1.5 text-start text-sm text-gray-800 dark:text-gray-200"
                >
                  {video.title}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(video.id)}
                  aria-label={t('video.remove', { title: video.title })}
                  className="rounded-full p-1 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-900/40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
