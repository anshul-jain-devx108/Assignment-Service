
const { google } = require("googleapis");
const marked = require("marked");
const { generateFormattedDocument } = require("./assignmentFormatter"); // This module contains generateFormattedDocument, convertAssignmentJsonToMarkdown, and cleanAIResponse

/**
 * Parses Markdown and inserts properly formatted content into a Google Doc.
 * Supports headings, paragraphs, lists, code blocks, and minimal table handling.
 *
 * @param {string} docId - The Google Doc ID.
 * @param {string} markdownContent - The assignment content in Markdown.
 * @param {object} authClient - The authenticated OAuth2 client.
 */
async function insertFormattedContent(docId, markdownContent, authClient) {
  try {
    if (!markdownContent || markdownContent.trim() === "") {
      console.warn("⚠️ Markdown content is empty. Skipping formatting.");
      return;
    }

    console.log("📝 Processing Markdown Content:\n", markdownContent);

    // Parse the markdown into tokens
    const tokens = marked.lexer(markdownContent);
    console.log("🛠 Parsed Tokens:", JSON.stringify(tokens, null, 2));

    let requests = [];
    let currentIndex = 1; // Starting index in the document

    tokens.forEach((token) => {
      let text = "";
      
      switch (token.type) {
        case "heading": {
          // Insert heading text followed by a single newline.
          text = token.text + "\n";  // Removed the second \n
          const headingLevel = token.depth; // Use token.depth for heading level (1-6)
          requests.push({
            insertText: { location: { index: currentIndex }, text },
          });
          // Apply heading style
          requests.push({
            updateParagraphStyle: {
              range: { startIndex: currentIndex, endIndex: currentIndex + text.length },
              paragraphStyle: { namedStyleType: `HEADING_${headingLevel}` },
              fields: "namedStyleType",
            },
          });
          currentIndex += text.length;
          break;
        }
        case "paragraph": {
          // Single newline at the end
          text = token.text + "\n"; 
          requests.push({
            insertText: { location: { index: currentIndex }, text },
          });
          currentIndex += text.length;
          break;
        }
        case "list": {
          token.items.forEach((item, listIndex) => {
            if (!item.text || item.text.trim() === "") return;
            const prefix = token.ordered ? `${listIndex + 1}. ` : "• ";
            let itemText = prefix + item.text + "\n"; 
            requests.push({
              insertText: { location: { index: currentIndex }, text: itemText },
            });
            // For unordered lists, apply bullet formatting.
            if (!token.ordered) {
              requests.push({
                createParagraphBullets: {
                  range: { startIndex: currentIndex, endIndex: currentIndex + itemText.length - 1 },
                  bulletPreset: "BULLET_ARROW_DIAMOND_DISC",
                },
              });
            }
            currentIndex += itemText.length;
          });
          break;
        }
        case "code": {
          text = token.text + "\n";  // Single newline
          // Insert code block text
          requests.push({
            insertText: { location: { index: currentIndex }, text },
          });
          // Apply monospace font styling for code blocks.
          requests.push({
            updateTextStyle: {
              range: { startIndex: currentIndex, endIndex: currentIndex + text.length },
              textStyle: { weightedFontFamily: { fontFamily: "Courier New", weight: 400 } },
              fields: "weightedFontFamily",
            },
          });
          currentIndex += text.length;
          break;
        }
        case "space": {
          // Do nothing for spaces.
          break;
        }
        default: {
          console.warn(`⚠️ Unhandled token type: ${token.type}`);
        }
      }
    });

    console.log("🛠 Formatting Requests Generated:", requests.length);
    if (requests.length === 0) {
      console.warn("⚠️ No valid formatting requests found. Adding fallback text.");
      requests.push({
        insertText: {
          location: { index: 1 },
          text: "⚠️ Formatting failed. Raw content:\n" + markdownContent,
        },
      });
    }

    const docs = google.docs({ version: "v1", auth: authClient });
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });

    console.log("✅ Google Doc content formatted successfully!");
  } catch (error) {
    console.error("❌ Google Docs Formatting Error:", error.message);
    throw new Error(`Failed to format Google Doc: ${error.message}`);
  }
}

/**
 * Creates a Google Doc with the given title and formatted content.
 * If the provided markdownContent appears to be an assignment JSON (or wrapped in code fences),
 * it is automatically converted to Markdown using generateFormattedDocument().
 *
 * @param {string} title - The document title.
 * @param {string} markdownContent - The assignment content in Markdown or JSON.
 * @param {string} accessToken - The Google OAuth access token.
 * @returns {Promise<{docId: string, docLink: string}>} - The document ID and link.
 */
async function createGoogleDoc(title, markdownContent, accessToken) {
  try {
    if (!accessToken) throw new Error("Missing Google access token.");

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });

    // Check if the provided content looks like JSON (or wrapped in code fences)
    const trimmedContent = markdownContent.trim();
    if (trimmedContent.startsWith("{") || trimmedContent.startsWith("```json")) {
      console.log("🔍 Detected assignment JSON content. Converting to Markdown...");
      markdownContent = generateFormattedDocument(markdownContent);
      console.log("✅ Conversion to Markdown completed.");
    }

    const docs = google.docs({ version: "v1", auth: authClient });

    // Create a new Google Doc with the provided title.
    const createResponse = await docs.documents.create({
      requestBody: { title },
    });

    const docId = createResponse.data.documentId;
    const docLink = `https://docs.google.com/document/d/${docId}/edit`;
    console.log("📄 Google Doc Created:", docLink);

    // Instead of inserting raw content and then formatting,
    // only insert and format the final Markdown content.
    await insertFormattedContent(docId, markdownContent, authClient);

    return { docId, docLink };
  } catch (error) {
    console.error("❌ Google Docs API Error:", error.response?.data || error.message);
    throw new Error(`Google Docs API failed: ${error.message}`);
  }
}

/**
 * Shares a Google Doc with specified student emails (read-only access).
 *
 * @param {string} docId - The Google Doc ID.
 * @param {string[]} studentEmails - List of student emails.
 * @param {string} accessToken - The educator's Google OAuth token.
 * @returns {Promise<string>} - Confirmation message.
 */
async function shareGoogleDoc(docId, studentEmails, accessToken) {
  try {
    if (!accessToken) throw new Error("Missing Google access token.");

    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: authClient });

    for (const email of studentEmails) {
      await drive.permissions.create({
        fileId: docId,
        requestBody: { role: "reader", type: "user", emailAddress: email },
        fields: "id",
      });
      console.log(`✅ Shared with: ${email}`);
    }

    return `Google Doc shared with ${studentEmails.length} students.`;
  } catch (error) {
    console.error("❌ Google Drive API Sharing Error:", error.response?.data || error.message);
    throw new Error(`Failed to share Google Doc: ${error.message}`);
  }
}

module.exports = { createGoogleDoc, shareGoogleDoc, insertFormattedContent };
