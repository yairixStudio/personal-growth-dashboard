/** Column-balanced layout: each card goes into whichever column is currently
 *  shortest, so a short card is followed straight away by the next one instead
 *  of leaving a hole under it the way a fixed grid row does.
 *
 *  Cards are absolutely positioned inside one parent rather than split into
 *  column wrappers, so a card that moves to another column is not remounted —
 *  an open "add item" input survives the reflow it just caused.
 *
 *  Reordering: a short pill appears at the top of a hovered card; dragging it
 *  carries the card with the pointer while the others re-flow live around the
 *  slot it would land in. DOM order never changes during a drag — only the
 *  computed positions do — because moving a node mid-drag would drop the
 *  pointer sequence and strand the card wherever it was. */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

interface MasonryProps {
  children: ReactNode[];
  /** One stable key per child, in the same order. */
  keys: string[];
  gap?: number;
  className?: string;
  /** Called with the full new key order when a drag ends. */
  onReorder?: (keys: string[]) => void;
  handleLabel?: string;
  /** Changing this (e.g. the workspace id) re-lays out without animating —
   *  every card changed at once, so sliding them around would just be noise. */
  layoutKey?: string;
}

interface Drag {
  key: string;
  /** Pointer offset from the card's top-left at grab time. */
  grabX: number;
  grabY: number;
  x: number;
  y: number;
}

function columnsFor(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

interface Slot {
  col: number;
  top: number;
  height: number;
}

function place(order: string[], columns: number, heights: Record<string, number>, gap: number): Map<string, Slot> {
  const tops = new Array<number>(columns).fill(0);
  const slots = new Map<string, Slot>();
  for (const key of order) {
    let col = 0;
    for (let c = 1; c < columns; c += 1) if (tops[c] < tops[col] - 1) col = c;
    const height = heights[key] ?? 0;
    slots.set(key, { col, top: tops[col], height });
    tops[col] += height + gap;
  }
  return slots;
}

export function Masonry({ children, keys, gap = 20, className = '', onReorder, handleLabel, layoutKey }: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [liveOrder, setLiveOrder] = useState<string[] | null>(null);
  const [animate, setAnimate] = useState(false);

  // Measure everything up front (before paint) whenever the set of cards or
  // the workspace changes, so the first layout is already right; the observer
  // then only has to track cards growing and shrinking.
  useLayoutEffect(() => {
    const fresh: Record<string, number> = {};
    for (const [key, node] of nodes.current) fresh[key] = node.offsetHeight;
    setHeights(fresh);
    setAnimate(false);
  }, [keys.join('|'), layoutKey]);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          setWidth(entry.contentRect.width);
          continue;
        }
        const key = (entry.target as HTMLElement).dataset.masonryKey;
        if (!key) continue;
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
      }
    });
    observer.observe(el);
    for (const node of nodes.current.values()) observer.observe(node);
    return () => observer.disconnect();
    // Re-observe when the set of cards changes.
  }, [keys.join('|')]);

  // Once the parent has applied a drop, its `keys` carry the new order and the
  // provisional one can go. Kept until then so the cards don't snap back to the
  // old order for a frame between the drop and the parent's re-render.
  useEffect(() => {
    if (!drag && liveOrder) setLiveOrder(null);
  }, [keys.join('|')]);

  const columns = columnsFor(window.innerWidth);
  const columnWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;
  const order = liveOrder ?? keys;
  const slots = place(order, columns, heights, gap);
  const totalHeight = Math.max(0, ...[...slots.values()].map((slot) => slot.top + slot.height));
  const leftOf = (col: number) => col * (columnWidth + gap);
  // A card that hasn't been measured yet has no real position; keep it (and
  // any animation that would react to its placeholder height) out of sight.
  const allMeasured = width > 0 && keys.every((key) => key in heights);

  // The live drag is driven from window listeners so it survives anything the
  // re-render does to the handle element. Latest values go through refs.
  const latest = useRef({ drag, order, columns, columnWidth, heights, keys, liveOrder });
  latest.current = { drag, order, columns, columnWidth, heights, keys, liveOrder };
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const pointerInContainer = (event: { clientX: number; clientY: number }) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrag = (key: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const slot = slots.get(key)!;
    const p = pointerInContainer(event);
    const left = leftOf(slot.col);
    setDrag({ key, grabX: p.x - left, grabY: p.y - slot.top, x: left, y: slot.top });
    setLiveOrder(order);
  };

  useEffect(() => {
    if (!drag) return;
    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    // The order as of the last applied move — state may lag behind it by a
    // render, and a fast drag can end before that render happens.
    let settledOrder = latest.current.order;

    const apply = () => {
      frame = 0;
      const p = pending;
      pending = null;
      const { drag: current, columns, columnWidth, heights } = latest.current;
      const order = settledOrder;
      if (!p || !current) return;
      setDrag({ ...current, x: p.x - current.grabX, y: p.y - current.grabY });

      // Where would the card land? Lay the others out without it, find the
      // card under the pointer, and slot in before or after its midline.
      const others = order.filter((key) => key !== current.key);
      const placed = place(others, columns, heights, gap);
      let hitKey: string | null = null;
      let hit: Slot | null = null;
      for (const [key, slot] of placed) {
        const left = slot.col * (columnWidth + gap);
        if (p.x >= left && p.x <= left + columnWidth && p.y >= slot.top && p.y <= slot.top + slot.height + gap) {
          hitKey = key;
          hit = slot;
          break;
        }
      }
      if (!hitKey || !hit) return;
      const at = others.indexOf(hitKey) + (p.y > hit.top + hit.height / 2 ? 1 : 0);
      const next = [...others.slice(0, at), current.key, ...others.slice(at)];
      if (next.some((key, index) => key !== order[index])) {
        settledOrder = next;
        setLiveOrder(next);
      }
    };

    const onMove = (event: PointerEvent) => {
      pending = pointerInContainer(event);
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onUp = () => {
      if (frame) cancelAnimationFrame(frame);
      apply();
      const { keys } = latest.current;
      if (settledOrder.some((key, index) => key !== keys[index])) onReorderRef.current?.(settledOrder);
      else setLiveOrder(null);
      setDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [drag !== null]);

  return (
    <div ref={containerRef} data-canvas className={`relative ${className}`} style={{ height: width > 0 ? totalHeight : undefined }}>
      {keys.map((key, index) => {
        const slot = slots.get(key);
        const dragging = drag?.key === key;
        const hidden = !allMeasured || !slot;
        return (
          <div
            key={key}
            data-masonry-key={key}
            ref={(node) => {
              if (node) nodes.current.set(key, node);
              else nodes.current.delete(key);
            }}
            className={[
              'group/card',
              hidden ? 'invisible' : dragging ? 'z-30 scale-[1.02] shadow-2xl' : animate ? 'transition-[top,left] duration-300' : '',
            ].join(' ')}
            style={
              width > 0 && slot
                ? {
                    position: 'absolute',
                    top: dragging ? drag.y : slot.top,
                    left: dragging ? drag.x : leftOf(slot.col),
                    width: columnWidth,
                  }
                : undefined
            }
          >
            {onReorder && (
              <button
                type="button"
                aria-label={handleLabel}
                title={handleLabel}
                onPointerDown={startDrag(key)}
                className={`absolute left-1/2 top-1 z-10 h-4 w-10 -translate-x-1/2 cursor-grab touch-none py-1.5 active:cursor-grabbing ${
                  dragging ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
                }`}
              >
                <span
                  className={`mx-auto block h-1 w-7 rounded-full transition-colors ${
                    dragging ? 'bg-gray-500 dark:bg-gray-300' : 'bg-gray-300 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-300'
                  }`}
                />
              </button>
            )}
            {children[index]}
          </div>
        );
      })}
    </div>
  );
}
