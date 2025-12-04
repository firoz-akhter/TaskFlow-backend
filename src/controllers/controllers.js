const { Column, Board } = require("../models/models");
const { v4: uuidv4 } = require("uuid");

// Get all tasks from database
const getTasks = async (req, res) => {
  try {
    const columns = await Column.find();
    const allTodos = [];

    columns.forEach((column) => {
      allTodos.push(...column.todos);
    });

    res.status(200).json({
      success: true,
      count: allTodos.length,
      data: allTodos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a new column to a board
const addColumn = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { columnName } = req.body;

    if (!columnName) {
      return res.status(400).json({
        success: false,
        message: "Column name is required",
      });
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Create new column
    const newColumn = new Column({
      $id: uuidv4(),
      $createdAt: new Date().toISOString(),
      columnName,
      board: boardId,
      todos: [],
    });

    await newColumn.save();

    // Add column reference to board
    board.columns.push(newColumn._id);
    await board.save();

    res.status(201).json({
      success: true,
      message: "Column added successfully",
      data: newColumn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a column from a board
const deleteColumn = async (req, res) => {
  try {
    const { boardId, columnId } = req.params;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    // Check if column has tasks
    if (column.todos.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete column with existing tasks. Please move or delete tasks first.",
      });
    }

    // Remove column reference from board
    board.columns = board.columns.filter((col) => col.toString() !== columnId);
    await board.save();

    // Delete the column
    await Column.findByIdAndDelete(columnId);

    res.status(200).json({
      success: true,
      message: "Column deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, status, description, priority, dueDate, columnId } =
      req.body;

    if (!title || !status || !columnId) {
      return res.status(400).json({
        success: false,
        message: "Title, status, and columnId are required",
      });
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    // Create new task object
    const newTask = {
      $id: uuidv4(),
      $createdAt: new Date().toISOString(),
      title: title.trim(),
      status,
      ...(description && { description }),
      ...(priority && { priority }),
      ...(dueDate && { dueDate }),
    };

    // Add task directly to column
    column.todos.push(newTask);
    await column.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { boardId, taskId } = req.params;
    const { title, status, description, priority, dueDate, columnId } =
      req.body;

    // Find the column containing the task
    const columns = await Column.find({ board: boardId });
    let currentColumn = null;
    let task = null;
    let taskIndex = -1;

    for (let column of columns) {
      taskIndex = column.todos.findIndex((t) => t.$id === taskId);
      if (taskIndex !== -1) {
        currentColumn = column;
        task = column.todos[taskIndex];
        break;
      }
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // If moving to a different column
    if (columnId && columnId !== currentColumn._id.toString()) {
      const newColumn = await Column.findById(columnId);

      if (!newColumn) {
        return res.status(404).json({
          success: false,
          message: "Target column not found",
        });
      }

      // Update task fields
      if (title) task.title = title.trim();
      if (status) task.status = status;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      // Remove from current column
      currentColumn.todos.splice(taskIndex, 1);
      await currentColumn.save();

      // Add to new column
      newColumn.todos.push(task);
      await newColumn.save();
    } else {
      // Update in place
      if (title) task.title = title.trim();
      if (status) task.status = status;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      await currentColumn.save();
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { boardId, taskId } = req.params;

    // Find the column containing the task
    const columns = await Column.find({ board: boardId });
    let deletedTask = null;

    for (let column of columns) {
      const taskIndex = column.todos.findIndex((t) => t.$id === taskId);

      if (taskIndex !== -1) {
        deletedTask = column.todos[taskIndex];
        column.todos.splice(taskIndex, 1);
        await column.save();
        break;
      }
    }

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBoard = async (req, res) => {
  try {
    const { boardName } = req.body;
    console.log({ boardName });

    if (!boardName) {
      return res.status(400).json({
        success: false,
        message: "Board name is required",
      });
    }

    const newBoard = new Board({
      $id: uuidv4(),
      $createdAt: new Date().toISOString(),
      boardName,
      columns: [],
    });

    await newBoard.save();

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      data: newBoard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTasks,
  addColumn,
  deleteColumn,
  createTask,
  updateTask,
  deleteTask,
  createBoard,
};
