
const axios = require("axios");

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // ✅ Extract Token from Authorization Header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("🔹 Token from Authorization header:", token);
    }

    // ❌ If No Token, Return Error
    if (!token) {
      console.error("❌ No token found in request headers!");
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // ✅ Verify Token with Google OAuth
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);

    if (!googleResponse.data || !googleResponse.data.email) {
      console.error("❌ Invalid token response from Google:", googleResponse.data);
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }

    // ✅ Save Verified User Info
    req.user = {
      email: googleResponse.data.email,
      access_token: token, // Make sure this is NOT empty!
    };

    console.log("🛠️ Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.response?.data || error.message);
    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};

module.exports = authMiddleware;
