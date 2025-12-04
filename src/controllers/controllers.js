const { Column, Board, Task } = require("../models/models");
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
      boardId: boardId,
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
    const { columnId } = req.params;
    const { title, status, description, priority, dueDate, columnName } =
      req.body;

    // console.log({ columnId, title, status, description, priority, dueDate });
    // return res.send({
    //   columnId,
    //   title,
    //   status,
    //   description,
    //   priority,
    //   dueDate,
    //   columnName,
    // });

    if (!title || !status || !columnId) {
      return res.status(400).json({
        success: false,
        message: "Title, status, and columnId are required",
      });
    }

    // const board = await Board.findById(boardId);

    // if (!board) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Board not found",
    //   });
    // }

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    // Create new task object
    const newTask = new Task({
      $id: uuidv4(),
      $createdAt: new Date().toISOString(),
      title: title.trim(),
      status,
      description,
      priority,
      dueDate,
      columnName,
      columnId,
    });

    // we are saving newTask at two places one as model data and secondly pushing in columns modal
    await newTask.save();

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
    const { taskId, columnId } = req.params;
    const {
      title,
      status,
      description,
      priority,
      dueDate,
      newColumnId,
      newColumnName,
    } = req.body;

    // Find the task in Task collection
    const task = await Task.findOne({ $id: taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in database",
      });
    }

    // Find the current column (from params)
    const currentColumn = await Column.findById(columnId);

    if (!currentColumn) {
      return res.status(404).json({
        success: false,
        message: "Current column not found",
      });
    }

    // Find the task in current column's todos
    const taskIndex = currentColumn.todos.findIndex((t) => t.$id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Task not found in column",
      });
    }

    // Update task fields in Task model
    if (title) task.title = title.trim();
    if (status) task.status = status;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    // If moving to a different column
    if (newColumnId && newColumnId !== columnId) {
      const newColumn = await Column.findById(newColumnId);

      if (!newColumn) {
        return res.status(404).json({
          success: false,
          message: "Target column not found",
        });
      }

      // Update columnId and columnName in Task model
      task.columnId = newColumnId;
      task.columnName = newColumn.columnName;

      // Update the embedded task in current column's todos
      const embeddedTask = currentColumn.todos[taskIndex];
      if (title) embeddedTask.title = title.trim();
      if (status) embeddedTask.status = status;
      if (description !== undefined) embeddedTask.description = description;
      if (priority !== undefined) embeddedTask.priority = priority;
      if (dueDate !== undefined) embeddedTask.dueDate = dueDate;

      // Remove from current column
      currentColumn.todos.splice(taskIndex, 1);
      await currentColumn.save();

      // Add to new column with updated data
      newColumn.todos.push({
        $id: task.$id,
        $createdAt: task.$createdAt,
        title: task.title,
        status: task.status,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        columnName: newColumn.columnName,
        columnId: newColumnId,
      });
      await newColumn.save();
    } else {
      // Update in place (same column)
      const embeddedTask = currentColumn.todos[taskIndex];
      if (title) embeddedTask.title = title.trim();
      if (status) embeddedTask.status = status;
      if (description !== undefined) embeddedTask.description = description;
      if (priority !== undefined) embeddedTask.priority = priority;
      if (dueDate !== undefined) embeddedTask.dueDate = dueDate;

      await currentColumn.save();
    }

    // Save updated Task model
    await task.save();

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
// const deleteTask = async (req, res) => {
//   try {
//     const { columnId, taskId } = req.params;

//     // Find the column containing the task
//     const columns = await Column.find({ board: boardId });
//     let deletedTask = null;

//     for (let column of columns) {
//       const taskIndex = column.todos.findIndex((t) => t.$id === taskId);

//       if (taskIndex !== -1) {
//         deletedTask = column.todos[taskIndex];
//         column.todos.splice(taskIndex, 1);
//         await column.save();
//         break;
//       }
//     }

//     if (!deletedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Task deleted successfully",
//       data: deletedTask,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const deleteTask = async (req, res) => {
  try {
    const { columnId, taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    column.todos = column.todos.filter((col) => col.$id !== taskId);
    await column.save();

    // delete task
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: "task deleted successfully",
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
