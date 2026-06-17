'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { FiMenu } from 'react-icons/fi';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortableItem = {
  id: UniqueIdentifier;
  [key: string]: unknown;
};

export type SortableListDirection = 'vertical' | 'horizontal' | 'grid';

export type SortableListProps<T extends SortableItem> = {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLElement>) => ReactNode;
  direction?: SortableListDirection;
  className?: string;
  itemClassName?: string;
  lockAxis?: boolean;
  dragWholeItem?: boolean;
};

// ─── SortableItem wrapper ────────────────────────────────────────────────────

type SortableItemWrapperProps = {
  id: UniqueIdentifier;
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => ReactNode;
  dragWholeItem?: boolean;
  itemClassName?: string;
};

function SortableItemWrapper({ id, children, dragWholeItem, itemClassName }: SortableItemWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelfDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.35 : 1,
    cursor: dragWholeItem ? (isSelfDragging ? 'grabbing' : 'grab') : undefined,
  };

  const wholeItemProps = dragWholeItem ? { ...attributes, ...listeners } : {};
  const dragHandleProps = dragWholeItem ? {} : { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style} className={itemClassName} {...wholeItemProps}>
      {children(dragHandleProps)}
    </div>
  );
}

// ─── Default drag handle ─────────────────────────────────────────────────────

export function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="cursor-grab touch-none p-1 text-gray-400 transition-colors hover:text-gray-600 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      {...props}
    >
      <FiMenu className="h-4 w-4" />
    </button>
  );
}

// ─── Strategy resolver ───────────────────────────────────────────────────────

function getStrategy(direction: SortableListDirection) {
  if (direction === 'horizontal') return horizontalListSortingStrategy;
  if (direction === 'grid') return rectSortingStrategy;
  return verticalListSortingStrategy;
}

function getWrapperClass(direction: SortableListDirection) {
  if (direction === 'horizontal') return 'flex flex-row gap-3 flex-wrap';
  if (direction === 'grid') return 'grid grid-cols-2 sm:grid-cols-3 gap-3';
  return 'flex flex-col gap-2';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  direction = 'vertical',
  className,
  itemClassName,
  lockAxis = false,
  dragWholeItem = false,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const rawId = useId();
  const dndId = rawId.replace(/:/g, '');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const modifiers =
    lockAxis && direction === 'vertical'
      ? [restrictToVerticalAxis, restrictToParentElement]
      : [restrictToParentElement];

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
    setActiveId(null);
  }

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={getStrategy(direction)}>
        <div className={className ?? getWrapperClass(direction)}>
          {items.map((item) => (
            <SortableItemWrapper
              key={item.id}
              id={item.id}
              dragWholeItem={dragWholeItem}
              itemClassName={itemClassName}
            >
              {(dragHandleProps) => renderItem(item, dragHandleProps)}
            </SortableItemWrapper>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-1 scale-105 shadow-xl ring-2 ring-blue-400 ring-offset-2 rounded-lg opacity-95">
            {renderItem(activeItem, {})}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
