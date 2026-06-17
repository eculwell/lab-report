'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { FiMenu } from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoardItem = {
  id: UniqueIdentifier;
  columnId: UniqueIdentifier;
  [key: string]: unknown;
};

export type BoardColumn<T extends BoardItem> = {
  id: UniqueIdentifier;
  /** Column header content */
  header: ReactNode;
  /** Items currently in this column */
  items: T[];
};

export type DroppableBoardProps<T extends BoardItem> = {
  /** All columns with their items. Manage this state in your parent. */
  columns: BoardColumn<T>[];
  /** Called whenever an item is moved — either reordered within a column or
   *  moved to a different one. Returns the updated columns array. */
  onColumnsChange: (columns: BoardColumn<T>[]) => void;
  /** Render an item's content. Spread `dragHandleProps` onto your handle. */
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLElement>) => ReactNode;
  /** Rendered inside each column below its items (e.g. an "Add card" button). */
  renderColumnFooter?: (column: BoardColumn<T>) => ReactNode;
  /** Extra classes on the outer board flex wrapper. */
  className?: string;
  /** Extra classes on each column container. */
  columnClassName?: string;
  /** Extra classes on each item wrapper div. */
  itemClassName?: string;
  /** If true, the whole item is the drag target — no handle needed. */
  dragWholeItem?: boolean;
};

// ─── Drag handle ──────────────────────────────────────────────────────────────

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

// ─── Droppable column shell ───────────────────────────────────────────────────

type DroppableColumnProps<T extends BoardItem> = {
  column: BoardColumn<T>;
  renderItem: DroppableBoardProps<T>['renderItem'];
  renderColumnFooter?: DroppableBoardProps<T>['renderColumnFooter'];
  columnClassName?: string;
  itemClassName?: string;
  dragWholeItem?: boolean;
  activeId: UniqueIdentifier | null;
};

function DroppableColumn<T extends BoardItem>({
  column,
  renderItem,
  renderColumnFooter,
  columnClassName,
  itemClassName,
  dragWholeItem,
  activeId,
}: DroppableColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={
        columnClassName ??
        `flex flex-col gap-2 rounded-xl border-2 p-3 transition-colors min-h-[120px] ${
          isOver ? 'border-blue-400 bg-blue-50' : 'border-transparent bg-gray-100'
        }`
      }
    >
      <SortableContext
        items={column.items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {column.items.map((item) => (
          <SortableCardWrapper
            key={item.id}
            id={item.id}
            dragWholeItem={dragWholeItem}
            itemClassName={itemClassName}
            isActiveItem={item.id === activeId}
          >
            {(dragHandleProps) => renderItem(item, dragHandleProps)}
          </SortableCardWrapper>
        ))}
      </SortableContext>

      {/* Empty-column drop target — visible when column has no items */}
      {column.items.length === 0 && (
        <div
          className={`flex-1 rounded-lg border-2 border-dashed p-4 text-center text-sm text-gray-400 transition-colors ${
            isOver ? 'border-blue-400 bg-blue-50 text-blue-500' : 'border-gray-300'
          }`}
        >
          Drop here
        </div>
      )}

      {renderColumnFooter && (
        <div className="mt-1">{renderColumnFooter(column)}</div>
      )}
    </div>
  );
}

// ─── Sortable card wrapper ────────────────────────────────────────────────────

type SortableCardWrapperProps = {
  id: UniqueIdentifier;
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => ReactNode;
  dragWholeItem?: boolean;
  itemClassName?: string;
  isActiveItem?: boolean;
};

function SortableCardWrapper({
  id,
  children,
  dragWholeItem,
  itemClassName,
  isActiveItem,
}: SortableCardWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: dragWholeItem ? (isDragging ? 'grabbing' : 'grab') : undefined,
  };

  const wholeItemProps = dragWholeItem ? { ...attributes, ...listeners } : {};
  const dragHandleProps = dragWholeItem ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={itemClassName}
      {...wholeItemProps}
    >
      {children(dragHandleProps)}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find which column contains a given item id. */
function findColumnId<T extends BoardItem>(
  columns: BoardColumn<T>[],
  itemId: UniqueIdentifier,
): UniqueIdentifier | undefined {
  return columns.find((col) => col.items.some((item) => item.id === itemId))?.id;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DroppableBoard<T extends BoardItem>({
  columns,
  onColumnsChange,
  renderItem,
  renderColumnFooter,
  className,
  columnClassName,
  itemClassName,
  dragWholeItem = false,
}: DroppableBoardProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const rawId = useId();
  const dndId = rawId.replace(/:/g, '');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeItem = columns.flatMap((c) => c.items).find((i) => i.id === activeId);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    const activeColId = findColumnId(columns, active.id);
    const overColId =
      columns.find((c) => c.id === over.id)?.id ?? findColumnId(columns, over.id);

    if (!activeColId || !overColId || activeColId === overColId) return;

    onColumnsChange(
      columns.map((col) => {
        if (col.id === activeColId) {
          return { ...col, items: col.items.filter((i) => i.id !== active.id) };
        }
        if (col.id === overColId) {
          const overItemIndex = col.items.findIndex((i) => i.id === over.id);
          const insertAt = overItemIndex >= 0 ? overItemIndex : col.items.length;
          const movedItem = columns
            .find((c) => c.id === activeColId)!
            .items.find((i) => i.id === active.id)!;
          const updated = [...col.items];
          updated.splice(insertAt, 0, { ...movedItem, columnId: overColId });
          return { ...col, items: updated };
        }
        return col;
      }),
    );
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const colId = findColumnId(columns, active.id);
    if (!colId) return;

    onColumnsChange(
      columns.map((col) => {
        if (col.id !== colId) return col;
        const oldIndex = col.items.findIndex((i) => i.id === active.id);
        const newIndex = col.items.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return col;
        return { ...col, items: arrayMove(col.items, oldIndex, newIndex) };
      }),
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={className ?? 'flex gap-4 overflow-x-auto pb-2'}>
        {columns.map((column) => (
          <div key={column.id} className="flex w-72 shrink-0 flex-col gap-2">
            <div>{column.header}</div>
            <DroppableColumn
              column={column}
              renderItem={renderItem}
              renderColumnFooter={renderColumnFooter}
              columnClassName={columnClassName}
              itemClassName={itemClassName}
              dragWholeItem={dragWholeItem}
              activeId={activeId}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-1 scale-[1.03] shadow-2xl ring-2 ring-blue-400 ring-offset-2 rounded-lg opacity-95 pointer-events-none">
            {renderItem(activeItem, {})}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
