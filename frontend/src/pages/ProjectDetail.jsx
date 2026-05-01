import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─── */
const statusCols = [
  { key: 'todo', label: 'To Do', dot: 'bg-slate-400' },
  { key: 'in-progress', label: 'In Progress', dot: 'bg-amber-400' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-400' },
];

const priorityColors = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
};

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isOverdue = (dueDate, status) =>
  dueDate && status !== 'done' && new Date(dueDate) < new Date();

/* ─── Modal ─── */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-bold text-lg mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
};

/* ─── Task Card ─── */
const TaskCard = ({ task, isAdmin, members, onStatusChange, onDelete, onEdit }) => {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 group transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-violet-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task._id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={priorityColors[task.priority]}>{task.priority}</span>
        {overdue && (
          <span className="bg-red-500/20 text-red-400 text-xs font-medium px-2.5 py-0.5 rounded-full">Overdue</span>
        )}
      </div>

      {task.dueDate && (
        <p className={`text-xs mb-3 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
          Due {formatDate(task.dueDate)}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {task.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">
              {task.assignedTo.name[0].toUpperCase()}
            </div>
            <span className="text-slate-400 text-xs">{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-slate-600 text-xs">Unassigned</span>
        )}

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="text-xs bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/tasks`),
    ])
      .then(([pRes, tRes]) => {
        setProject(pRes.data);
        setTasks(tRes.data);
      })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* status change */
  const handleStatusChange = async (taskId, status) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (e) { console.error(e); }
  };

  /* delete task */
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  /* open edit modal */
  const openEdit = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setShowTaskModal(true);
  };

  /* open create modal */
  const openCreate = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setError('');
    setShowTaskModal(true);
  };

  /* submit task */
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...taskForm,
      assignedTo: taskForm.assignedTo || null,
      dueDate: taskForm.dueDate || null,
    };
    try {
      if (editTask) {
        const { data } = await api.put(`/tasks/${editTask._id}`, payload);
        setTasks((prev) => prev.map((t) => (t._id === editTask._id ? data : t)));
      } else {
        const { data } = await api.post(`/projects/${id}/tasks`, payload);
        setTasks((prev) => [data, ...prev]);
      }
      setShowTaskModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  /* add member */
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(data);
      setMemberEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  /* remove member */
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m._id !== userId) }));
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </button>
          <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
          {project?.description && (
            <p className="text-slate-400 mt-1 text-sm">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => { setShowMemberModal(true); setError(''); }} className="btn-secondary flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Members
              </button>
              <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statusCols.map((col) => {
          const colTasks = tasksByStatus(col.key);
          return (
            <div key={col.key} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-white font-semibold text-sm">{col.label}</span>
                <span className="ml-auto bg-slate-800 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center">
                    <p className="text-slate-600 text-sm">No tasks</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isAdmin={isAdmin}
                      members={project?.members || []}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      onEdit={openEdit}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <Modal
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setError(''); }}
        title={editTask ? 'Edit Task' : 'Add New Task'}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input required className="input" placeholder="Task title"
              value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={2} className="input resize-none" placeholder="Optional description"
              value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Assign to</label>
            <select className="input" value={taskForm.assignedTo}
              onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {project?.members?.map((m) => (
                <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowTaskModal(false); setError(''); }} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Modal */}
      <Modal
        open={showMemberModal}
        onClose={() => { setShowMemberModal(false); setError(''); setMemberEmail(''); }}
        title="Manage Members"
      >
        {/* Add member form */}
        <form onSubmit={handleAddMember} className="flex gap-2 mb-5">
          <input
            required
            type="email"
            className="input flex-1"
            placeholder="Member email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            {saving ? '...' : 'Add'}
          </button>
        </form>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {project?.members?.map((m) => (
            <div key={m._id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold">
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  <p className="text-slate-400 text-xs">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 capitalize bg-slate-700 px-2 py-0.5 rounded-full">{m.role}</span>
                {project.owner._id !== m._id && (
                  <button
                    onClick={() => handleRemoveMember(m._id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
