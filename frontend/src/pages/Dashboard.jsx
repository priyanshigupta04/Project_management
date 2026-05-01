import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="card hover:border-slate-700 transition-all duration-200 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
    </div>
  </div>
);

const statusBadge = (status) => {
  if (status === 'done') return <span className="badge-done">Done</span>;
  if (status === 'in-progress') return <span className="badge-in-progress">In Progress</span>;
  return <span className="badge-todo">To Do</span>;
};

const priorityBadge = (p) => {
  if (p === 'high') return <span className="badge-high">High</span>;
  if (p === 'low') return <span className="badge-low">Low</span>;
  return <span className="badge-medium">Medium</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()},{' '}
          <span className="text-violet-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Projects"
          value={stats?.totalProjects ?? 0}
          color="bg-violet-500/20 text-violet-400"
          icon={<ProjectIcon />}
        />
        <StatCard
          label="Total Tasks"
          value={stats?.totalTasks ?? 0}
          color="bg-sky-500/20 text-sky-400"
          icon={<TaskIcon />}
        />
        <StatCard
          label="To Do"
          value={stats?.todoTasks ?? 0}
          color="bg-slate-600/30 text-slate-400"
          icon={<TodoIcon />}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressTasks ?? 0}
          color="bg-amber-500/20 text-amber-400"
          icon={<ProgressIcon />}
        />
        <StatCard
          label="Completed"
          value={stats?.doneTasks ?? 0}
          color="bg-emerald-500/20 text-emerald-400"
          icon={<DoneIcon />}
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueTasks ?? 0}
          color="bg-red-500/20 text-red-400"
          icon={<OverdueIcon />}
          sub={stats?.overdueTasks > 0 ? 'Needs attention' : 'All on track'}
        />
      </div>

      {/* Task completion bar */}
      {stats?.totalTasks > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Overall Progress</h2>
            <span className="text-violet-400 font-semibold text-sm">
              {Math.round((stats.doneTasks / stats.totalTasks) * 100)}% complete
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${(stats.doneTasks / stats.totalTasks) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{stats.doneTasks} done</span>
            <span>{stats.totalTasks - stats.doneTasks} remaining</span>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Recent Tasks</h2>
          <Link to="/projects" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
            View all →
          </Link>
        </div>

        {!stats?.recentTasks?.length ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <TaskIcon className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">No tasks yet.</p>
            <Link to="/projects" className="text-violet-400 hover:text-violet-300 text-sm mt-1 inline-block">
              Go to Projects
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stats.recentTasks.map((task) => (
              <Link 
                to={`/projects/${task.project?._id}`} 
                key={task._id} 
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate group-hover:text-violet-400 transition-colors">{task.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {task.project?.name} {task.assignedTo ? `· ${task.assignedTo.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {priorityBadge(task.priority)}
                  {statusBadge(task.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

const ProjectIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
const TaskIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const TodoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const ProgressIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const DoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const OverdueIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default Dashboard;
