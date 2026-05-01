const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc  Get tasks for a project
// @route GET /api/projects/:projectId/tasks
const getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create a task in a project
// @route POST /api/projects/:projectId/tasks
const createTask = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update a task
// @route PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isAssignee)
      return res.status(403).json({ message: 'Not authorized to update this task' });

    if (req.user.role === 'member') {
      // Members can only change status
      if (req.body.status) task.status = req.body.status;
    } else {
      // Admins can change everything
      if (req.body.title) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.status) task.status = req.body.status;
      if (req.body.priority) task.priority = req.body.priority;
      if (req.body.assignedTo !== undefined) task.assignedTo = req.body.assignedTo;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    }

    const updated = await task.save();
    const populated = await Task.findById(updated._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete a task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjectTasks, createTask, updateTask, deleteTask };
