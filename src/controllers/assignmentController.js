
const AssignmentModel = require("../models/assignmentModel");
const { generateAssignment } = require("../services/aiService");
// const { createGoogleDoc } = require("../services/googleDocsService");
const { sendEmailUsingGmail } = require("../services/emailService");
const { addCalendarEvent } = require("../services/googleCalendarService");
const ClassroomModel = require("../models/classroomModel"); // ✅ Import ClassroomModel
const { google } = require("googleapis");
const drive = google.drive("v3");
const axios = require("axios"); // ✅ Import axios
const { createGoogleDoc, shareGoogleDoc } = require("../services/googleDocsService");
const { db } = require("../config/firebaseConfig");
const { marked } = require("marked"); // Install with `npm install marked`
const { convertAssignmentJsonToMarkdown, generateFormattedDocument } = require("../services/jsonToMarkdownConverter"); // merged function file

async function createAssignment(req, res) {
    try {
      console.log("🛠️ Incoming Request from:", req.user?.email);
      console.log("🔑 Access Token:", req.user?.access_token ? "✅ Present" : "❌ Missing");
  
      if (!req.user?.access_token) {
        return res.status(401).json({ error: "Unauthorized: Missing Google access token" });
      }
  
      const educatorAccessToken = req.user.access_token;
      const educatorEmail = req.user.email;
  
      // 🔹 Validate request body
      // Note: We no longer accept assignmentTask or eachTaskWeightage from the user,
      // because the AI will generate a tasks array.
      const { 
        title, 
        subject, 
        classroomId, 
        deadline, 
        totalMarksWeightage, 
        evaluationCriteria, 
        numberOfTasks,
        language,
        additionalInstructions
      } = req.body;
      console.log("📚 request form body:", req.body);

      if (!title || !subject || !classroomId || !deadline) {
        return res.status(400).json({ error: "Missing required fields: title, subject, classroomId, deadline" });
      }
  
      // 🔹 Fetch students from Firestore classroom collection
      console.log("📚 Fetching student emails from Classroom:", classroomId);
      const classroomRef = db.collection("classrooms").doc(classroomId);
      const classroomDoc = await classroomRef.get();
  
      if (!classroomDoc.exists) {
        return res.status(404).json({ error: "Classroom not found" });
      }
  
      const studentEmails = classroomDoc.data().students || [];
      if (studentEmails.length === 0) {
        return res.status(400).json({ error: "No students found in the classroom" });
      }
      console.log("📩 Students to Share Google Doc:", studentEmails);
  
      // 🔹 Generate assignment content using AI
      console.log("🤖 Generating AI-based assignment...");
      const aiResponse = await generateAssignment({
        title,
        subject,
        deadline,
        totalMarksWeightage,
        evaluationCriteria,
        numberOfTasks,
        language: language || "English",
        additionalInstructions: additionalInstructions || "None"
      });
  
      // Convert the AI response into a formatted Markdown document.
      // If aiResponse is an object, it is already parsed JSON.
      let markdownContent;
      if (typeof aiResponse === "string") {
        markdownContent = generateFormattedDocument(aiResponse);
      } else if (typeof aiResponse === "object" && aiResponse !== null) {
        markdownContent = convertAssignmentJsonToMarkdown(aiResponse);
      } else {
        throw new Error("Unexpected AI response type");
      }
      console.log("📝 Generated Markdown Document:\n", markdownContent);
  
      // Ensure we have non-empty content.
      if (!markdownContent || markdownContent.trim() === "") {
        throw new Error("Generated assignment content is empty");
      }
      
      // 🔹 Create Google Doc with AI-generated formatted content (only formatted content inserted)
      console.log("📄 Creating Google Doc...");
      const { docId, docLink } = await createGoogleDoc(title, markdownContent, educatorAccessToken);
      if (!docId || !docLink) {
        throw new Error("Google Docs API failed to return a valid docId");
      }
      console.log("✅ Google Doc Created:", docLink);
  
      // 🔹 Share Google Doc with students
      console.log("📤 Sharing Google Doc with Students...");
      await shareGoogleDoc(docId, studentEmails, educatorAccessToken);
      console.log("✅ Google Doc shared successfully!");
  
      // 🔹 Save assignment in Firestore using a batch write for efficiency
      console.log("💾 Saving assignment to Firestore...");
      const assignmentRef = db.collection("assignments").doc(); // Auto-generate ID
  
      // Save only the formatted content, not the raw AI response.
      const assignmentData = {
        id: assignmentRef.id,
        title,
        subject,
        classroomId,
        deadline,
        // New JSON structure fields (assumed to be generated by the AI)
        tasks: aiResponse.tasks,
        totalMarksWeightage: aiResponse.totalMarksWeightage,
        evaluationCriteria: aiResponse.evaluationCriteria,
        numberOfTasks: aiResponse.numberOfTasks,
        language: language || "English",
        additionalInstructions: additionalInstructions || "None",
        content: markdownContent, // Only the final formatted Markdown document
        docLink,
        studentEmails,
        createdBy: educatorEmail,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
  
      // Firestore batch write for atomicity.
      const batch = db.batch();
      batch.set(assignmentRef, assignmentData);
      await batch.commit();
  
      console.log("✅ Assignment saved with ID:", assignmentRef.id);
  
      res.status(201).json({
        message: "Assignment created successfully",
        assignment: assignmentData,
        docLink,
      });
    } catch (error) {
      console.error("❌ Assignment Creation Failed:", error.message);
      res.status(500).json({ error: "Assignment creation failed", details: error.message });
    }
  }
  
  
  async function approveAssignment(req, res) {
    try {
      const { id } = req.params;
      const assignment = await AssignmentModel.getById(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
  
      // ✅ Fetch user token & email from `authMiddleware`
      const educatorAccessToken = req.user?.access_token;
      const educatorEmail = req.user?.email;  // ✅ Get educator's email
  
      if (!educatorAccessToken || !educatorEmail) {
        return res.status(401).json({ error: "Unauthorized: No access token or email found" });
      }
  
      // ✅ Fetch student emails from Classroom collection
      const classroom = await ClassroomModel.getById(assignment.classroomId);
      if (!classroom || !classroom.students) {
        return res.status(400).json({ error: "Classroom data is missing" });
      }
  
      const studentEmails = classroom.students; // ✅ Array of student emails
      console.log("📩 Extracted Student Emails:", studentEmails);
  
      // ✅ Send email notifications to students
      const emailSubject = `New Assignment Approved: ${assignment.title}`;
      const emailBody = `
        <p>Dear Student,</p>
        <p>A new assignment for <strong>${assignment.subject}</strong> has been approved.</p>
        <p>Please review the assignment using the link below:</p>
        <p><a href="${assignment.docLink}">View Assignment</a></p>
        <p>Best regards,<br>Your Education Team</p>
      `;
  
      for (const email of studentEmails) {
        await sendEmailUsingGmail(educatorAccessToken, educatorEmail, email, emailSubject, emailBody);
      }
  
      res.status(200).json({ message: "Assignment approved and notifications sent" });
    } catch (error) {
      console.error("❌ Approval Failed:", error.message);
      res.status(500).json({ error: "Approval process failed", details: error.message });
    }
  }
  
  async function getAssignmentsByClassroom(req, res) {
    try {
      const { classroomId } = req.params;
      const assignments = await AssignmentModel.getByClassroom(classroomId);
      res.status(200).json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments", details: error.message });
    }
  }
  
  module.exports = { createAssignment, approveAssignment, getAssignmentsByClassroom };
  