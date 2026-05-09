import jwt from 'jsonwebtoken';

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  console.log("🔄 Trying to refresh token...");
  
  if (!token) {
    console.log("❌ No refresh token cookie");
    return res.status(401).json({ message: "No refresh token" });
  }

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Refresh token invalid", err.message);
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { 
        id: user.id,       
        username: user.username, 
        type: user.type         
      },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" } 
    );

    console.log("✅ New access token generated");
    return res.json({ accessToken: newAccessToken });
  });
};