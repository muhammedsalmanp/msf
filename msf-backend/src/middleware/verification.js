import jwt from 'jsonwebtoken';
export const verifyAccessToken = (req, res, next) => {
  console.log("🔑 Checking Authorization...");
  const authHeader = req.headers.authorization;
  

  if (!authHeader) {
    console.log("❌ No Authorization header");
    // Use 401 for "unauthenticated"
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) {
      // ✅ **THIS IS THE MAIN FIX**
      // Check if the error is specifically for an expired token
      if (err.name === 'TokenExpiredError') {
        console.log("❌ TokenExpiredError");
        // Send the 401 status and the exact message your frontend is looking for
        return res.status(401).json({ message: "TokenExpired" });
      }

      return res.status(403).json({ message: "InvalidToken" });
    }
    req.user = user;
    next();
  });
};