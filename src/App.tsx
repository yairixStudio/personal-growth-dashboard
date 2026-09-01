/** Composition root: one DragDropContext, one grid generated from PANELS. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FocusStage } from './components/FocusStage';
import { ListPanel } from './components/ListPanel';
import { MusicPlayer } from './components/MusicPlayer';
import { SettingsDialog } from './components/SettingsDialog';
import { Toolbar } from './components/Toolbar';
import { VideoPanel } from './components/VideoPanel';
import { VisionBoardPanel } from './components/VisionBoardPanel';
import { WorkspaceSelector, WORKSPACE_DROPPABLE_ID } from './components/WorkspaceSelector';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { PANELS, PANEL_COUNT, type PanelDef } from './panels';
import { sampleLists } from './sample-content';
import { useAppState } from './state/useAppState';
import { useFullscreen } from './state/useFullscreen';
import { LIST_IDS, type ListId, type VisionImage, type Workspace } from './types';

const listIdFromDroppable = (droppableId: string): ListId | null => {
  const [prefix, id] = droppableId.split(':');
  if (prefix !== 'list') return null;
  return (LIST_IDS as readonly string[]).includes(id) ? (id as ListId) : null;
};

export default function App() {
  const { state, workspace, dispatch, loaded } = useAppState();

  // The provider has to sit above everything that calls useI18n, including the
  // loading screen, so the language is in place from the first paint.
  return (
    <I18nProvider lang={state.settings.language}>
      <Dashboard state={state} workspace={workspace} dispatch={dispatch} loaded={loaded} />
    </I18nProvider>
  );
}

type DashboardProps = ReturnType<typeof useAppState>;

function Dashboard({ state, workspace, dispatch, loaded }: DashboardProps) {
  const { t } = useI18n();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [spotlight, setSpotlight] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [pendingDelete, setPendingDelete] = useState<Workspace | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const spotlightRef = useRef(0);

  const goTo = useCallback((index: number, how: 1 | -1 = 1) => {
    const next = ((index % PANEL_COUNT) + PANEL_COUNT) % PANEL_COUNT;
    setDirection(how);
    spotlightRef.current = next;
    setSpotlight(next);
  }, []);

  // Focus mode walks the panels on a timer until paused or exited.
  useEffect(() => {
    if (!isFocusMode || isPaused) return;
    const interval = window.setInterval(() => {
      setDirection(1);
      setSpotlight((current) => {
        const next = (current + 1) % PANEL_COUNT;
        spotlightRef.current = next;
        return next;
      });
    }, state.settings.focusDelayMs);
    return () => window.clearInterval(interval);
  }, [isFocusMode, isPaused, state.settings.focusDelayMs]);

  // F5 starts the run, Esc ends it — the same keys a slideshow uses.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        return;
      }
      if (event.key === 'F5' && !isFocusMode) {
        const target = event.target as HTMLElement | null;
        if (target?.matches('input, textarea, [contenteditable="true"]')) return;
        event.preventDefault();
        setIsFocusMode(true);
        setIsPaused(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFocusMode]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type } = result;
      if (!destination) return;

      if (type === 'workspace' && destination.droppableId === WORKSPACE_DROPPABLE_ID) {
        if (source.index !== destination.index) {
          dispatch({ type: 'workspace/reorder', from: source.index, to: destination.index });
        }
        return;
      }

      if (type === 'item') {
        const from = listIdFromDroppable(source.droppableId);
        const to = listIdFromDroppable(destination.droppableId);
        if (!from || !to) return;
        if (from === to && source.index === destination.index) return;
        dispatch({ type: 'item/move', from, to, fromIndex: source.index, toIndex: destination.index });
      }
    },
    [dispatch],
  );

  const addVisionImages = useCallback(async () => {
    try {
      const images = await window.desktop.addVisionImages();
      dispatch({ type: 'vision/add', images });
    } catch (error) {
      console.error('Could not add images.', error);
    }
  }, [dispatch]);

  const removeVisionImage = useCallback(
    (image: VisionImage) => {
      dispatch({ type: 'vision/remove', id: image.id });
      void window.desktop.removeVisionImage(image.file).catch((error: unknown) => {
        console.error('Could not delete the image file.', error);
      });
    },
    [dispatch],
  );

  /** One panel, rendered the same way in the grid and on the focus stage. */
  const renderPanel = useCallback(
    (panel: PanelDef) => {
      const shared = {
        title: t(panel.titleKey),
        icon: panel.icon,
        isDimmed: false,
        isSpotlit: false,
        onSelect: undefined,
      };

      if (panel.kind === 'list') {
        return (
          <ListPanel
            key={panel.key}
            {...shared}
            list={panel.list}
            placeholder={t(panel.placeholderKey)}
            items={workspace.lists[panel.list]}
            onAdd={(text) => dispatch({ type: 'item/add', list: panel.list, text })}
            onUpdate={(id, text) => dispatch({ type: 'item/update', list: panel.list, id, text })}
            onRemove={(id) => dispatch({ type: 'item/remove', list: panel.list, id })}
          />
        );
      }

      if (panel.kind === 'videos') {
        return (
          <VideoPanel
            key={panel.key}
            {...shared}
            videos={workspace.videos}
            onAdd={(title, url) => dispatch({ type: 'video/add', title, url })}
            onRemove={(id) => dispatch({ type: 'video/remove', id })}
          />
        );
      }

      return (
        <VisionBoardPanel
          key={panel.key}
          {...shared}
          images={workspace.vision}
          onAdd={() => void addVisionImages()}
          onRemove={removeVisionImage}
        />
      );
    },
    [addVisionImages, dispatch, removeVisionImage, t, workspace],
  );

  const settingsDialog = showSettings && (
    <SettingsDialog
      settings={state.settings}
      onLanguageChange={(value) => dispatch({ type: 'settings/language', value })}
      onDarkModeChange={(value) => dispatch({ type: 'settings/darkMode', value })}
      onFocusDelayChange={(value) => dispatch({ type: 'settings/focusDelay', value })}
      onClose={() => setShowSettings(false)}
    />
  );

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-900">
        {t('app.loading')}
      </div>
    );
  }

  const activePanel = PANELS[spotlight];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {isFocusMode ? (
        <FocusStage
          index={spotlight}
          total={PANEL_COUNT}
          label={t(activePanel.titleKey)}
          direction={direction}
          isPaused={isPaused}
          isFullscreen={isFullscreen}
          delayMs={state.settings.focusDelayMs}
          onPrev={() => {
            goTo(spotlightRef.current - 1, -1);
            setIsPaused(true);
          }}
          onNext={() => {
            goTo(spotlightRef.current + 1, 1);
            setIsPaused(true);
          }}
          onGo={(index) => {
            goTo(index, index >= spotlightRef.current ? 1 : -1);
            setIsPaused(true);
          }}
          onTogglePause={() => setIsPaused((value) => !value)}
          onToggleFullscreen={toggleFullscreen}
          onExit={() => setIsFocusMode(false)}
          onDelayChange={(value) => dispatch({ type: 'settings/focusDelay', value })}
        >
          {renderPanel(activePanel)}
        </FocusStage>
      ) : (
        <div className="min-h-screen bg-gray-50 p-5 transition-colors dark:bg-gray-900">
          <WorkspaceSelector
            workspaces={state.workspaces}
            currentId={state.currentWorkspaceId}
            onSwitch={(id) => dispatch({ type: 'workspace/switch', id })}
            onAdd={(name) => dispatch({ type: 'workspace/add', name })}
            onRename={(id, name) => dispatch({ type: 'workspace/rename', id, name })}
            onRequestDelete={setPendingDelete}
          />

          <Toolbar
            isFullscreen={isFullscreen}
            darkMode={state.settings.darkMode}
            onEnterFocus={() => {
              setIsFocusMode(true);
              setIsPaused(false);
            }}
            onToggleFullscreen={toggleFullscreen}
            onFillSample={() =>
              dispatch({ type: 'workspace/fill', content: { lists: sampleLists(state.settings.language) } })
            }
            onToggleTheme={() => dispatch({ type: 'settings/darkMode', value: !state.settings.darkMode })}
            onOpenSettings={() => setShowSettings(true)}
          />

          <header className="mb-8 mt-3 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workspace.name}</h1>
          </header>

          {/* items-start keeps each card at its own height instead of stretching
              every card in a row to match the tallest one. */}
          <div className="mx-auto grid max-w-[2000px] grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PANELS.map((panel) => renderPanel(panel))}
          </div>

          <MusicPlayer />
        </div>
      )}

      {settingsDialog}

      {pendingDelete && (
        <ConfirmDialog
          title={t('workspace.confirmTitle', { name: pendingDelete.name })}
          message={t('workspace.confirmBody')}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            dispatch({ type: 'workspace/delete', id: pendingDelete.id });
            setPendingDelete(null);
          }}
        />
      )}
    </DragDropContext>
  );
}
