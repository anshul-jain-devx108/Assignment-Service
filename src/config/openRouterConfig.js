const axios = require("axios");

const openRouterInstance = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  },
});

module.exports = openRouterInstance;
