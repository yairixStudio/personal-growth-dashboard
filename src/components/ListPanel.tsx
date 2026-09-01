/** A reorderable list of short text items. Items can also be dragged between
 *  list panels — every list shares the app-level DragDropContext. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { GripVertical, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { hasText, useDropZone } from '../lib/useDropZone';
import type { Item, ListId } from '../types';
import { Panel } from './Panel';

export const listDroppableId = (list: ListId) => `list:${list}`;

interface ListPanelProps {
  list: ListId;
  title: string;
  icon: LucideIcon;
  placeholder: string;
  items: Item[];
  isDimmed: boolean;
  isSpotlit: boolean;
  onSelect?: () => void;
  onAdd: (text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

export function ListPanel({
  list,
  title,
  icon,
  placeholder,
  items,
  isDimmed,
  isSpotlit,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: ListPanelProps) {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) addRef.current?.focus();
  }, [isAdding]);

  // Each dropped line becomes its own item — pasting a list Just Works.
  const handleDrop = useCallback(
    (data: DataTransfer) => {
      data
        .getData('text/plain')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => onAdd(line));
    },
    [onAdd],
  );
  const { isOver, dropProps } = useDropZone(handleDrop, hasText);

  const commitAdd = () => {
    const text = draft.trim();
    if (text) onAdd(text);
    setDraft('');
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
      addLabel={t('list.addTo', { title })}
      isDropTarget={isOver}
      dropProps={dropProps}
    >
      {isAdding && (
        <div className="mb-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
          <input
            ref={addRef}
            type="text"
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitAdd();
              if (event.key === 'Escape') {
                setDraft('');
                setIsAdding(false);
              }
            }}
            onBlur={commitAdd}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      )}

      <Droppable droppableId={listDroppableId(list)} type="item">
        {(droppable, dropSnapshot) => (
          <ul
            ref={droppable.innerRef}
            {...droppable.droppableProps}
            className={`min-h-[2.5rem] rounded-lg transition-colors ${
              dropSnapshot.isDraggingOver ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''
            }`}
          >
            {items.length === 0 && !dropSnapshot.isDraggingOver && (
              <li className="px-1 py-2 text-sm text-gray-400 dark:text-gray-500">
                {isOver ? t('list.dropHint') : t('list.empty')}
              </li>
            )}

            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(draggable, dragSnapshot) => (
                  <li
                    ref={draggable.innerRef}
                    {...draggable.draggableProps}
                    className="mb-1.5 last:mb-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className={`group flex items-center gap-1 rounded-lg px-1 py-1 transition-shadow ${
                        dragSnapshot.isDragging
                          ? 'bg-white shadow-lg ring-2 ring-blue-500 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'
                      }`}
                    >
                      <span
                        {...draggable.dragHandleProps}
                        aria-label={t('list.reorder')}
                        className="cursor-grab p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
                      >
                        <GripVertical className="h-4 w-4" aria-hidden />
                      </span>

                      {editingId === item.id ? (
                        <input
                          type="text"
                          defaultValue={item.text}
                          autoFocus
                          onBlur={(event) => {
                            onUpdate(item.id, event.target.value);
                            setEditingId(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              onUpdate(item.id, event.currentTarget.value);
                              setEditingId(null);
                            }
                            if (event.key === 'Escape') setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm text-gray-900 outline-none ring-2 ring-blue-500/40 dark:text-gray-100"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingId(item.id)}
                          title={t('list.editHint')}
                          className="min-w-0 flex-1 break-words px-1 py-0.5 text-start text-sm text-gray-800 dark:text-gray-200"
                        >
                          {item.text}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={t('list.delete', { text: item.text })}
                        className="rounded-full p-1 text-red-500 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-red-900/40"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                )}
              </Draggable>
            ))}
            {droppable.placeholder}
          </ul>
        )}
      </Droppable>
    </Panel>
  );
}
