// exports = { getHaystackContext };


// const fs = require("fs");
// const path = require("path");

// async function getHaystackContext() {
//   const filePath = path.join(__dirname, "academicContext.txt");

//   try {
//     // Check if the file exists before reading
//     if (fs.existsSync(filePath)) {
//       const context = await fs.promises.readFile(filePath, "utf8");
//       return context.trim() || "No additional academic context provided.";
//     } else {
//       console.warn("[⚠️ Warning] academicContext.txt file not found. Using default academic context.");
//     }
//   } catch (error) {
//     console.error("[❌ Error] Failed to read academic context:", error.message);
//   }

//   // Default academic context when the file is missing or an error occurs
//   return `
//     Academic assignments should follow a structured format with an introduction, 
//     clearly defined objectives, well-researched content, and a robust grading rubric. 
//     Assignments must challenge students to apply critical thinking and demonstrate their understanding of the subject.
//   `;
// }

// module.exports = { getHaystackContext };
const fs = require("fs");
const path = require("path");

async function getHaystackContext() {
  const filePath = path.join(__dirname, "academicContext.txt");

  try {
    if (fs.existsSync(filePath)) {
      const context = await fs.promises.readFile(filePath, "utf8");
      return context.trim() || "No additional academic context provided.";
    } else {
      console.warn("[⚠️ Warning] academicContext.txt file not found. Using default academic context.");
    }
  } catch (error) {
    console.error("[❌ Error] Failed to read academic context:", error.message);
  }

  return `
    Academic assignments should follow a structured format with an introduction, 
    clearly defined objectives, well-researched content, and a robust grading rubric. 
    Assignments must challenge students to apply critical thinking and demonstrate their understanding of the subject.
  `;
}

module.exports = { getHaystackContext };
