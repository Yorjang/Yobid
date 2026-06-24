import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  FolderKanban,
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Flag,
  Layers,
  Send,
  ArrowRight,
  ArrowLeft,
  Search,
  Settings,
  Folder,
  LayoutGrid,
  Shield,
  Zap,
  CheckSquare,
  Users,
  BarChart2,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Link,
  Copy,
  Archive,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { workspacesApi, projectsApi, tasksApi } from '../services/api';

// MOCK DATA INITIALIZATION
const DEFAULT_SPACES = [
  { id: 'space-default', name: "Jeezzy's Workspace", color: '#7c3aed' },
  { id: 'space-emmmore', name: "EMMMORE", color: '#ff6b6b' },
];

const DEFAULT_EPICS = [
  { id: 'epic-1', name: 'Authentication System', description: 'Google, Facebook & X Login integration', color: '#7c3aed' },
  { id: 'epic-2', name: 'Core Storefront', description: 'Product list, Cart & Checkout UI', color: '#10b981' },
];

const DEFAULT_SPRINTS = [
  { id: 'sprint-1', name: 'Sprint 1: Bootstrap & Layout', startDate: '2026-06-20', endDate: '2026-06-27', status: 'active' },
  { id: 'sprint-2', name: 'Sprint 2: Social OAuth', startDate: '2026-06-28', endDate: '2026-07-05', status: 'planned' },
];

const DEFAULT_TASKS = [
  { id: 'task-1', title: 'Setup React Router & Layout', description: 'Install routing, define basic views', priority: 'HIGH', status: 'IN_PROGRESS', epicId: 'epic-1', sprintId: 'sprint-1', deadline: '2026-06-23', spaceId: 'space-default' },
  { id: 'task-2', title: 'Design Landing Page Header', description: 'Create responsive navigation bar', priority: 'MEDIUM', status: 'DONE', epicId: 'epic-2', sprintId: 'sprint-1', deadline: '2026-06-22', spaceId: 'space-default' },
  { id: 'task-3', title: 'Implement Google OAuth Callback', description: 'Extract token and update auth context', priority: 'HIGH', status: 'TODO', epicId: 'epic-1', sprintId: 'sprint-2', deadline: '2026-06-29', spaceId: 'space-default' },
  { id: 'task-4', title: 'Add Cart Drawer Component', description: 'Create local state cart display drawer', priority: 'LOW', status: 'TODO', epicId: 'epic-2', sprintId: '', deadline: '2026-07-10', spaceId: 'space-default' }
];

const DEFAULT_CHAT = [
  { id: 'msg-1', sender: 'Hoang Bang Giang', role: 'Member', text: 'Chào mọi người! Tôi đã setup xong khung giao diện trên Figma.', time: '10:15 AM', avatar: 'H' },
  { id: 'msg-2', sender: 'Project Manager', role: 'Project Manager', text: 'Tuyệt vời Giang! Chúng ta hãy bám sát Backlog để chạy Sprint 1 nhé.', time: '10:20 AM', avatar: 'P' },
];

const BOT_RESPONSES = [
  "Tôi đã ghi nhận ý kiến của bạn! Tôi sẽ cập nhật trạng thái nhiệm vụ tương ứng.",
  "Đúng vậy, chúng ta cần hoàn thiện Sprint này trước cuối tuần.",
  "Để tôi kiểm tra lại backlog xem còn thiếu tính năng nào không nhé.",
  "Báo cáo rất chi tiết! Mọi người có câu hỏi gì cho phần này không?",
  "Cảm ơn bạn đã cập nhật tiến độ công việc!"
];

export default function PlannerBoard(props) {
  const { user } = useAuth();
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const [activeTab, setActiveTab] = useState('list'); // 'chat', 'list', 'board', 'calendar'
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  // Spaces state (ClickUp folders/spaces)
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState('home');
  const [activeMenuSpaceId, setActiveMenuSpaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState(`${userDisplayName}'s Workspace`);

  // Custom Modal States
  const [showDeleteSpaceModal, setShowDeleteSpaceModal] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState(null);

  const [showRenameSpaceModal, setShowRenameSpaceModal] = useState(false);
  const [spaceToRename, setSpaceToRename] = useState(null);
  const [tempSpaceName, setTempSpaceName] = useState('');

  const [showRenameWorkspaceModal, setShowRenameWorkspaceModal] = useState(false);
  const [tempWorkspaceName, setTempWorkspaceName] = useState('');

  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch Workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const wsList = await workspacesApi.list();
        const activeWs = wsList.filter(w => !w.isDeleted);
        if (activeWs.length > 0) {
          setWorkspaces(activeWs);
          const savedWsId = localStorage.getItem('yobid_active_workspace_id');
          const workspaceToSelect = activeWs.find(w => w.id === Number(savedWsId)) || activeWs[0];
          setActiveWorkspaceId(workspaceToSelect.id);
          setWorkspaceName(workspaceToSelect.name);
          localStorage.setItem('yobid_active_workspace_id', workspaceToSelect.id);
        } else {
          // Auto create a default workspace if none exists
          const newWs = await workspacesApi.create({
            name: `${userDisplayName}'s Workspace`,
            slug: `workspace-${Date.now()}`
          });
          setWorkspaces([newWs]);
          setActiveWorkspaceId(newWs.id);
          setWorkspaceName(newWs.name);
          localStorage.setItem('yobid_active_workspace_id', newWs.id);
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, [userDisplayName]);

  // Fetch Projects (Spaces) when activeWorkspaceId changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!activeWorkspaceId) return;
      try {
        setLoading(true);
        const projList = await projectsApi.list(activeWorkspaceId);
        const activeProjs = projList.filter(p => !p.isDeleted);
        const colors = ['#7c3aed', '#ff6b6b', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
        const mapped = activeProjs.map((p, idx) => ({
          id: p.id,
          name: p.name,
          color: colors[idx % colors.length]
        }));
        setSpaces(mapped);

        const savedSpaceId = localStorage.getItem('yobid_active_space') || 'home';
        if (savedSpaceId !== 'home' && mapped.some(s => s.id === Number(savedSpaceId))) {
          setActiveSpaceId(Number(savedSpaceId));
        } else {
          setActiveSpaceId('home');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [activeWorkspaceId]);

  // Fetch Tasks when activeWorkspaceId, spaces, or activeSpaceId changes
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeWorkspaceId) return;
      try {
        if (activeSpaceId === 'home') {
          if (spaces.length === 0) {
            setTasks([]);
            return;
          }
          const promises = spaces.map(s => tasksApi.list({ projectId: s.id }));
          const results = await Promise.all(promises);
          const allTasks = results.flat().filter(t => !t.isDeleted).map(t => ({
            ...t,
            spaceId: t.projectId
          }));
          setTasks(allTasks);
        } else {
          const tList = await tasksApi.list({ projectId: activeSpaceId });
          const activeTasks = tList.filter(t => !t.isDeleted).map(t => ({
            ...t,
            spaceId: t.projectId
          }));
          setTasks(activeTasks);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };
    fetchTasks();
  }, [activeWorkspaceId, activeSpaceId, spaces]);

  const handleRenameWorkspace = () => {
    setTempWorkspaceName(workspaceName);
    setShowRenameWorkspaceModal(true);
  };

  const confirmRenameWorkspace = async (e) => {
    e.preventDefault();
    if (!tempWorkspaceName.trim() || !activeWorkspaceId) return;
    try {
      await workspacesApi.update(activeWorkspaceId, { name: tempWorkspaceName.trim() });
      setWorkspaceName(tempWorkspaceName.trim());
      setWorkspaces(workspaces.map(w => w.id === activeWorkspaceId ? { ...w, name: tempWorkspaceName.trim() } : w));
      setShowRenameWorkspaceModal(false);
    } catch (err) {
      alert(`Error renaming workspace: ${err.message}`);
    }
  };

  // Close space settings dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuSpaceId(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Sync to parent breadcrumbs
  useEffect(() => {
    if (props.onStateChange) {
      if (activeSpaceId === 'home') {
        props.onStateChange('Home', '');
      } else {
        const space = spaces.find(s => s.id === activeSpaceId);
        props.onStateChange(space ? space.name : 'Workspace', activeTab);
      }
    }
  }, [activeSpaceId, activeTab, spaces, props.onStateChange]);

  // States loaded from localStorage or defaults
  const [epics, setEpics] = useState(() => {
    const saved = localStorage.getItem('yobid_epics');
    return saved ? JSON.parse(saved) : DEFAULT_EPICS;
  });
  
  const [sprints, setSprints] = useState(() => {
    const saved = localStorage.getItem('yobid_sprints');
    return saved ? JSON.parse(saved) : DEFAULT_SPRINTS;
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('yobid_chats');
    return saved ? JSON.parse(saved) : DEFAULT_CHAT;
  });

  // Sync active space and non-API states to localStorage
  useEffect(() => {
    localStorage.setItem('yobid_active_space', String(activeSpaceId));
  }, [activeSpaceId]);
  useEffect(() => {
    localStorage.setItem('yobid_epics', JSON.stringify(epics));
  }, [epics]);
  useEffect(() => {
    localStorage.setItem('yobid_sprints', JSON.stringify(sprints));
  }, [sprints]);
  useEffect(() => {
    localStorage.setItem('yobid_chats', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)); // June 2026 (matching mockup date)
  
  // Forms & Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showSpaceModal, setShowSpaceModal] = useState(false);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskEpic, setTaskEpic] = useState('');
  const [taskSprint, setTaskSprint] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('2026-06-23');

  const [epicName, setEpicName] = useState('');
  const [epicDesc, setEpicDesc] = useState('');
  const [epicColor, setEpicColor] = useState('#7c3aed');

  const [sprintName, setSprintName] = useState('');
  const [sprintStart, setSprintStart] = useState('2026-06-23');
  const [sprintEnd, setSprintEnd] = useState('2026-06-30');
  const [sprintStatus, setSprintStatus] = useState('planned');

  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');

  // Chat State
  const [typedMessage, setTypedMessage] = useState('');
  const chatScrollerRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollerRef.current) {
      chatScrollerRef.current.scrollTop = chatScrollerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // Open task modal with preset date/status
  const openNewTaskModal = (presetDate = '2026-06-23', presetStatus = 'TODO') => {
    setTaskDeadline(presetDate);
    setTaskStatus(presetStatus);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskEpic(epics[0]?.id || '');
    setTaskSprint(sprints[0]?.id || '');
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const targetProjectId = activeSpaceId === 'home' ? (spaces[0]?.id) : activeSpaceId;
    if (!targetProjectId) {
      alert('Please select or create a Space before creating a task.');
      return;
    }

    try {
      const createdTask = await tasksApi.create({
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        status: taskStatus,
        projectId: Number(targetProjectId),
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : undefined,
      });

      const newTask = {
        ...createdTask,
        spaceId: createdTask.projectId
      };

      setTasks([...tasks, newTask]);
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  const handleCreateEpic = (e) => {
    e.preventDefault();
    if (!epicName.trim()) return;

    const newEpic = {
      id: `epic-${Date.now()}`,
      name: epicName,
      description: epicDesc,
      color: epicColor
    };

    setEpics([...epics, newEpic]);
    setShowEpicModal(false);
    setEpicName('');
    setEpicDesc('');
  };

  const handleCreateSprint = (e) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: sprintName,
      startDate: sprintStart,
      endDate: sprintEnd,
      status: sprintStatus
    };

    setSprints([...sprints, newSprint]);
    setShowSprintModal(false);
    setSprintName('');
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (!spaceName.trim() || !activeWorkspaceId) return;

    try {
      const newProj = await projectsApi.create({
        name: spaceName.trim(),
        workspaceId: activeWorkspaceId
      });
      const colors = ['#7c3aed', '#ff6b6b', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
      const nextColor = colors[spaces.length % colors.length];
      const newSpace = {
        id: newProj.id,
        name: newProj.name,
        color: nextColor
      };

      setSpaces([...spaces, newSpace]);
      setActiveSpaceId(newProj.id);
      localStorage.setItem('yobid_active_space', String(newProj.id));
      setShowSpaceModal(false);
      setSpaceName('');
    } catch (err) {
      alert(`Error creating space: ${err.message}`);
    }
  };

  const handleDeleteSpace = (spaceId, spaceName, e) => {
    if (e) e.stopPropagation();
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setSpaceToDelete(space);
      setShowDeleteSpaceModal(true);
    }
  };

  const confirmDeleteSpace = async () => {
    if (!spaceToDelete) return;
    const spaceId = spaceToDelete.id;
    try {
      await projectsApi.remove(spaceId);
      setSpaces(spaces.filter(s => s.id !== spaceId));
      setTasks(tasks.filter(t => t.spaceId !== spaceId));
      if (activeSpaceId === spaceId) {
        setActiveSpaceId('home');
        localStorage.setItem('yobid_active_space', 'home');
      }
      setShowDeleteSpaceModal(false);
      setSpaceToDelete(null);
    } catch (err) {
      alert(`Error deleting space: ${err.message}`);
    }
  };

  const handleRenameSpace = (spaceId, currentName) => {
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setSpaceToRename(space);
      setTempSpaceName(currentName);
      setShowRenameSpaceModal(true);
    }
  };

  const confirmRenameSpace = async (e) => {
    e.preventDefault();
    if (!spaceToRename || !tempSpaceName.trim()) return;
    try {
      await projectsApi.update(spaceToRename.id, { name: tempSpaceName.trim() });
      setSpaces(spaces.map(s => s.id === spaceToRename.id ? { ...s, name: tempSpaceName.trim() } : s));
      setShowRenameSpaceModal(false);
      setSpaceToRename(null);
    } catch (err) {
      alert(`Error renaming space: ${err.message}`);
    }
  };

  const handleCycleSpaceColor = (spaceId, currentColor) => {
    const colors = ['#7c3aed', '#ff6b6b', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
    const currentIndex = colors.indexOf(currentColor);
    const nextColor = colors[(currentIndex + 1) % colors.length];
    setSpaces(spaces.map(s => s.id === spaceId ? { ...s, color: nextColor } : s));
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteTaskModal(true);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.remove(taskToDelete.id);
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
    } catch (err) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await tasksApi.update(taskId, { status: newStatus });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const newUserMsg = {
      id: `msg-${Date.now()}`,
      sender: 'Hoang Bang Giang',
      role: 'Member',
      text: typedMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'H'
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setTypedMessage('');

    // Trigger mock response
    setTimeout(() => {
      const botResponse = {
        id: `msg-${Date.now() + 1}`,
        sender: 'Project Manager',
        role: 'Project Manager',
        text: BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'P'
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1200);
  };

  // Calendar Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filtering Tasks by Selected Space
  const filteredTasks = tasks.filter(t => {
    // If the task has no spaceId, default it to space-default
    const taskSpace = t.spaceId || 'space-default';
    return taskSpace === activeSpaceId;
  });

  const activeSpace = activeSpaceId === 'home'
    ? { name: 'Workspace Home', color: '#7c3aed' }
    : (spaces.find(s => s.id === activeSpaceId) || { name: 'Workspace', color: '#7c3aed' });

  // Capitalize Tab names for display
  const tabDisplayLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <div className="planner-layout">
      {/* ─── LEFT WORKSPACE SIDEBAR (CLICKUP STYLE) ─── */}
      <div className="planner-sidebar">
        {/* Workspace Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
          <div
            className="group/ws"
            onClick={handleRenameWorkspace}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0, flex: 1 }}
            title="Rename Workspace"
          >
            <span style={{
              width: '24px', height: '24px',
              backgroundColor: '#7c3aed', color: 'white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', flexShrink: 0
            }}>
              {workspaceName.charAt(0).toUpperCase()}
            </span>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {workspaceName}
            </span>
            <Pencil size={11} className="text-gray-400 opacity-0 group-hover/ws:opacity-100 transition-opacity" style={{ marginLeft: '4px' }} />
          </div>
        </div>

        {/* Workspace Home Section */}
        <div className="mb-4">
          <div
            onClick={() => setActiveSpaceId('home')}
            className={`planner-space-item ${activeSpaceId === 'home' ? 'planner-space-item--active' : ''}`}
            style={{ display: 'flex', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
          >
            <div className="planner-space-link-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.85rem', color: activeSpaceId === 'home' ? '#7c3aed' : '#334155' }}>
              <LayoutGrid size={16} />
              <span>Workspace Home</span>
            </div>
          </div>
        </div>

        <h4 className="planner-sidebar-title flex items-center justify-between">
          <span>Spaces</span>
          <button
            onClick={() => {
              setSpaceName('');
              setShowSpaceModal(true);
            }}
            className="text-gray-400 hover:text-purple-600 cursor-pointer p-0.5 rounded-sm hover:bg-gray-200 transition-colors"
            title="Create Space"
          >
            <Plus size={14} />
          </button>
        </h4>

        {/* Spaces list */}
        <div className="flex-1 space-y-1">
          {spaces.map(space => {
            const isActive = space.id === activeSpaceId;
            return (
              <div key={space.id} style={{ position: 'relative' }}>
                <div
                  onClick={() => setActiveSpaceId(space.id)}
                  className={`planner-space-item ${isActive ? 'planner-space-item--active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div className="planner-space-link-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <span className="planner-space-icon" style={{ backgroundColor: space.color }}>
                      {space.name.charAt(0)}
                    </span>
                    <span className="truncate max-w-[110px]" title={space.name}>{space.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuSpaceId(activeMenuSpaceId === space.id ? null : space.id);
                    }}
                    className={`planner-space-menu-btn ${activeMenuSpaceId === space.id ? 'planner-space-menu-btn--open' : ''}`}
                    title="Space Settings"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>

                {/* Space Dropdown Settings Menu */}
                {activeMenuSpaceId === space.id && (
                  <div
                    className="planner-space-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        handleRenameSpace(space.id, space.name);
                        setActiveMenuSpaceId(null);
                      }}
                      className="planner-space-dropdown-item"
                    >
                      <div className="flex items-center gap-2">
                        <Pencil size={12} className="text-gray-400" />
                        <span>Rename</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleCycleSpaceColor(space.id, space.color);
                      }}
                      className="planner-space-dropdown-item"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: space.color, display: 'inline-block' }} />
                        <span>Color & Icon</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                        setActiveMenuSpaceId(null);
                      }}
                      className="planner-space-dropdown-item"
                    >
                      <div className="flex items-center gap-2">
                        <Link size={12} className="text-gray-400" />
                        <span>Copy link</span>
                      </div>
                    </button>

                    <div className="planner-space-dropdown-divider" />

                    <div className="planner-space-dropdown-header">Actions</div>

                    <button
                      onClick={() => {
                        alert("Space duplicated (mock action).");
                        setActiveMenuSpaceId(null);
                      }}
                      className="planner-space-dropdown-item"
                    >
                      <div className="flex items-center gap-2">
                        <Copy size={12} className="text-gray-400" />
                        <span>Duplicate</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        alert("Space archived (mock action).");
                        setActiveMenuSpaceId(null);
                      }}
                      className="planner-space-dropdown-item"
                    >
                      <div className="flex items-center gap-2">
                        <Archive size={12} className="text-gray-400" />
                        <span>Archive</span>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        handleDeleteSpace(space.id, space.name, e);
                        setActiveMenuSpaceId(null);
                      }}
                      className="planner-space-dropdown-item planner-space-dropdown-item--danger"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </div>
                    </button>
                  </div>
                )}
                
                {/* Under active space, show children just like in ClickUp */}
                {isActive && (
                  <div className="pl-6 pr-2 py-1 space-y-1 border-l border-gray-200 ml-4 mt-0.5 mb-1.5 text-[11px] text-gray-500 font-semibold">
                    <div
                      onClick={() => setActiveTab('list')}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer ${activeTab === 'list' ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                      <ListIcon size={11} /> List
                    </div>
                    <div
                      onClick={() => setActiveTab('board')}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer ${activeTab === 'board' ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                      <FolderKanban size={11} /> Board
                    </div>
                    <div
                      onClick={() => setActiveTab('calendar')}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer ${activeTab === 'calendar' ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                      <CalendarIcon size={11} /> Calendar
                    </div>
                    <div
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer ${activeTab === 'chat' ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 hover:text-gray-800'}`}
                    >
                      <MessageSquare size={11} /> Chat
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Plus button at bottom of sidebar list */}
        <button
          onClick={() => {
            setSpaceName('');
            setShowSpaceModal(true);
          }}
          className="w-full mt-4 py-2 hover:bg-gray-200/50 text-gray-400 hover:text-gray-700 rounded-lg text-[10px] font-bold transition-colors border border-dashed border-gray-300 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus size={12} />
          New Space
        </button>
      </div>

      {/* ─── RIGHT MAIN SPACE CONTAINER ─── */}
      <div className="planner-main-content">
        
        {/* CLICKUP STYLED TOP HEADER PATH */}
        {activeSpaceId !== 'home' ? (
          <div className="planner-header">
            <div className="planner-workspace-title-row">
              {/* ClickUp Dynamic Path Name: Space / View Tab */}
              <div className="flex items-center gap-2">
                <span className="planner-space-icon" style={{ backgroundColor: activeSpace.color, width: 22, height: 22, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontWeight: 'bold', fontSize: 11 }}>
                  {activeSpace.name.charAt(0)}
                </span>
                <span className="font-bold text-gray-800 text-sm tracking-tight">{activeSpace.name}</span>
                <span className="text-gray-400 font-medium text-xs">/</span>
                <span className="text-gray-500 font-semibold text-xs flex items-center gap-1">
                  {activeTab === 'chat' && <MessageSquare size={12} />}
                  {activeTab === 'list' && <ListIcon size={12} />}
                  {activeTab === 'board' && <FolderKanban size={12} />}
                  {activeTab === 'calendar' && <CalendarIcon size={12} />}
                  {tabDisplayLabel}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">H</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">P</div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">A</div>
                </div>
                <button
                  onClick={() => openNewTaskModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus size={13} />
                  Task
                </button>
              </div>
            </div>

            {/* VIEW TABS SELECTOR */}
            <div className="planner-tab-row">
              <button
                onClick={() => setActiveTab('chat')}
                className={`planner-tab-btn ${activeTab === 'chat' ? 'planner-tab-btn--active' : ''}`}
              >
                <MessageSquare size={14} />
                Chat
              </button>

              <button
                onClick={() => setActiveTab('list')}
                className={`planner-tab-btn ${activeTab === 'list' ? 'planner-tab-btn--active' : ''}`}
              >
                <ListIcon size={14} />
                List
              </button>

              <button
                onClick={() => setActiveTab('board')}
                className={`planner-tab-btn ${activeTab === 'board' ? 'planner-tab-btn--active' : ''}`}
              >
                <FolderKanban size={14} />
                Board
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`planner-tab-btn ${activeTab === 'calendar' ? 'planner-tab-btn--active' : ''}`}
              >
                <CalendarIcon size={14} />
                Calendar
              </button>
            </div>
          </div>
        ) : (
          <div className="planner-header" style={{ paddingBottom: '0.75rem' }}>
            <div className="planner-workspace-title-row">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-purple-600" />
                <span className="font-bold text-gray-800 text-base tracking-tight">Workspace Home</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── ACTIVE VIEW PORT ─── */}
        <div className="planner-content-area">
          
          {/* ==========================================
             TAB: CHAT VIEW
             ========================================== */}
          {/* ==========================================
             VIEW: WORKSPACE HOME
             ========================================== */}
          {activeSpaceId === 'home' && (
            <div className="space-y-6 w-full" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Welcome Section */}
              <div className="dash-welcome" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4c1d95 100%)', borderRadius: '16px', padding: '1.75rem 2rem', color: '#fff', boxShadow: '0 8px 28px rgba(109,40,217,0.28)' }}>
                <div className="dash-welcome-text">
                  <h1 className="dash-welcome-title" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                    {greeting}, {userDisplayName}! 👋
                  </h1>
                  <p className="dash-welcome-subtitle" style={{ fontSize: '0.875rem', color: 'rgba(233, 213, 255, 0.85)', margin: 0 }}>
                    Welcome back! Here's an overview of your active tasks and spaces.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: '999px', fontSize: 12, fontWeight: 600,
                    color: '#06b6d4', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                  }}>
                    <Shield size={12} />
                    Active Member
                  </span>
                  <div className="dash-welcome-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '99px', fontSize: '11px' }}>
                    <Zap size={14} className="text-yellow-300" />
                    <span>ClickUp Enabled</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="dash-stat-card" style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="dash-stat-icon" style={{ width: '40px', height: '40px', borderRadius: '8px', color: '#7c3aed', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={20} />
                  </div>
                  <div className="dash-stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="dash-stat-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tasks Completed</span>
                    <span className="dash-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                      {tasks.filter(t => t.status === 'DONE').length}
                    </span>
                  </div>
                </div>

                <div className="dash-stat-card" style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="dash-stat-icon" style={{ width: '40px', height: '40px', borderRadius: '8px', color: '#06b6d4', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                  <div className="dash-stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="dash-stat-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Spaces</span>
                    <span className="dash-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                      {spaces.length}
                    </span>
                  </div>
                </div>

                <div className="dash-stat-card" style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="dash-stat-icon" style={{ width: '40px', height: '40px', borderRadius: '8px', color: '#10b981', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart2 size={20} />
                  </div>
                  <div className="dash-stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="dash-stat-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Tasks</span>
                    <span className="dash-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                      {tasks.filter(t => t.status !== 'DONE').length}
                    </span>
                  </div>
                </div>

                <div className="dash-stat-card" style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="dash-stat-icon" style={{ width: '40px', height: '40px', borderRadius: '8px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div className="dash-stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="dash-stat-label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Task Success Rate</span>
                    <span className="dash-stat-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                      {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* All Workspace Tasks Table */}
              <div className="planner-list-group" style={{ margin: 0 }}>
                <div className="planner-list-header flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">All Tasks Overview</span>
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-200 px-2 py-0.5 rounded-sm" style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{tasks.length} total</span>
                  </div>
                  <button
                    onClick={() => openNewTaskModal()}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 700 }}
                  >
                    + Create Task
                  </button>
                </div>
                <div className="divide-y divide-gray-150" style={{ display: 'flex', flexDirection: 'column' }}>
                  {tasks.map(task => {
                    const space = spaces.find(s => s.id === task.spaceId);
                    return (
                      <div key={task.id} className="planner-list-row group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={task.status === 'DONE'}
                            onChange={() => handleUpdateTaskStatus(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                            className="w-4 h-4 rounded-sm border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <span className={`text-xs font-bold text-gray-800 ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1" style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>{task.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {/* Space badge */}
                          <span
                            onClick={() => space && setActiveSpaceId(space.id)}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-sm hover:underline cursor-pointer"
                            style={{ backgroundColor: `${space?.color || '#cbd5e1'}15`, color: space?.color || '#475569', border: `1px solid ${space?.color || '#cbd5e1'}25`, padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}
                          >
                            {space?.name || 'Default Space'}
                          </span>

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 ${
                            task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                            <Flag size={8} />
                            {task.priority}
                          </span>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                            task.status === 'TODO' ? 'bg-gray-100 text-gray-600' : task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                            {task.status === 'TODO' ? 'TO DO' : task.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'DONE'}
                          </span>

                          {task.deadline && (
                            <span className="text-[9px] text-gray-500 font-medium" style={{ fontSize: '9px', color: '#64748b' }}>
                              {task.deadline}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                            title="Delete task"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}
                          >
                            <Trash2 size={13} className="hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {tasks.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-400">No tasks created yet. Click "+ Create Task" or select a Space to get started!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSpaceId !== 'home' && activeTab === 'chat' && (
            <div className="flex flex-col flex-1 h-full min-h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Discussion - {activeSpace.name}
                </span>
                <span className="text-[10px] text-gray-400">2 members online</span>
              </div>

              <div ref={chatScrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => {
                  const isSelf = msg.sender === 'Hoang Bang Giang';
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 max-w-[80%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-3xs flex-shrink-0 ${
                        isSelf ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {msg.avatar}
                      </div>
                      <div>
                        <div className={`flex items-baseline gap-1.5 ${isSelf ? 'justify-end' : ''}`}>
                          <span className="text-xs font-bold text-gray-800">{msg.sender}</span>
                          <span className="text-[9px] text-gray-400">{msg.time}</span>
                        </div>
                        <div className={`mt-1 p-3 rounded-2xl text-xs leading-relaxed shadow-3xs border ${
                          isSelf 
                            ? 'bg-purple-600 text-white border-purple-600 rounded-tr-none' 
                            : 'bg-gray-100 text-gray-700 border-gray-200 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-gray-150 flex items-center gap-2 bg-gray-50">
                <input
                  type="text"
                  placeholder={`Message #discussion in ${activeSpace.name}...`}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* ==========================================
             TAB: LIST VIEW
             ========================================== */}
          {activeSpaceId !== 'home' && activeTab === 'list' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowEpicModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    + Epic
                  </button>
                  <button
                    onClick={() => setShowSprintModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    + Sprint
                  </button>
                </div>

                <button
                  onClick={() => openNewTaskModal()}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  <Plus size={12} />
                  Create task
                </button>
              </div>

              {/* Lists by status */}
              {['TODO', 'IN_PROGRESS', 'DONE'].map(statusVal => {
                const statusTasks = filteredTasks.filter(t => t.status === statusVal);
                const headerColors = {
                  TODO: 'bg-gray-400 text-white',
                  IN_PROGRESS: 'bg-amber-500 text-white',
                  DONE: 'bg-emerald-500 text-white'
                };
                const labelText = {
                  TODO: 'TO DO',
                  IN_PROGRESS: 'IN PROGRESS',
                  DONE: 'DONE'
                };

                return (
                  <div key={statusVal} className="planner-list-group">
                    <div className="planner-list-header flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${headerColors[statusVal]}`}>
                          {labelText[statusVal]}
                        </span>
                        <span className="text-[11px] text-gray-400 font-bold">{statusTasks.length} tasks</span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-150">
                      {statusTasks.map(task => {
                        const epic = epics.find(e => e.id === task.epicId);
                        return (
                          <div key={task.id} className="planner-list-row group">
                            <div className="flex items-center gap-3 min-w-[280px]">
                              <input
                                type="checkbox"
                                checked={task.status === 'DONE'}
                                onChange={() => handleUpdateTaskStatus(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                                className="w-4 h-4 rounded-sm border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                              <div>
                                <span className={`text-xs font-bold text-gray-800 ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
                                  {task.title}
                                </span>
                                {task.description && (
                                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {epic && (
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-sm"
                                  style={{ backgroundColor: `${epic.color}15`, color: epic.color, border: `1px solid ${epic.color}25` }}
                                >
                                  {epic.name}
                                </span>
                              )}

                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 ${
                                task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                <Flag size={8} />
                                {task.priority}
                              </span>

                              {task.deadline && (
                                <span className="text-[9px] text-gray-500 font-medium">
                                  {task.deadline}
                                </span>
                              )}

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                                title="Delete task"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {statusTasks.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">No tasks in this status group.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==========================================
             TAB: BOARD VIEW (KANBAN)
             ========================================== */}
          {activeSpaceId !== 'home' && activeTab === 'board' && (
            <div className="planner-kanban-grid">
              {['TODO', 'IN_PROGRESS', 'DONE'].map(statusVal => {
                const statusTasks = filteredTasks.filter(t => t.status === statusVal);
                const colHeaders = {
                  TODO: { label: 'To Do', border: 'border-t-4 border-t-gray-400', countBg: 'bg-gray-100 text-gray-600' },
                  IN_PROGRESS: { label: 'In Progress', border: 'border-t-4 border-t-amber-500', countBg: 'bg-amber-50 text-amber-700' },
                  DONE: { label: 'Done', border: 'border-t-4 border-t-emerald-500', countBg: 'bg-emerald-50 text-emerald-700' }
                };

                return (
                  <div key={statusVal} className="planner-kanban-col" style={{ borderTop: statusVal === 'TODO' ? '4px solid #94a3b8' : statusVal === 'IN_PROGRESS' ? '4px solid #f59e0b' : '4px solid #10b981' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{colHeaders[statusVal].label}</span>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${colHeaders[statusVal].countBg}`}>
                        {statusTasks.length}
                      </span>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                      {statusTasks.map(task => {
                        const epic = epics.find(e => e.id === task.epicId);
                        return (
                          <div key={task.id} className="planner-kanban-card group">
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>

                            {epic && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm inline-block self-start" style={{ backgroundColor: `${epic.color}15`, color: epic.color }}>
                                {epic.name}
                              </span>
                            )}

                            <div>
                              <h5 className="text-xs font-bold text-gray-800 leading-tight pr-4">{task.title}</h5>
                              {task.description && <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-2.5 mt-1">
                              <div className="flex gap-1">
                                {statusVal !== 'TODO' && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, statusVal === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
                                    className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-md cursor-pointer"
                                    title="Move Left"
                                  >
                                    <ArrowLeft size={12} />
                                  </button>
                                )}
                                {statusVal !== 'DONE' && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task.id, statusVal === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                                    className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-md cursor-pointer"
                                    title="Move Right"
                                  >
                                    <ArrowRight size={12} />
                                  </button>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{task.priority}</span>
                            </div>
                          </div>
                        );
                      })}

                      {statusTasks.length === 0 && (
                        <div className="h-full flex items-center justify-center p-6 border border-dashed border-gray-300 rounded-xl">
                          <span className="text-xs text-gray-400">No tasks</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openNewTaskModal('2026-06-23', statusVal)}
                      className="w-full mt-4 py-2 hover:bg-gray-200/50 text-gray-500 hover:text-gray-800 rounded-lg text-xs font-bold transition-colors border border-dashed border-gray-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={12} />
                      Add task
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==========================================
             TAB: CALENDAR VIEW
             ========================================== */}
          {activeSpaceId !== 'home' && activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevMonth}
                    className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-bold text-gray-800 text-base">
                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="w-9 h-9 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  💡 Double click or click on any date cell to quickly add a deadline task!
                </span>
              </div>

              <div className="planner-calendar-grid bg-gray-200">
                <div className="grid grid-cols-7 bg-gray-100 text-center py-3 border-b border-gray-200 col-span-7">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <span key={day} className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {day}
                    </span>
                  ))}
                </div>

                {(() => {
                  const daysInMonth = getDaysInMonth(currentDate);
                  const firstDay = getFirstDayOfMonth(currentDate);
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();

                  const cells = [];

                  for (let i = 0; i < firstDay; i++) {
                    cells.push(
                      <div key={`empty-${i}`} className="bg-gray-50/50 p-2 text-gray-400 select-none"></div>
                    );
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = day === 23 && month === 5 && year === 2026;
                    
                    const dayTasks = filteredTasks.filter(t => t.deadline === dayStr);

                  cells.push(
                    <div
                      key={`day-${day}`}
                      onClick={() => openNewTaskModal(dayStr)}
                      className="planner-calendar-cell hover:bg-purple-50/30 transition-colors cursor-pointer group relative"
                      style={{ backgroundColor: isToday ? '#fffbeb' : '#ffffff' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-800'
                        }`}>
                          {day}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-md">
                          + Add
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 overflow-y-auto max-h-[75px] mt-1.5 pr-1">
                        {dayTasks.map(t => {
                          const epic = epics.find(e => e.id === t.epicId);
                          const dotColor = epic ? epic.color : '#9ca3af';

                          return (
                            <div
                              key={t.id}
                              onClick={(e) => { e.stopPropagation(); }}
                              className="text-[10px] px-2 py-1 rounded-md border border-gray-100 flex items-center gap-1.5 truncate font-medium text-gray-700 bg-white hover:border-gray-300 shadow-3xs"
                              title={`${t.title} [${t.priority}]`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }}></span>
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return cells;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ==========================================
         1. TASK CREATION MODAL
         ========================================== */}
      {showTaskModal && (
        <div className="planner-modal-backdrop">
          <div className="planner-modal-card">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <ListIcon className="text-purple-600" size={18} />
              Create New Task
            </h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add product lists"
                  className="planner-modal-input"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Description</label>
                <textarea
                  placeholder="Provide a brief task description..."
                  rows={3}
                  className="planner-modal-input resize-none"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="planner-modal-field">
                  <label className="planner-modal-label">Priority</label>
                  <select
                    className="planner-modal-input"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="HIGH">🔴 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🔵 Low</option>
                  </select>
                </div>
                <div className="planner-modal-field">
                  <label className="planner-modal-label">Status</label>
                  <select
                    className="planner-modal-input"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="planner-modal-field">
                  <label className="planner-modal-label">Associate Epic</label>
                  <select
                    className="planner-modal-input"
                    value={taskEpic}
                    onChange={(e) => setTaskEpic(e.target.value)}
                  >
                    <option value="">No Epic</option>
                    {epics.map(epic => (
                      <option key={epic.id} value={epic.id}>{epic.name}</option>
                    ))}
                  </select>
                </div>
                <div className="planner-modal-field">
                  <label className="planner-modal-label">Associate Sprint</label>
                  <select
                    className="planner-modal-input"
                    value={taskSprint}
                    onChange={(e) => setTaskSprint(e.target.value)}
                  >
                    <option value="">Backlog Only</option>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Deadline Date</label>
                <input
                  type="date"
                  className="planner-modal-input"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                />
              </div>

              <div className="planner-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
         2. EPIC CREATION MODAL
         ========================================== */}
      {showEpicModal && (
        <div className="planner-modal-backdrop">
          <div className="planner-modal-card">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layers className="text-purple-600" size={18} />
              Add New Epic
            </h3>
            
            <form onSubmit={handleCreateEpic} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Epic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment Integration"
                  className="planner-modal-input"
                  value={epicName}
                  onChange={(e) => setEpicName(e.target.value)}
                />
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Description</label>
                <textarea
                  placeholder="What scope does this Epic cover?"
                  rows={2}
                  className="planner-modal-input resize-none"
                  value={epicDesc}
                  onChange={(e) => setEpicDesc(e.target.value)}
                />
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Label Color</label>
                <div className="flex items-center gap-2">
                  {['#7c3aed', '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEpicColor(c)}
                      className={`w-7 h-7 rounded-full border cursor-pointer relative transition-transform ${
                        epicColor === c ? 'scale-110 border-black ring-2 ring-purple-100' : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {epicColor === c && <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="planner-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEpicModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Add Epic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
         3. SPRINT CREATION MODAL
         ========================================== */}
      {showSprintModal && (
        <div className="planner-modal-backdrop">
          <div className="planner-modal-card">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Clock className="text-purple-600" size={18} />
              Add New Sprint
            </h3>
            
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Sprint Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 3: Database setup"
                  className="planner-modal-input"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="planner-modal-field">
                  <label className="planner-modal-label">Start Date</label>
                  <input
                    type="date"
                    className="planner-modal-input"
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                  />
                </div>
                <div className="planner-modal-field">
                  <label className="planner-modal-label">End Date</label>
                  <input
                    type="date"
                    className="planner-modal-input"
                    value={sprintEnd}
                    onChange={(e) => setSprintEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Initial Status</label>
                <select
                  className="planner-modal-input"
                  value={sprintStatus}
                  onChange={(e) => setSprintStatus(e.target.value)}
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="planner-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSprintModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Add Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
         4. SPACE CREATION MODAL (NEW)
         ========================================== */}
      {showSpaceModal && (
        <div className="planner-modal-backdrop">
          <div className="planner-modal-card">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Folder className="text-purple-600" size={18} />
              Create New Space
            </h3>
            
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Space Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMMMORE, Project Alpha"
                  className="planner-modal-input"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                />
              </div>

              <div className="planner-modal-field">
                <label className="planner-modal-label">Space Color Icon</label>
                <div className="flex items-center gap-2">
                  {['#7c3aed', '#ff6b6b', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSpaceColor(c)}
                      className={`w-7 h-7 rounded-full border cursor-pointer relative transition-transform ${
                        spaceColor === c ? 'scale-110 border-black ring-2 ring-purple-100' : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {spaceColor === c && <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="planner-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSpaceModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE SPACE MODAL */}
      {showDeleteSpaceModal && spaceToDelete && (
        <div className="planner-modal-backdrop" onClick={() => setShowDeleteSpaceModal(false)}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Trash2 className="text-red-500" size={18} />
              Delete Space
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed" style={{ margin: '8px 0', textAlign: 'left' }}>
              Are you sure you want to delete the space <strong style={{ color: spaceToDelete.color }}>"{spaceToDelete.name}"</strong>? This will permanently remove all tasks and data inside this space. This action cannot be undone.
            </p>

            <div className="planner-modal-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteSpaceModal(false)}
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                style={{ border: 'none', background: 'none' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSpace}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                style={{ border: 'none', color: '#fff', backgroundColor: '#dc2626' }}
              >
                Delete Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. RENAME SPACE MODAL */}
      {showRenameSpaceModal && spaceToRename && (
        <div className="planner-modal-backdrop" onClick={() => setShowRenameSpaceModal(false)}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Pencil className="text-purple-600" size={18} />
              Rename Space
            </h3>
            
            <form onSubmit={confirmRenameSpace} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Space Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Project Name"
                  className="planner-modal-input"
                  value={tempSpaceName}
                  onChange={(e) => setTempSpaceName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="planner-modal-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRenameSpaceModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                  style={{ border: 'none', background: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. RENAME WORKSPACE MODAL */}
      {showRenameWorkspaceModal && (
        <div className="planner-modal-backdrop" onClick={() => setShowRenameWorkspaceModal(false)}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Pencil className="text-purple-600" size={18} />
              Rename Workspace
            </h3>
            
            <form onSubmit={confirmRenameWorkspace} className="space-y-4">
              <div className="planner-modal-field">
                <label className="planner-modal-label">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Awesome Team"
                  className="planner-modal-input"
                  value={tempWorkspaceName}
                  onChange={(e) => setTempWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="planner-modal-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRenameWorkspaceModal(false)}
                  className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                  style={{ border: 'none', background: 'none' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DELETE TASK MODAL */}
      {showDeleteTaskModal && taskToDelete && (
        <div className="planner-modal-backdrop" onClick={() => setShowDeleteTaskModal(false)}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1.5 border-b border-gray-100 pb-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <Trash2 className="text-red-500" size={18} />
              Delete Task
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed" style={{ margin: '8px 0', textAlign: 'left' }}>
              Are you sure you want to delete the task <strong>"{taskToDelete.title}"</strong>? This action cannot be undone.
            </p>

            <div className="planner-modal-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteTaskModal(false)}
                className="px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl cursor-pointer"
                style={{ border: 'none', background: 'none' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-sm"
                style={{ border: 'none', color: '#fff', backgroundColor: '#dc2626' }}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
