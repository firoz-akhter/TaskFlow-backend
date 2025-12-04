const express = require("express");
const router = express.Router();
const {
  getTasks,
  addColumn,
  deleteColumn,
  createTask,
  updateTask,
  deleteTask,
  createBoard,
} = require("../controllers/controllers"); // Adjust path as needed

router.post("/createBoard", createBoard);
router.post("/boards/:boardId/columns", addColumn);
router.delete("/boards/:boardId/columns/:columnId", deleteColumn);
router.get("/tasks", getTasks);
router.post("/boards/:boardId/tasks", createTask);
router.patch("/boards/:boardId/tasks/:taskId", updateTask);
router.delete("/boards/:boardId/tasks/:taskId", deleteTask);
router.get("/testing", (req, res) =>
  res.json({ message: "Testing in postman" })
);

module.exports = router;
