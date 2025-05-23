const { google } = require("googleapis");

async function addCalendarEvent(eventDetails) {
  const calendar = google.calendar({ version: "v3", auth: process.env.GOOGLE_API_KEY });
  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: eventDetails,
  });
  return event.data;
}

module.exports = { addCalendarEvent };
