const express = require("express");
const { createAssignment, approveAssignment, getAssignmentsByClassroom } = require("../controllers/assignmentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/assignments", authMiddleware, createAssignment);
// router.put("/assignments/:id/approve", authMiddleware, approveAssignment);
router.get("/assignments/classroom/:classroomId", authMiddleware, getAssignmentsByClassroom);

module.exports = router;
