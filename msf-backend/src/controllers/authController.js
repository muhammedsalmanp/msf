import bcrypt from 'bcrypt';
import User from "../models/User.js";
import Unit from "../models/Unit.js";
import { generateAccessToken, generateRefreshToken } from '../service/jwt.js';

export const Login = async (req, res) => {
  try {
    console.log("🔹 Login function called");

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    let entity = null;
    let entityType = null;

    // 🔍 Check if it's a Unit
    entity = await Unit.findOne({ username });
    if (entity) {
      entityType = 'unit';
    } else {
      // 🔍 Else check if it's a User
      entity = await User.findOne({ username });
      if (entity) {
        entityType = entity.isAdmin ? 'admin' : 'incharge';
      }
    }

    if (!entity || !entityType) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    // 🔐 Verify password
    const isValid = await bcrypt.compare(password, entity.password || "");
    if (!isValid) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    // ✅ Token payload
    const tokenPayload = {
      id: entity._id,
      username: entity.username,
      type: entityType,
      ...(entityType === 'admin' && { isAdmin: entity.isAdmin })
    };

    // ✅ Prepare response user data
    const userResponse = {
      type: entityType,
      id: entity._id,
      username: entity.username,
      name: entity.name,
      ...(entityType !== 'unit' && { profileImage: entity.profileImage })
    };

    // ✅ Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // ✅ Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 🟢 Better for local dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    console.log("✅ Refresh token cookie set");

    // ✅ Send success response
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: userResponse,
    });

  } catch (error) {
    console.error("🔥 Login failed:", error);
    res.status(500).json({ message: "Login failed" });
  }
};


export const logoutUser = async (req, res) => {
  try {
    console.log("Clearing refresh token cookie...");

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    console.log("✅ Cookie cleared successfully");
    return res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnits = async (req, res) => {
  try {
    const units = await Unit.find().select('name');
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: "Error fetching units", error });
  }
};
