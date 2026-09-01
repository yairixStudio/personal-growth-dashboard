import { 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot,
  DropResult 
} from '@hello-pangea/dnd';

export interface DraggableItemProps {
  id: string;
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

export interface DroppableProps {
  droppableId: string;
  children: (provided: DroppableProvided) => React.ReactNode;
}

export interface DragDropWrapperProps {
  onDragEnd: (result: DropResult) => void;
  children: React.ReactNode;
} 