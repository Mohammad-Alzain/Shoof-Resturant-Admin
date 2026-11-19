import React, { useContext } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TableFilterContext } from "../../Context/TableFilterProvider";

interface SortableWrapperProps {
  children: React.ReactNode;
  allowReorder?: boolean;
  reorderQuery?: any;
}

export function SortableWrapper({
  children,
  allowReorder,
  reorderQuery,
}: SortableWrapperProps) {
  const { tableSetting, refetch } = useContext(TableFilterContext);
  const items = tableSetting?.data || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const mutation = reorderQuery ? reorderQuery() : null;

  if (!allowReorder || !items || items.length === 0) {
    return <>{children}</>;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item: any) => item.id === active.id);
      const newIndex = items.findIndex((item: any) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Submit array to API mapping the new sorting arrangement
      if (mutation) {
        mutation.mutate(
          newItems.map((item: any, index: number) => ({
            ...item,
            sort_index: index + 1,
          })),
          {
            onSuccess: () => {
              refetch();
            },
          },
        );
      }
    }
  };

  const itemIds = items.map((item: any) => item.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
