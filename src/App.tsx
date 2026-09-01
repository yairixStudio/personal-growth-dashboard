/** Composition root: one DragDropContext, one grid generated from PANELS. */
import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ListPanel } from './components/ListPanel';
import { MusicPlayer } from './components/MusicPlayer';
import { Toolbar } from './components/Toolbar';
import { VideoPanel } from './components/VideoPanel';
import { VisionBoardPanel } from './components/VisionBoardPanel';
import { WorkspaceSelector, WORKSPACE_DROPPABLE_ID } from './components/WorkspaceSelector';
import { PANELS, PANEL_COUNT } from './panels';
import { sampleLists } from './sample-content';
import { useAppState } from './state/useAppState';
import { LIST_IDS, type ListId, type VisionImage, type Workspace } from './types';

const listIdFromDroppable = (droppableId: string): ListId | null => {
  const [prefix, id] = droppableId.split(':');
  if (prefix !== 'list') return null;
  return (LIST_IDS as readonly string[]).includes(id) ? (id as ListId) : null;
};

export default function App() {
  const { state, workspace, dispatch, loaded } = useAppState();

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [spotlight, setSpotlight] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Workspace | null>(null);

  // Focus mode walks the panels on a timer until paused or exited.
  useEffect(() => {
    if (!isFocusMode || isPaused) return;
    const interval = window.setInterval(() => {
      setSpotlight((current) => (current + 1) % PANEL_COUNT);
    }, state.settings.focusDelayMs);
    return () => window.clearInterval(interval);
  }, [isFocusMode, isPaused, state.settings.focusDelayMs]);

  useEffect(() => {
    if (!isFocusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFocusMode(false);
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

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-900">
        Loading your workspace…
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
          isFocusMode={isFocusMode}
          isPaused={isPaused}
          focusDelayMs={state.settings.focusDelayMs}
          darkMode={state.settings.darkMode}
          onToggleFocus={() => {
            setIsFocusMode((value) => !value);
            setIsPaused(false);
          }}
          onTogglePause={() => setIsPaused((value) => !value)}
          onFocusDelayChange={(value) => dispatch({ type: 'settings/focusDelay', value })}
          onFillSample={() => dispatch({ type: 'workspace/fill', content: { lists: sampleLists() } })}
          onToggleTheme={() => dispatch({ type: 'settings/darkMode', value: !state.settings.darkMode })}
        />

        <header className="mb-8 mt-3 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workspace.name}</h1>
        </header>

        {/* items-start keeps each card at its own height instead of stretching
            every card in a row to match the tallest one. */}
        <div className="mx-auto grid max-w-[2000px] grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PANELS.map((panel, index) => {
            const isSpotlit = isFocusMode && spotlight === index;
            const isDimmed = isFocusMode && spotlight !== index;
            const onSelect = isFocusMode
              ? () => {
                  setSpotlight(index);
                  setIsPaused(true);
                }
              : undefined;

            if (panel.kind === 'list') {
              return (
                <ListPanel
                  key={panel.key}
                  list={panel.list}
                  title={panel.title}
                  icon={panel.icon}
                  placeholder={panel.placeholder}
                  items={workspace.lists[panel.list]}
                  isDimmed={isDimmed}
                  isSpotlit={isSpotlit}
                  onSelect={onSelect}
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
                  title={panel.title}
                  icon={panel.icon}
                  videos={workspace.videos}
                  isDimmed={isDimmed}
                  isSpotlit={isSpotlit}
                  onSelect={onSelect}
                  onAdd={(title, url) => dispatch({ type: 'video/add', title, url })}
                  onRemove={(id) => dispatch({ type: 'video/remove', id })}
                />
              );
            }

            return (
              <VisionBoardPanel
                key={panel.key}
                title={panel.title}
                icon={panel.icon}
                images={workspace.vision}
                isDimmed={isDimmed}
                isSpotlit={isSpotlit}
                onSelect={onSelect}
                onAdd={() => void addVisionImages()}
                onRemove={removeVisionImage}
              />
            );
          })}
        </div>

        <MusicPlayer />

        {pendingDelete && (
          <ConfirmDialog
            title={`Delete "${pendingDelete.name}"?`}
            message="Its goals, values, videos and images will be removed. This cannot be undone."
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => {
              dispatch({ type: 'workspace/delete', id: pendingDelete.id });
              setPendingDelete(null);
            }}
          />
        )}
      </div>
    </DragDropContext>
  );
}
