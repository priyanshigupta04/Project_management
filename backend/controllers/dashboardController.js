const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc  Get dashboard stats
// @route GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    let projectFilter = {};
    let taskFilter = {};

    if (req.user.role !== 'admin') {
      const projects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = projects.map((p) => p._id);
      projectFilter = { _id: { $in: projectIds } };
      taskFilter = { project: { $in: projectIds } };
    }

    const [
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      recentTasks,
    ] = await Promise.all([
      Project.countDocuments(projectFilter),
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      Task.countDocuments({
        ...taskFilter,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.find(taskFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('assignedTo', 'name')
        .populate('project', 'name'),
    ]);

    res.json({
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
