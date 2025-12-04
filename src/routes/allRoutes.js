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
router.post("/addColumn/:boardId", addColumn);
router.delete("/deleteColumn/:columnId/:boardId", deleteColumn);
router.post("/createTask/:columnId", createTask);
router.get("/getTasks", getTasks);
router.patch("/updateTask/:taskId/:columnId", updateTask);
router.delete("/deleteTask/:taskId/:columnId", deleteTask);
router.get("/testing", (req, res) =>
  res.json({ message: "Testing in postman" })
);

module.exports = router;
