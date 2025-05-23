
/**
 * Converts the simplified assignment JSON into a clean, human-readable Markdown document.
 *
 * Expected JSON structure:
 * {
 *   "title": "Assignment Title",
 *   "deadline": "Due date",
 *   "numberOfTasks": "Number of tasks",
 *   "tasks": [
 *      {
 *         "description": "Task details",
 *         "weightage": "Task weightage"
 *      },
 *      ...
 *   ],
 *   "totalMarksWeightage": "Overall marks weightage",
 *   "evaluationCriteria": "Evaluation criteria"
 * }
 *
 * @param {Object} assignment - The simplified assignment JSON.
 * @returns {string} - A formatted Markdown string.
 */
function convertAssignmentJsonToMarkdown(assignment) {
    let doc = "";
  
    // Title
    doc += `# ${assignment.title || "Untitled Assignment"}\n`;  
  
    // Deadline
    doc += `## Deadline\n${assignment.deadline || "Deadline not specified"}\n`;  
  
    // Number of Tasks
    let numTasks = assignment.numberOfTasks;
    if (!numTasks && assignment.tasks && assignment.tasks.length > 0) {
      numTasks = assignment.tasks.length;
    }
    doc += `## Number of Tasks\n${numTasks || "Not specified"}\n`;
  
    // Tasks
    doc += `## Tasks\n`;
    if (assignment.tasks && Array.isArray(assignment.tasks) && assignment.tasks.length > 0) {
      assignment.tasks.forEach((task, index) => {
        doc += `Task ${index + 1}: ${task.description || "No description provided"}\n`;
        doc += `(Weightage: ${task.weightage || "Not specified"} marks)\n\n`;
      });
    } else {
      // Default tasks if no tasks array is provided.
      doc += `Task 1: Auto-generated Task 1 details using Gemini\n(Weightage: Auto-generated weightage marks)\n`;
      doc += `Task 2: Auto-generated Task 2 details using Gemini\n(Weightage: Auto-generated weightage marks)\n`;
      doc += `Task 3: Auto-generated Task 3 details using Gemini\n(Weightage: Auto-generated weightage marks)\n`;
    }
  
    // Total Weightage Marks
    doc += `## Total Weightage Marks\n${assignment.totalMarksWeightage || "100"}\n`;
  
    // Evaluation Criteria
    doc += `## Evaluation Criteria\n${assignment.evaluationCriteria || "Auto-generated evaluation criteria by Gemini"}`;
  
    return doc.trim();
  }
  
  
  
  module.exports = { convertAssignmentJsonToMarkdown };
  
  
  