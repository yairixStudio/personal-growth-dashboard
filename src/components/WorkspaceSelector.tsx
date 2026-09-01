/** Workspace switcher. Reordering uses the app-level DragDropContext with the
 *  `workspace` drag type, so it never collides with item drags. */
import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Check, GripVertical, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Workspace } from '../types';

export const WORKSPACE_DROPPABLE_ID = 'workspaces';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  currentId: string;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRequestDelete: (workspace: Workspace) => void;
}

export function WorkspaceSelector({
  workspaces,
  currentId,
  onSwitch,
  onAdd,
  onRename,
  onRequestDelete,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const current = workspaces.find((workspace) => workspace.id === currentId);

  const commitAdd = () => {
    const name = draft.trim();
    if (name) onAdd(name);
    setDraft('');
    setIsAdding(false);
  };

  return (
    <div
      className="fixed left-4 top-4 z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setEditingId(null);
      }}
    >
      <div className={`rounded-xl bg-white shadow-lg transition-all duration-200 dark:bg-gray-800 ${isOpen ? 'w-72' : 'w-52'}`}>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          className="flex w-full items-center gap-2 rounded-xl p-3 text-left text-gray-800 dark:text-gray-100"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{current?.name ?? 'Workspaces'}</span>
        </button>

        {isOpen && (
          <div className="border-t border-gray-100 p-2 dark:border-gray-700">
            <Droppable droppableId={WORKSPACE_DROPPABLE_ID} type="workspace">
              {(droppable) => (
                <ul ref={droppable.innerRef} {...droppable.droppableProps} className="space-y-0.5">
                  {workspaces.map((workspace, index) => (
                    <Draggable key={workspace.id} draggableId={`workspace:${workspace.id}`} index={index}>
                      {(draggable, snapshot) => (
                        <li
                          ref={draggable.innerRef}
                          {...draggable.draggableProps}
                          className={`group flex items-center gap-0.5 rounded-lg ${
                            snapshot.isDragging ? 'bg-white shadow-lg ring-2 ring-blue-500 dark:bg-gray-800' : ''
                          }`}
                        >
                          <span
                            {...draggable.dragHandleProps}
                            aria-label="Reorder workspace"
                            className="cursor-grab p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
                          >
                            <GripVertical className="h-4 w-4" aria-hidden />
                          </span>

                          {editingId === workspace.id ? (
                            <input
                              type="text"
                              defaultValue={workspace.name}
                              autoFocus
                              onBlur={(event) => {
                                onRename(workspace.id, event.target.value);
                                setEditingId(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  onRename(workspace.id, event.currentTarget.value);
                                  setEditingId(null);
                                }
                                if (event.key === 'Escape') setEditingId(null);
                              }}
                              className="min-w-0 flex-1 rounded bg-transparent px-2 py-1.5 text-sm outline-none ring-2 ring-blue-500/40 dark:text-gray-100"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSwitch(workspace.id)}
                              className={`min-w-0 flex-1 truncate rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                workspace.id === currentId
                                  ? 'bg-blue-100 font-medium text-blue-900 dark:bg-blue-900/60 dark:text-blue-100'
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {workspace.name}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingId(editingId === workspace.id ? null : workspace.id)}
                            aria-label={`Rename ${workspace.name}`}
                            className="rounded p-1 text-blue-500 opacity-0 transition-opacity hover:bg-blue-50 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-blue-900/40"
                          >
                            {editingId === workspace.id ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
                          </button>

                          {workspaces.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onRequestDelete(workspace)}
                              aria-label={`Delete ${workspace.name}`}
                              className="rounded p-1 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-900/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {droppable.placeholder}
                </ul>
              )}
            </Droppable>

            {isAdding ? (
              <div className="mt-2 flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitAdd();
                    if (event.key === 'Escape') {
                      setDraft('');
                      setIsAdding(false);
                    }
                  }}
                  placeholder="Workspace name"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={commitAdd}
                  className="rounded-lg bg-blue-500 px-3 text-sm text-white transition-colors hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg p-2 text-sm text-blue-500 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/40"
              >
                <Plus className="h-4 w-4" aria-hidden />
                New workspace
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
