const axios = require("axios");

async function sendEmailUsingGmail(accessToken, userEmail, to, subject, body) {
  console.log("📧 Sending Email...");
  console.log("📤 Sender Email:", userEmail);
  console.log("📩 Recipient Email:", to);

  if (!to) {
    throw new Error("Recipient email is missing!");
  }

  const emailContent = `To: ${to}
From: ${userEmail}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"

${body}
  `;

  const encodedMessage = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  try {
    const response = await axios.post(
      "https://www.googleapis.com/gmail/v1/users/me/messages/send",
      { raw: encodedMessage },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email Sent Successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Gmail API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to send email");
  }
}

module.exports = { sendEmailUsingGmail };
