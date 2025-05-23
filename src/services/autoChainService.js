
/**
 * Auto-chain refinement process to iteratively improve the AI-generated assignment.
 * This method enhances the clarity, structure, and academic quality of the assignment.
 * 
 * @param {string} prompt - The base assignment prompt.
 * @param {Function} generateFunction - Function that calls the AI model.
 * @param {number} iterations - Number of refinement cycles (default: 3).
 * @returns {Promise<string>} - Refined assignment content.
 */
async function autoChainRefine(prompt, generateFunction, iterations = 3) {
    let refinedContent = prompt;
    console.log(`🔄 Starting refinement process (Iterations: ${iterations})`);
    
    for (let i = 0; i < iterations; i++) {
      console.log(`✨ Refinement Round ${i + 1}`);
      
      const refinementInstructions = `
  🔹 Refine the assignment to enhance:
  - Clarity and conciseness.
  - Academic quality and depth.
  - Structured formatting (e.g., Introduction, Tasks, Instructions, Grading Criteria).
  - Alignment with professional educational standards.
      `;
      
      // Combine the current content with the refinement instructions.
      const promptForIteration = `${refinedContent}\n\n${refinementInstructions}`;
      
      try {
        const result = await generateFunction(promptForIteration);
        if (!result || typeof result !== 'string') {
          throw new Error("Refinement step failed: No valid result returned.");
        }
        refinedContent = result.trim();
        console.log(`✅ Completed refinement round ${i + 1}`);
      } catch (error) {
        console.error(`❌ Refinement error in iteration ${i + 1}: ${error.message}`);
        break;
      }
    }
    
    console.log("✅ Refinement process completed.");
    return refinedContent;
  }
  
  module.exports = { autoChainRefine };
  