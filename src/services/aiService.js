
const { db } = require("../config/firebaseConfig");
const axios = require("axios");
const { autoChainRefine } = require("./autoChainService");
const { optimizePrompt } = require("./promptOptimizer");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-flash-1.5-8b-exp";

/**
 * Removes code fence formatting (e.g., "```json" and "```") from the raw AI response,
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
 * Generates an assignment using AI, refines it iteratively, and returns a structured JSON object.
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
 * @param {Object} details - Assignment details.
 * @returns {Promise<Object>} - Structured assignment content as a JSON object.
 */
async function generateAssignment(details) {
  try {
    if (!details || typeof details !== "object") {
      throw new Error("Invalid input: Assignment details are missing or malformed.");
    }

    // Optimize the prompt for better AI responses.
    const basePrompt = await optimizePrompt(details);
    console.log("🔹 Base Prompt Sent to AI:\n", basePrompt);

    // Send request to OpenRouter AI with updated system instructions.
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are an experienced professor creating structured assignments. Ensure your response is STRICTLY formatted in valid JSON. Structure: {{"title": "Assignment Title", "deadline": "Due date", "totalMarksWeightage": "Overall marks weightage", "evaluationCriteria": "Evaluation criteria", "numberOfTasks": "Number of tasks", "tasks": [ { "description": "Task details", "weightage": "Task weightage" } ]}}',
          },
          { role: "user", content: basePrompt },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    let rawAIResponse = response.data.choices?.[0]?.message?.content;
    // Convert to string if necessary.
    if (rawAIResponse !== undefined && rawAIResponse !== null) {
      rawAIResponse = String(rawAIResponse).trim();
    }
    console.log("🤖 Raw AI Response:\n", rawAIResponse);

    if (!rawAIResponse || rawAIResponse === "") {
      throw new Error("Generated assignment content is empty");
    }

    // Clean the AI response to remove any code fences.
    const cleanedResponse = cleanAIResponse(rawAIResponse);
    console.log("🤖 Cleaned AI Response:\n", cleanedResponse);

    // Parse the cleaned response as JSON.
    let assignmentJson;
    try {
      assignmentJson = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("❌ Failed to parse AI response as JSON:\n", cleanedResponse);
      throw new Error("Invalid AI response: Expected JSON format but received malformed content.");
    }

    // Validate JSON structure for required keys.
    if (
      !assignmentJson.title ||
      !assignmentJson.deadline ||
      !assignmentJson.totalMarksWeightage ||
      !assignmentJson.evaluationCriteria ||
      !assignmentJson.numberOfTasks ||
      !assignmentJson.tasks
    ) {
      console.error("❌ AI Response JSON Structure Invalid:\n", assignmentJson);
      throw new Error(
        "Invalid AI response: Missing required fields (title, deadline, totalMarksWeightage, evaluationCriteria, numberOfTasks, tasks)."
      );
    }

    // Validate tasks array.
    const expectedTaskCount = parseInt(assignmentJson.numberOfTasks, 10);
    if (!Array.isArray(assignmentJson.tasks) || assignmentJson.tasks.length < expectedTaskCount) {
      console.error(
        `❌ Expected ${expectedTaskCount} tasks, but tasks array has ${assignmentJson.tasks?.length || 0}.`
      );
      throw new Error(
        `Invalid AI response: Expected ${expectedTaskCount} tasks, but found ${assignmentJson.tasks?.length || 0} in tasks array.`
      );
    } else if (assignmentJson.tasks.length > expectedTaskCount) {
      console.warn(
        `⚠️ Expected ${expectedTaskCount} tasks, but found ${assignmentJson.tasks.length}. Trimming extra tasks.`
      );
      assignmentJson.tasks = assignmentJson.tasks.slice(0, expectedTaskCount);
    }

    return assignmentJson;
  } catch (error) {
    console.error("❌ Assignment Generation Failed:", error.message);
    throw new Error("Assignment generation failed: " + error.message);
  }
}

module.exports = { generateAssignment };
