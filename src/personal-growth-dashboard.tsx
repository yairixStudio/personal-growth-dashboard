import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Layout, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  Image, 
  Quote,
  Target,
  Heart,
  List,
  Play,
  Video,
  Wand2,
  Star,
  HeartHandshake,
  Focus,
  Pause
} from 'lucide-react';
import { store } from './mock-store';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import MusicPlayer from './components/MusicPlayer';

interface Video {
  title: string;
  url: string;
}

interface Workspace {
  goals: string[];
  values: string[];
  affirmations: string[];
  quotes: string[];
  videos: Video[];
  strengths: string[];
  gratitude: string[];
}

interface Workspaces {
  [key: string]: Workspace;
}

interface WorkspaceSelectorProps {
  workspaces: Workspaces;
  currentWorkspace: string;
  onSwitch: (name: string) => void;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  onReorder: (newWorkspaces: Workspaces) => void;
}

interface ListSectionProps {
  title: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  icon: React.ComponentType<{ className?: string }>;
  isFocusMode: boolean;
  focusedSection: number;
  sectionIndex: number;
  onSectionClick?: () => void;
}

interface VideoSectionProps {
  videos: Video[];
  onUpdate: (videos: Video[]) => void;
  isFocusMode: boolean;
  focusedSection: number;
  sectionIndex: number;
  onSectionClick?: () => void;
}

interface VisionBoardProps {
  isFocusMode: boolean;
  focusedSection: number;
  sectionIndex: number;
  onSectionClick?: () => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ 
  workspaces, currentWorkspace, onSwitch, onAdd, onRename, onDelete, onReorder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);

  const handleRename = (oldName: string, newName: string) => {
    if (newName.trim() && newName !== oldName) {
      onRename(oldName, newName.trim());
      setEditingName(null);
    }
  };

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName);
      setNewName('');
      setIsAdding(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Object.entries(workspaces);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const reorderedWorkspaces = items.reduce<Workspaces>((acc, [name]) => {
      acc[name] = workspaces[name];
      return acc;
    }, {});
    
    onReorder(reorderedWorkspaces);
  };

  return (
    <div 
      className="fixed top-4 left-4 z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-200 ${
          isOpen ? 'w-64' : 'w-40'
        }`}
      >
        <div
          className="w-full p-4 flex items-center justify-between text-gray-800 dark:text-gray-100 
            hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center">
            <Layout className="w-5 h-5 mr-2" />
            <span className="font-bold">Workspaces</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>

        <div 
          className={`overflow-hidden transition-all duration-200 ${
            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="workspaces">
                {(droppableProvided) => (
                  <div 
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    className="space-y-2"
                  >
                    {Object.entries(workspaces).map(([name], index) => (
                      <Draggable 
                        key={name}
                        draggableId={name}
                        index={index}
                      >
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className={`bg-white dark:bg-gray-800 rounded-lg 
                              ${snapshot.isDragging ? 'z-50 shadow-lg ring-2 ring-blue-500' : ''}`}
                            style={draggableProvided.draggableProps.style}
                          >
                            <div className="flex items-center justify-between group">
                              <div className="flex items-center flex-1">
                                <div 
                                  {...draggableProvided.dragHandleProps}
                                  className="px-2 cursor-grab opacity-0 group-hover:opacity-40 hover:opacity-100"
                                >
                                  ⋮⋮
                                </div>
                                <button
                                  onClick={() => onSwitch(name)}
                                  className={`flex-grow text-left px-3 py-2 rounded transition-colors
                                    ${currentWorkspace === name 
                                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                  {editingName === name ? (
                                    <input
                                      type="text"
                                      defaultValue={name}
                                      className="w-full p-1 text-sm border rounded 
                                        dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                          handleRename(name, e.currentTarget.value);
                                        }
                                      }}
                                      autoFocus
                                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleRename(name, e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                    />
                                  ) : (
                                    name
                                  )}
                                </button>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    setEditingName(name);
                                  }}
                                  className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {Object.keys(workspaces).length > 1 && (
                                  <button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      if (confirm('Are you sure you want to delete this workspace?')) {
                                        onDelete(name);
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {isAdding ? (
              <div className="mt-2 flex space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  className="flex-grow p-2 text-sm border rounded 
                    dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="New workspace name"
                />
                <button
                  onClick={handleAdd}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-2 w-full p-2 text-blue-500 dark:text-blue-400 
                  hover:bg-blue-50 dark:hover:bg-blue-900/50
                  rounded flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ListSection: React.FC<ListSectionProps> = ({ 
  title, 
  items, 
  onUpdate, 
  icon: Icon,
  isFocusMode,
  focusedSection,
  sectionIndex,
  onSectionClick
}) => {
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (newItem.trim()) {
      onUpdate([...items, newItem.trim()]);
      setNewItem('');
      setIsAdding(false);
    }
  };

  const handleDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onUpdate(newItems);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    
    onUpdate(newItems);
  };

  const handleEdit = (index: number, text: string) => {
    if (text.trim() && text !== items[index]) {
      const newItems = [...items];
      newItems[index] = text.trim();
      onUpdate(newItems);
    }
    setEditingIndex(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItem(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, index: number): void => {
    handleEdit(index, e.target.value);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number): void => {
    if (e.key === 'Enter') {
      handleEdit(index, e.currentTarget.value);
    }
  };

  const isActive = !isFocusMode || focusedSection === sectionIndex;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 
        ${isFocusMode && focusedSection === sectionIndex
          ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)] dark:shadow-[0_0_15px_rgba(29,78,216,0.5)]'
          : 'shadow-lg'
        } transition-all duration-500
        ${isFocusMode ? 'cursor-pointer' : ''}`}
      onClick={() => isFocusMode && onSectionClick?.()}
    >
      <div className={`${!isActive ? 'pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Icon className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          {isActive && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {isAdding && (
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              value={newItem}
              onChange={handleInputChange}
              className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder={`Add new ${title.toLowerCase()}`}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 text-white rounded"
            >
              Add
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={title}>
            {(droppableProvided) => (
              <ul 
                {...droppableProvided.droppableProps}
                ref={droppableProvided.innerRef}
                className="flex flex-col"
                style={{
                  minHeight: '50px',
                  position: 'relative'
                }}
              >
                {items.map((item, index) => (
                  <Draggable 
                    key={`${title}-${index}`}
                    draggableId={`${title}-${index}`} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`mb-2 last:mb-0 ${snapshot.isDragging ? 'z-50' : ''}`}
                        style={{
                          ...provided.draggableProps.style
                        }}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className={`flex items-center p-3 bg-white dark:bg-gray-800 
                            rounded-lg group relative
                            ${snapshot.isDragging 
                              ? 'shadow-lg ring-2 ring-blue-500' 
                              : 'shadow-sm hover:shadow-md'
                            }
                            transition-all duration-200`}
                        >
                          {editingIndex === index ? (
                            <input
                              type="text"
                              defaultValue={item}
                              autoFocus
                              onBlur={(e) => handleBlur(e, index)}
                              onKeyDown={(e) => handleEditKeyDown(e, index)}
                              className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 px-2"
                            />
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="cursor-grab opacity-0 group-hover:opacity-40 hover:opacity-100 px-2 text-gray-400">
                                  ⋮⋮
                                </div>
                                <div 
                                  className="flex-1 text-gray-800 dark:text-gray-200 cursor-text
                                    hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1
                                    transition-colors truncate"
                                  onClick={() => setEditingIndex(index)}
                                >
                                  {item}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(index)}
                                className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 text-red-500 
                                  hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {droppableProvided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

const VisionBoard: React.FC<VisionBoardProps> = ({
  isFocusMode,
  focusedSection,
  sectionIndex,
  onSectionClick
}) => {
  const isActive = !isFocusMode || focusedSection === sectionIndex;

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 
        ${isFocusMode && focusedSection === sectionIndex
          ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)] dark:shadow-[0_0_15px_rgba(29,78,216,0.5)]'
          : 'shadow-lg'
        } transition-all duration-500
        ${isFocusMode ? 'cursor-pointer' : ''}`}
      onClick={() => isFocusMode && onSectionClick?.()}
    >
      <div className={`${!isActive ? 'pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Image className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vision Board</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg
              hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
              flex items-center justify-center"
            onClick={() => {/* הוסף לוגיקה להוספת תמונה */}}
          >
            <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoSection: React.FC<VideoSectionProps> = ({ 
  videos, 
  onUpdate,
  isFocusMode,
  focusedSection,
  sectionIndex,
  onSectionClick
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVideo, setNewVideo] = useState<Video>({ title: '', url: '' });
  const [selectedVideo, setSelectedVideo] = useState<number>(0);

  const isActive = !isFocusMode || focusedSection === sectionIndex;

  const handleAdd = () => {
    if (newVideo.title.trim() && newVideo.url.trim()) {
      onUpdate([...videos, { ...newVideo }]);
      setNewVideo({ title: '', url: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (index: number) => {
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    onUpdate(newVideos);
    if (selectedVideo >= newVideos.length) {
      setSelectedVideo(Math.max(0, newVideos.length - 1));
    }
  };

  const getEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 
        ${isFocusMode && focusedSection === sectionIndex
          ? 'shadow-[0_0_15px_rgba(59,130,246,0.5)] dark:shadow-[0_0_15px_rgba(29,78,216,0.5)]'
          : 'shadow-lg'
        } transition-all duration-500
        ${isFocusMode ? 'cursor-pointer' : ''}`}
      onClick={() => isFocusMode && onSectionClick?.()}
    >
      <div className={`${!isActive ? 'pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Video className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Inspiring Videos</h2>
          </div>
          {isActive && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {isAdding && (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="Video title"
            />
            <input
              type="text"
              value={newVideo.url}
              onChange={(e) => setNewVideo(prev => ({ ...prev, url: e.target.value }))}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="YouTube URL"
            />
            <button
              onClick={handleAdd}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 text-white rounded"
            >
              Add Video
            </button>
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <iframe
                src={getEmbedUrl(videos[selectedVideo].url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            
            <div className="space-y-2">
              {videos.map((video, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors
                    ${index === selectedVideo 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <button
                    className="flex-grow text-left px-2 text-gray-800 dark:text-gray-200"
                    onClick={() => setSelectedVideo(index)}
                  >
                    {video.title}
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const sampleContent = {
  goals: [
    'Start a morning routine',
    'Read 12 books this year',
    'Learn a new skill',
    'Exercise 3 times a week'
  ],
  values: [
    'Growth',
    'Health',
    'Family',
    'Learning',
    'Creativity'
  ],
  affirmations: [
    'I am constantly growing and improving',
    'I create positive impact in everything I do',
    'I am capable of achieving my dreams',
    'Every challenge is an opportunity to learn'
  ],
  quotes: [
    '"The only way to do great work is to love what you do" - Steve Jobs',
    '"Success is not final, failure is not fatal" - Winston Churchill',
    '"Done is better than perfect" - Mark Zuckerberg',
    '"Start where you are. Use what you have" - Arthur Ashe'
  ],
  videos: [],
  strengths: [
    'Creativity',
    'Persistence',
    'Problem Solving',
    'Adaptability'
  ],
  gratitude: [
    'Supportive family and friends',
    'Good health',
    'Opportunities to learn and grow',
    'Peaceful environment'
  ]
};

const PersonalGrowthDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(store.get('isDarkMode'));
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(store.get('currentWorkspace'));
  const [workspaces, setWorkspaces] = useState<Workspaces>(store.get('workspaces'));
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusDelay, setFocusDelay] = useState(2000);
  const [focusedSection, setFocusedSection] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const sections = [
    { title: 'Goals', icon: Target },
    { title: 'Values', icon: Heart },
    { title: 'Strengths', icon: Star },
    { title: 'Gratitude', icon: HeartHandshake },
    { title: 'Videos', icon: Video },
    { title: 'Affirmations', icon: List },
    { title: 'Vision Board', icon: Image },
    { title: 'Inspirational Quotes', icon: Quote }
  ];

  useEffect(() => {
    if (!isFocusMode || isPaused) return;

    const interval = setInterval(() => {
      setFocusedSection((prev) => (prev + 1) % sections.length);
    }, focusDelay);

    return () => clearInterval(interval);
  }, [isFocusMode, focusDelay, isPaused]);

  const getSectionStyle = (index: number) => {
    if (!isFocusMode) return '';
    
    return index === focusedSection
      ? 'opacity-100 transition-all duration-500'
      : 'opacity-25 blur-[1px] transition-all duration-500';
  };

  const focusControls = (
    <div className="flex items-center gap-2">
      <button
        className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
          ${isFocusMode ? 'text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-gray-500 dark:text-gray-400'}`}
        onClick={() => {
          setIsFocusMode(!isFocusMode);
          setIsPaused(false);
        }}
        title="Focus Mode"
      >
        <Focus className="w-6 h-6" />
      </button>

      {isFocusMode && (
        <>
          <button
            className={`p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              ${isPaused ? 'text-green-500' : 'text-yellow-500'}`}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2">
            <input
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={focusDelay}
              onChange={(e) => setFocusDelay(Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                dark:bg-gray-700"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[3ch]">
              {focusDelay / 1000}s
            </span>
          </div>
        </>
      )}
    </div>
  );

  const saveWorkspaces = (newWorkspaces: Workspaces) => {
    store.set('workspaces', newWorkspaces);
    setWorkspaces(newWorkspaces);
  };

  const saveDarkMode = (mode: boolean) => {
    store.set('isDarkMode', mode);
    setIsDarkMode(mode);
  };

  const saveCurrentWorkspace = (workspace: string) => {
    store.set('currentWorkspace', workspace);
    setCurrentWorkspace(workspace);
  };

  const handleAddWorkspace = (name: string) => {
    if (!workspaces[name]) {
      const newWorkspaces = {
        ...workspaces,
        [name]: {
          goals: [],
          values: [],
          affirmations: [],
          quotes: [],
          videos: [],
          strengths: [],
          gratitude: []
        }
      };
      saveWorkspaces(newWorkspaces);
      saveCurrentWorkspace(name);
    }
  };

  const updateSection = (section: keyof Workspace, newItems: string[] | Video[]) => {
    const newWorkspaces = {
      ...workspaces,
      [currentWorkspace]: {
        ...workspaces[currentWorkspace],
        [section]: newItems
      }
    };
    saveWorkspaces(newWorkspaces);
  };

  const handleRenameWorkspace = (oldName: string, newName: string) => {
    if (!workspaces[newName] && workspaces[oldName]) {
      const newWorkspaces = { ...workspaces };
      newWorkspaces[newName] = newWorkspaces[oldName];
      delete newWorkspaces[oldName];
      saveWorkspaces(newWorkspaces);
      if (currentWorkspace === oldName) {
        saveCurrentWorkspace(newName);
      }
    }
  };

  const handleDeleteWorkspace = (name: string) => {
    if (Object.keys(workspaces).length > 1) {
      const newWorkspaces = { ...workspaces };
      delete newWorkspaces[name];
      saveWorkspaces(newWorkspaces);
      
      if (currentWorkspace === name) {
        const nextWorkspace = Object.keys(newWorkspaces)[0];
        saveCurrentWorkspace(nextWorkspace);
      }
    }
  };

  const fillWithSampleContent = () => {
    const newWorkspaces = {
      ...workspaces,
      [currentWorkspace]: {
        ...workspaces[currentWorkspace],
        ...sampleContent
      }
    };
    saveWorkspaces(newWorkspaces);
  };

  const handleReorderWorkspaces = (newWorkspaces: Workspaces) => {
    saveWorkspaces(newWorkspaces);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSectionClick = (index: number) => {
    if (isFocusMode) {
      setFocusedSection(index);
      setIsPaused(true);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
      <WorkspaceSelector
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitch={setCurrentWorkspace}
        onAdd={handleAddWorkspace}
        onRename={handleRenameWorkspace}
        onDelete={handleDeleteWorkspace}
        onReorder={handleReorderWorkspaces}
      />

      <div className="fixed top-6 right-6 flex space-x-2">
        {focusControls}
        <button
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
            text-purple-500 dark:text-purple-400"
          onClick={fillWithSampleContent}
          title="Fill with sample content"
        >
          <Wand2 className="w-6 h-6" />
        </button>
        <button
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg
            hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => saveDarkMode(!isDarkMode)}
        >
          {isDarkMode 
            ? <Sun className="w-6 h-6 text-yellow-500" />
            : <Moon className="w-6 h-6 text-blue-500" />
          }
        </button>
      </div>

      <div className="text-center mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
          {currentWorkspace}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[2400px] mx-auto mt-8">
        <div className={`transition-all duration-500 ${getSectionStyle(0)}`}>
          <ListSection
            title="Goals"
            items={workspaces[currentWorkspace].goals}
            onUpdate={(newItems) => updateSection('goals', newItems)}
            icon={Target}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={0}
            onSectionClick={() => handleSectionClick(0)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(1)}`}>
          <ListSection
            title="Values"
            items={workspaces[currentWorkspace].values}
            onUpdate={(newItems) => updateSection('values', newItems)}
            icon={Heart}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={1}
            onSectionClick={() => handleSectionClick(1)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(2)}`}>
          <ListSection
            title="Strengths"
            items={workspaces[currentWorkspace].strengths}
            onUpdate={(newItems) => updateSection('strengths', newItems)}
            icon={Star}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={2}
            onSectionClick={() => handleSectionClick(2)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(3)}`}>
          <ListSection
            title="Gratitude"
            items={workspaces[currentWorkspace].gratitude}
            onUpdate={(newItems) => updateSection('gratitude', newItems)}
            icon={HeartHandshake}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={3}
            onSectionClick={() => handleSectionClick(3)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(4)}`}>
          <VideoSection
            videos={workspaces[currentWorkspace].videos}
            onUpdate={(newVideos) => updateSection('videos', newVideos)}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={4}
            onSectionClick={() => handleSectionClick(4)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(5)}`}>
          <ListSection
            title="Affirmations"
            items={workspaces[currentWorkspace].affirmations}
            onUpdate={(newItems) => updateSection('affirmations', newItems)}
            icon={List}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={5}
            onSectionClick={() => handleSectionClick(5)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(6)}`}>
          <VisionBoard 
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={6}
            onSectionClick={() => handleSectionClick(6)}
          />
        </div>
        <div className={`transition-all duration-500 ${getSectionStyle(7)}`}>
          <ListSection
            title="Inspirational Quotes"
            items={workspaces[currentWorkspace].quotes}
            onUpdate={(newItems) => updateSection('quotes', newItems)}
            icon={Quote}
            isFocusMode={isFocusMode}
            focusedSection={focusedSection}
            sectionIndex={7}
            onSectionClick={() => handleSectionClick(7)}
          />
        </div>
      </div>
      <MusicPlayer />
    </div>
  );
};

export default PersonalGrowthDashboard;