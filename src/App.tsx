/** Composition root: one DragDropContext, one grid generated from getPanels(). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BackgroundLayer } from './components/BackgroundLayer';
import { CanvasMenu } from './components/CanvasMenu';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FocusStage } from './components/FocusStage';
import { ListPanel } from './components/ListPanel';
import { Masonry } from './components/Masonry';
import { MusicPlayer } from './components/MusicPlayer';
import { PrintSheet } from './components/PrintSheet';
import { SectionMenu } from './components/SectionMenu';
import { SettingsDialog } from './components/SettingsDialog';
import { Toolbar } from './components/Toolbar';
import { VideoPanel } from './components/VideoPanel';
import { VisionBoardPanel } from './components/VisionBoardPanel';
import { WorkspaceSelector, WORKSPACE_DROPPABLE_ID } from './components/WorkspaceSelector';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { FIXED_PANELS, getPanels, type PanelDef } from './panels';
import { sampleLists, sampleVideos } from './sample-content';
import { usePointerActivity } from './lib/usePointerActivity';
import { useAppState } from './state/useAppState';
import { useBrainwaves } from './state/useBrainwaves';
import { useFullscreen } from './state/useFullscreen';
import { LIST_IDS, type VisionImage, type Workspace } from './types';

const listIdFromDroppable = (droppableId: string): string | null => {
  const [prefix, id] = droppableId.split(':');
  return prefix === 'list' && id ? id : null;
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
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  /** Where the canvas was double-clicked; anchors the "new section" menu. */
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(null);
  const [sectionMenu, setSectionMenu] = useState<{ x: number; y: number; panel: PanelDef } | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const spotlightRef = useRef(0);
  /** How much of the current interval has already run, so a hold is a real
   *  pause rather than a restart. */
  const elapsedRef = useRef(0);

  const pointerActive = usePointerActivity(isFocusMode);

  // One player for the whole app: it must keep playing uninterrupted whether
  // we're in the normal grid or focus mode, so it's owned here rather than by
  // whichever <MusicPlayer> happens to be mounted.
  const brainwaves = useBrainwaves(isVideoPlaying);

  const panels = getPanels(workspace, t);
  const panelCount = panels.length;

  // Anything that should stop the slideshow, in the order worth reporting.
  const holdReason: 'manual' | 'pointer' | 'video' | null = isPaused
    ? 'manual'
    : isVideoPlaying
      ? 'video'
      : pointerActive
        ? 'pointer'
        : null;
  const isHeld = holdReason !== null;

  const goTo = useCallback(
    (index: number, how: 1 | -1 = 1) => {
      const next = ((index % panelCount) + panelCount) % panelCount;
      setDirection(how);
      spotlightRef.current = next;
      elapsedRef.current = 0;
      setSpotlight(next);
    },
    [panelCount],
  );

  // Focus mode walks the panels on a timer. A hold banks the elapsed time and
  // the next run picks up from there, which keeps the dot animation honest.
  const delayMs = state.settings.focusDelayMs;
  useEffect(() => {
    if (!isFocusMode || isHeld) return;

    const startedAt = Date.now() - elapsedRef.current;
    // The cleanup also runs after a normal fire, when the effect re-runs for the
    // new panel. Banking the elapsed time then would record a whole interval and
    // make every following one expire instantly.
    let fired = false;

    const timer = window.setTimeout(
      () => {
        fired = true;
        elapsedRef.current = 0;
        setDirection(1);
        setSpotlight((current) => {
          const next = (current + 1) % panelCount;
          spotlightRef.current = next;
          return next;
        });
      },
      Math.max(0, delayMs - elapsedRef.current),
    );

    return () => {
      window.clearTimeout(timer);
      if (!fired) elapsedRef.current = Math.min(delayMs, Date.now() - startedAt);
    };
  }, [isFocusMode, isHeld, delayMs, spotlight, panelCount]);

  // Leaving focus mode should not carry a half-spent interval back in.
  useEffect(() => {
    if (!isFocusMode) elapsedRef.current = 0;
  }, [isFocusMode]);

  // The panel count changes at runtime (switching workspace, adding/removing
  // a custom panel) — an out-of-range spotlight would index past the end of
  // `panels` and crash the render below.
  useEffect(() => {
    if (spotlightRef.current >= panelCount) {
      const next = 0;
      spotlightRef.current = next;
      setSpotlight(next);
    }
  }, [panelCount]);

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

  // Without this, a file dropped anywhere but a panel makes the window navigate
  // to it and the app disappears.
  useEffect(() => {
    const swallow = (event: DragEvent) => event.preventDefault();
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, []);

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

  const addVisionImages = useCallback(async (panel?: string) => {
    try {
      const images = await window.desktop.addVisionImages();
      dispatch({ type: 'vision/add', images, panel });
    } catch (error) {
      console.error('Could not add images.', error);
    }
  }, [dispatch]);

  const importVisionImages = useCallback(
    async (paths: string[], panel?: string) => {
      try {
        const images = await window.desktop.importVisionImages(paths);
        dispatch({ type: 'vision/add', images, panel });
      } catch (error) {
        console.error('Could not import images.', error);
      }
    },
    [dispatch],
  );

  const removeVisionImage = useCallback(
    (image: VisionImage, panel?: string) => {
      dispatch({ type: 'vision/remove', id: image.id, panel });
      void window.desktop.removeVisionImage(image.file).catch((error: unknown) => {
        console.error('Could not delete the image file.', error);
      });
    },
    [dispatch],
  );

  /** Jumps straight into focus mode on one panel, rotation paused — the
   *  auto-advance only resumes once the user presses play inside focus mode. */
  const focusOnPanel = useCallback((index: number) => {
    spotlightRef.current = index;
    elapsedRef.current = 0;
    setSpotlight(index);
    setIsPaused(true);
    setIsFocusMode(true);
  }, []);

  /** One panel, rendered the same way in the grid and on the focus stage. */
  const renderPanel = useCallback(
    (panel: PanelDef, bleed = false, index?: number) => {
      const shared = {
        title: panel.title,
        icon: panel.icon,
        isDimmed: false,
        isSpotlit: false,
        onSelect: undefined,
        onFocusHere: index === undefined ? undefined : () => focusOnPanel(index),
        focusLabel: t('panel.focusHere', { title: panel.title }),
        onRename: (name: string) => dispatch({ type: 'panel/rename', id: panel.key, name }),
        onIconChange: (icon: string) => dispatch({ type: 'panel/setIcon', id: panel.key, icon }),
        onRequestMenu:
          index === undefined ? undefined : (x: number, y: number) => setSectionMenu({ x, y, panel }),
      };

      if (panel.kind === 'list' && panel.list) {
        const list = panel.list;
        return (
          <ListPanel
            key={panel.key}
            {...shared}
            list={list}
            placeholder={panel.placeholder ?? ''}
            items={workspace.lists[list] ?? []}
            onAdd={(text) => dispatch({ type: 'item/add', list, text })}
            onUpdate={(id, text) => dispatch({ type: 'item/update', list, id, text })}
            onRemove={(id) => dispatch({ type: 'item/remove', list, id })}
          />
        );
      }

      // Custom media panels keep their own arrays, keyed by panel id.
      const media = panel.custom ? panel.key : undefined;

      if (panel.kind === 'videos') {
        return (
          <VideoPanel
            key={panel.key}
            {...shared}
            videos={media ? (workspace.customVideos[media] ?? []) : workspace.videos}
            onAdd={(title, url) => dispatch({ type: 'video/add', title, url, panel: media })}
            onRemove={(id) => dispatch({ type: 'video/remove', id, panel: media })}
            onPlayingChange={setIsVideoPlaying}
          />
        );
      }

      return (
        <VisionBoardPanel
          key={panel.key}
          {...shared}
          bleed={bleed}
          images={media ? (workspace.customVision[media] ?? []) : workspace.vision}
          onAdd={() => void addVisionImages(media)}
          onDropFiles={(paths) => void importVisionImages(paths, media)}
          onRemove={(image) => removeVisionImage(image, media)}
          onSetHero={(id) => dispatch({ type: 'vision/setHero', id, panel: media })}
          onSetNote={(id, note) => dispatch({ type: 'vision/setNote', id, note, panel: media })}
        />
      );
    },
    [addVisionImages, dispatch, focusOnPanel, importVisionImages, removeVisionImage, t, workspace],
  );

  /** Fills every panel: lists, videos, and freshly generated vision images. */
  const fillSample = useCallback(async () => {
    let vision: VisionImage[] = [];
    try {
      vision = await window.desktop.sampleVisionImages();
    } catch (error) {
      console.error('Could not create sample images.', error);
    }
    dispatch({
      type: 'workspace/fill',
      content: {
        lists: sampleLists(state.settings.language),
        videos: sampleVideos(state.settings.language),
        vision,
      },
    });
  }, [dispatch, state.settings.language]);

  const settingsDialog = showSettings && (
    <SettingsDialog
      settings={state.settings}
      customPanels={workspace.customPanels}
      hiddenFixedPanels={workspace.hiddenFixedPanels.map((key) => {
        const fixed = FIXED_PANELS.find((panel) => panel.key === key);
        const override = workspace.panelOverrides[key];
        return { key, title: override?.name ?? (fixed ? t(fixed.titleKey) : key) };
      })}
      onLanguageChange={(value) => dispatch({ type: 'settings/language', value })}
      onDarkModeChange={(value) => dispatch({ type: 'settings/darkMode', value })}
      onFocusDelayChange={(value) => dispatch({ type: 'settings/focusDelay', value })}
      onBackgroundChange={(file) => dispatch({ type: 'settings/background', file })}
      onOverlayChange={(value) => dispatch({ type: 'settings/overlay', value })}
      onAddCustomPanel={(name) => dispatch({ type: 'panel/addCustom', name })}
      onRemoveCustomPanel={(id) => dispatch({ type: 'panel/removeCustom', id })}
      onRestoreFixedPanel={(id) => dispatch({ type: 'panel/showFixed', id })}
      onFillSample={() => void fillSample()}
      onPrint={() => window.print()}
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

  // `panels` can shrink (switching workspace, deleting a custom panel) while
  // `spotlight` is still mid-flight — guard the render, the effect above
  // settles `spotlight` itself back in range right after.
  const activePanel = panels[spotlight] ?? panels[0];
  const hasBackground = Boolean(state.settings.background.file);
  const isWorkspaceEmpty =
    LIST_IDS.every((list) => workspace.lists[list].length === 0) &&
    workspace.customPanels.every((panel) => (workspace.lists[panel.id] ?? []).length === 0) &&
    Object.values(workspace.customVideos).every((videos) => videos.length === 0) &&
    Object.values(workspace.customVision).every((images) => images.length === 0) &&
    workspace.videos.length === 0 &&
    workspace.vision.length === 0;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <BackgroundLayer background={state.settings.background} darkMode={state.settings.darkMode} />

      {isFocusMode ? (
        <FocusStage
          index={spotlight}
          total={panelCount}
          label={activePanel.title}
          direction={direction}
          isPaused={isHeld}
          holdReason={holdReason}
          isFullscreen={isFullscreen}
          bleed={activePanel.kind === 'vision'}
          hasBackground={hasBackground}
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
          footer={<MusicPlayer variant="minimal" {...brainwaves} />}
        >
          {renderPanel(activePanel, activePanel.kind === 'vision')}
        </FocusStage>
      ) : (
        <div
          data-canvas
          onDoubleClick={(event) => {
            // Only bare canvas — a card, header or button counts as "something".
            if (!(event.target as HTMLElement).hasAttribute('data-canvas')) return;
            setCanvasMenu({ x: event.clientX, y: event.clientY });
          }}
          className={`min-h-screen p-5 transition-colors ${hasBackground ? '' : 'bg-gray-50 dark:bg-gray-900'}`}
        >
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
            isWorkspaceEmpty={isWorkspaceEmpty}
            onEnterFocus={() => {
              setIsFocusMode(true);
              setIsPaused(false);
            }}
            onToggleFullscreen={toggleFullscreen}
            onFillSample={() => void fillSample()}
            onOpenSettings={() => setShowSettings(true)}
          />

          <header className="mb-8 mt-3 text-center">
            {isEditingWorkspaceName ? (
              <input
                type="text"
                defaultValue={workspace.name}
                autoFocus
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => {
                  const name = event.target.value.trim();
                  if (name) dispatch({ type: 'workspace/rename', id: workspace.id, name });
                  setIsEditingWorkspaceName(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                  if (event.key === 'Escape') setIsEditingWorkspaceName(false);
                }}
                className="w-full max-w-md rounded bg-transparent text-center text-3xl font-bold text-gray-900 outline-none ring-2 ring-blue-500/40 dark:text-gray-100"
              />
            ) : (
              <h1
                onClick={() => setIsEditingWorkspaceName(true)}
                title={t('workspace.rename', { name: workspace.name })}
                className="inline-block cursor-pointer rounded px-2 text-3xl font-bold text-gray-900 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                {workspace.name}
              </h1>
            )}
          </header>

          <Masonry
            className="mx-auto max-w-[2000px]"
            keys={panels.map((panel) => panel.key)}
            layoutKey={workspace.id}
            onReorder={(order) => dispatch({ type: 'panel/reorder', order })}
            handleLabel={t('panel.reorder')}
          >
            {panels.map((panel, index) => renderPanel(panel, false, index))}
          </Masonry>

          <MusicPlayer {...brainwaves} />

          {canvasMenu && (
            <CanvasMenu
              x={canvasMenu.x}
              y={canvasMenu.y}
              onCreate={(name, kind) => {
                dispatch({ type: 'panel/addCustom', name, kind });
                setCanvasMenu(null);
              }}
              onClose={() => setCanvasMenu(null)}
            />
          )}

          {sectionMenu && (
            <SectionMenu
              x={sectionMenu.x}
              y={sectionMenu.y}
              onDuplicate={() =>
                dispatch({
                  type: 'panel/duplicate',
                  id: sectionMenu.panel.key,
                  kind: sectionMenu.panel.kind,
                  name: t('canvas.duplicateName', { name: sectionMenu.panel.title }),
                })
              }
              onDelete={() =>
                dispatch(
                  sectionMenu.panel.custom
                    ? { type: 'panel/removeCustom', id: sectionMenu.panel.key }
                    : { type: 'panel/hideFixed', id: sectionMenu.panel.key },
                )
              }
              onClose={() => setSectionMenu(null)}
            />
          )}
        </div>
      )}

      {settingsDialog}

      <PrintSheet workspace={workspace} panels={panels} />

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
