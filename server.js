require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");
// const userRoutes = require("./src/routes/userRoutes");
// const errorHandler = require("./src/middleware/errorHandler");
const allRoutes = require("./src/routes/allRoutes");
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API" });
});

app.use("/api", allRoutes);

// Error handling middleware
// app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
