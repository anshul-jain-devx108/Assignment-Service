require("dotenv").config();
const express = require("express");
const cors = require("cors");
const assignmentRoutes = require("./routes/assignmentRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", assignmentRoutes);

const PORT = process.env.port || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
