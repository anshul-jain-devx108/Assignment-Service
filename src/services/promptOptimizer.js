
const { PromptTemplate } = require("langchain/prompts");
// const { PromptTemplate } = require("langchain-core/prompts");

const { getHaystackContext } = require("./hayStackService");

async function optimizePrompt(data) {
  const haystackContext = await getHaystackContext();
  const context = data.context ? `${data.context}\n\n${haystackContext}` : haystackContext;

  const template = `
  🎓 **Assignment Generation for Top-Tier Academia**  
  You are a **world-class professor** at a prestigious university, responsible for designing structured, high-quality academic assignments that meet the highest educational standards.

  🚨 **Generate the assignment in the following language: {language}** 🚨

  ---  

  ## **📌 Assignment Specifications:**  
  - **📖 Subject:** {subject}  
  - **🎓 Grade Level:** {gradeLevel}  
  - **🎯 Difficulty Level:** {difficultyLevel}  
  - **🔍 Detail Level:** {detailLevel}  
  - **🌍 Language:** {language}  
  - **⏰ Deadline:** {deadline}  
  - **🔢 Number of Tasks:** {numberOfTasks}  
  - **ℹ️ Additional Instructions:** {additionalInstructions}  

  ---  

  ## **📝 Response Format (STRICTLY FOLLOW THIS FORMAT):**  

  Title: {title}  
  no. of task = {numberOfTasks}  

  Task 1: Auto-generate Task 1 details using Gemini (Weightage: Auto-generated weightage)  
  Task 2: Auto-generate Task 2 details using Gemini (Weightage: Auto-generated weightage)  
  Task 3: Auto-generate Task 3 details using Gemini (Weightage: Auto-generated weightage)  

  Total Weightage Marks: 100  
  Evaluation Criteria: Auto-generated evaluation criteria by Gemini
  `;

  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: [
      "subject",
      "gradeLevel",
      "difficultyLevel",
      "detailLevel",
      "language",
      "deadline",
      "additionalInstructions",
      "numberOfTasks",
      "title"
    ],
  });

  return await promptTemplate.format({
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    difficultyLevel: data.difficultyLevel,
    detailLevel: data.detailLevel,
    language: data.language || "English",
    deadline: data.deadline || "Deadline not specified",
    additionalInstructions: data.additionalInstructions || "None",
    numberOfTasks: data.numberOfTasks || "n",
    title: data.title || "Untitled Assignment"
  });
}

module.exports = { optimizePrompt };
