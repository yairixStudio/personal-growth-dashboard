/** The paper version of the dashboard. Always mounted but only visible to the
 *  printer (see the `@media print` block in index.css): the on-screen grid is
 *  absolutely positioned by Masonry and cannot break across pages, so print
 *  gets its own plain-flow layout instead — ink-friendly, no chrome.
 *  Videos are left out: a link is no use on paper. */
import { useI18n } from '../i18n/I18nProvider';
import type { PanelDef } from '../panels';
import type { Workspace } from '../types';
import { mediaUrl } from './VisionBoardPanel';

interface PrintSheetProps {
  workspace: Workspace;
  panels: PanelDef[];
}

export function PrintSheet({ workspace, panels }: PrintSheetProps) {
  const { lang } = useI18n();

  const boards = panels
    .filter((panel) => panel.kind === 'vision')
    .map((panel) => ({
      panel,
      images: panel.custom ? (workspace.customVision[panel.key] ?? []) : workspace.vision,
    }))
    .filter(({ images }) => images.length > 0);

  const lists = panels
    .filter((panel) => panel.kind === 'list' && panel.list)
    .map((panel) => ({ panel, items: workspace.lists[panel.list as string] ?? [] }))
    .filter(({ items }) => items.length > 0);

  const heading = 'mb-2 flex items-center gap-2 border-b border-gray-300 pb-1 text-base font-semibold';

  return (
    <div data-print-sheet className="hidden bg-white text-black print:block">
      <header className="mb-5 text-center">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { dateStyle: 'long' })}
        </p>
      </header>

      {boards.map(({ panel, images }) => (
        <section key={panel.key} className="mb-6">
          <h2 className={heading}>
            <panel.icon className="h-4 w-4" aria-hidden />
            {panel.title}
          </h2>
          <div className="columns-4 gap-2">
            {images.map((image) => (
              <figure key={image.id} className="mb-2 break-inside-avoid">
                <img src={mediaUrl(image)} alt={image.name} className="w-full rounded" />
                {image.note && <figcaption className="mt-0.5 text-[10px] leading-snug text-gray-600">{image.note}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      ))}

      <div className="columns-2 gap-8">
        {lists.map(({ panel, items }) => (
          <section key={panel.key} className="mb-5 break-inside-avoid">
            <h2 className={heading}>
              <panel.icon className="h-4 w-4" aria-hidden />
              {panel.title}
            </h2>
            <ul className="list-disc space-y-1 ps-5 text-sm leading-snug">
              {items.map((item) => (
                <li key={item.id} className="whitespace-pre-wrap">
                  {item.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
