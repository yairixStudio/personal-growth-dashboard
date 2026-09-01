/** Native drag-and-drop from the OS onto a panel.
 *
 *  Separate from @hello-pangea/dnd, which only moves items already in the app.
 *  Enter/leave fire for every child element, so a depth counter is what keeps
 *  the highlight from flickering as the pointer crosses inner nodes. */
import { useCallback, useRef, useState, type DragEvent } from 'react';

export interface DropZone {
  isOver: boolean;
  dropProps: {
    onDragEnter: (event: DragEvent) => void;
    onDragLeave: (event: DragEvent) => void;
    onDragOver: (event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
  };
}

export function useDropZone(onDrop: (data: DataTransfer) => void, accepts: (data: DataTransfer) => boolean): DropZone {
  const [isOver, setIsOver] = useState(false);
  const depth = useRef(0);

  const onDragEnter = useCallback(
    (event: DragEvent) => {
      if (!event.dataTransfer || !accepts(event.dataTransfer)) return;
      event.preventDefault();
      depth.current += 1;
      setIsOver(true);
    },
    [accepts],
  );

  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setIsOver(false);
  }, []);

  const onDragOver = useCallback(
    (event: DragEvent) => {
      if (!event.dataTransfer || !accepts(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    [accepts],
  );

  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!event.dataTransfer) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current = 0;
      setIsOver(false);
      if (accepts(event.dataTransfer)) onDrop(event.dataTransfer);
    },
    [accepts, onDrop],
  );

  return { isOver, dropProps: { onDragEnter, onDragLeave, onDragOver, onDrop: handleDrop } };
}

/** True when the drag carries at least one file. */
export function hasFiles(data: DataTransfer): boolean {
  return Array.from(data.types).includes('Files');
}

/** True when the drag carries text but no files. */
export function hasText(data: DataTransfer): boolean {
  const types = Array.from(data.types);
  return !types.includes('Files') && (types.includes('text/plain') || types.includes('text/uri-list'));
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;

/** Absolute paths of the dropped image files, via the preload bridge. */
export function imagePathsFrom(data: DataTransfer): string[] {
  return Array.from(data.files)
    .filter((file) => file.type.startsWith('image/') || IMAGE_EXTENSIONS.test(file.name))
    .map((file) => window.desktop.getPathForFile(file))
    .filter((path) => path.length > 0);
}
