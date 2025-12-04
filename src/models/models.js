const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  $id: {
    type: String,
    required: true,
    unique: true,
  },
  $createdAt: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  priority: {
    type: String,
    required: false,
  },
  dueDate: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
  },
  columnName: {
    type: String,
    required: true,
  },
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Column",
    required: true,
  },
});

// Column Schema
const columnSchema = new mongoose.Schema({
  $id: {
    type: String,
    required: true,
    unique: true,
  },
  $createdAt: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
  },
  columnName: {
    type: String,
    required: true,
  },
  todos: [taskSchema],
});

// Board Schema
const boardSchema = new mongoose.Schema(
  {
    $id: {
      type: String,
      required: true,
      unique: true,
    },
    columns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Column" }],
  },
  {
    timestamps: true,
  }
);

// Models
// const Task = mongoose.model("Task", todoSchema);
const Board = mongoose.model("Board", boardSchema);
const Column = mongoose.model("Column", columnSchema);

module.exports = { Board, Column };
