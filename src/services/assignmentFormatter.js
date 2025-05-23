
/**
 * Removes code block formatting (e.g., "```json" and "```") from the raw AI response,
 * so that the resulting string is valid JSON.
 *
 * @param {string} aiResponse - The raw AI response that may include code fences.
 * @returns {string} - The cleaned JSON string.
 */
function cleanAIResponse(aiResponse) {
    let cleanedResponse = aiResponse.trim();
  
    if (cleanedResponse.startsWith("```json")) {
      const firstNewline = cleanedResponse.indexOf("\n");
      if (firstNewline !== -1) {
        cleanedResponse = cleanedResponse.substring(firstNewline + 1);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.lastIndexOf("```"));
      }
    }
    return cleanedResponse;
  }
  
  /**
   * Converts the simplified assignment JSON into a clean, human-readable Markdown document.
   *
   * Expected JSON structure:
   * {
   *   "title": "Assignment Title",
   *   "deadline": "Due date",
   *   "numberOfTasks": "Number of tasks",   // Optional if tasks array is provided.
   *   "tasks": [
   *      {
   *         "description": "Auto-generated task details using Gemini",
   *         "weightage": "Auto-generated weightage"
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
    doc += `# ${assignment.title || "Untitled Assignment"}\n\n`;
    doc += `## Deadline\n\n${assignment.deadline || "Deadline not specified"}\n\n`;
  
    let numTasks = assignment.numberOfTasks;
    if (!numTasks && assignment.tasks && assignment.tasks.length > 0) {
      numTasks = assignment.tasks.length;
    }
    doc += `## Number of Tasks\n\n${numTasks || "Not specified"}\n\n`;
    doc += `## Tasks\n\n`;
    if (assignment.tasks && Array.isArray(assignment.tasks) && assignment.tasks.length > 0) {
      assignment.tasks.forEach((task, index) => {
        doc += `**Task ${index + 1}:** ${task.description || "No description provided"} (Weightage: ${task.weightage || "Not specified"} marks)\n\n`;
      });
    } else {
      doc += `Task 1: Auto-generated Task 1 details using Gemini (Weightage: Auto-generated weightage marks)\n\n`;
      doc += `Task 2: Auto-generated Task 2 details using Gemini (Weightage: Auto-generated weightage marks)\n\n`;
      doc += `Task 3: Auto-generated Task 3 details using Gemini (Weightage: Auto-generated weightage marks)\n\n`;
    }
    doc += `## Total Weightage Marks\n\n${assignment.totalMarksWeightage || "100"}\n\n`;
    doc += `## Evaluation Criteria\n\n${assignment.evaluationCriteria || "Auto-generated evaluation criteria by Gemini"}\n\n`;
  
    return doc.trim();
  }
  
  /**
   * Parses an AI response (in JSON format) and converts the parsed assignment object
   * into a clean, human-readable Markdown document.
   *
   * @param {string} aiResponse - The raw AI response containing JSON (may include code fences).
   * @returns {string} - The final Markdown document without JSON syntax.
   */
  function generateFormattedDocument(aiResponse) {
    try {
      const cleanedResponse = cleanAIResponse(aiResponse);
      const assignment = JSON.parse(cleanedResponse);
      return convertAssignmentJsonToMarkdown(assignment);
    } catch (error) {
      throw new Error("Failed to generate formatted document: " + error.message);
    }
  }
  
  module.exports = {
    cleanAIResponse,
    convertAssignmentJsonToMarkdown,
    generateFormattedDocument,
  };
  