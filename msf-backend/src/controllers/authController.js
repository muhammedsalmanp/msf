import bcrypt from 'bcrypt';
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from '../service/jwt.js'
import Unit from '../models/Unit.js';


export const Login = async (req, res) => {
  try {
    console.log("🔹 Login function called");

    const { username, password } = req.body;
    console.log("📥 Request body:", { username });

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    let entity = null;
    let entityType = null;
    let userResponse = {};

    console.log("🔎 Searching for UNIT with username:", username);
    entity = await Unit.findOne({ username });

    if (entity) {
      console.log("✅ UNIT found:", { id: entity._id, username: entity.username });
      entityType = 'unit';
    } else {
      console.log("❌ No UNIT found. Searching for USER with username:", username);
      entity = await User.findOne({ username });

      if (entity) {
        if (entity.isAdmin) {
          console.log("✅ ADMIN USER found:", { id: entity._id });
          entityType = 'admin';
        } else {
          console.log("✅ INCHARGE USER (non-admin) found:", { id: entity._id });
          entityType = 'incharge';
        }
      }
    }


    if (!entity || !entityType) {
      console.log("❌ No account found for:", username);
      return res.status(400).json({ message: "Invalid username or password." });
    }


    if (!entity.password) {
      console.log(`❌ ${entityType.toUpperCase()} account has no password set:`, entity._id);
      return res.status(400).json({ message: `${entityType} account is not configured for login.` });
    }

    console.log(`🔑 Comparing password for ${entityType.toUpperCase()}...`);
    const isValid = await bcrypt.compare(password, entity.password);

    if (!isValid) {
      console.log(`❌ Password mismatch for ${entityType.toUpperCase()}:`, entity._id);
      return res.status(400).json({ message: "Invalid username or password." });
    }
    console.log(`✅ ${entityType.toUpperCase()} Password valid`);

    const tokenPayload = {
      id: entity._id,
      username: entity.username,
      type: entityType,
      ...(entityType === 'admin' && { isAdmin: entity.isAdmin })
    };

    userResponse = {
      type: entityType,
      id: entity._id,
      username: entity.username,
      name: entity.name,
      ...(entityType !== 'unit' && { profileImage: entity.profileImage })
    };

    console.log(`🔐 Generating tokens for ${entityType}...`);
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    console.log("✅ Tokens generated");

    console.log("🍪 Setting refresh token cookie...");
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });
    console.log("✅ Cookie set successfully");

    console.log("📤 Sending response...");
    res.status(200).json({
      message: "Login success",
      accessToken,
      user: userResponse,
    });
    
    console.log("✅ Login response sent successfully",accessToken,userResponse);

  } catch (error) {
    console.error("🔥 Login failed:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
};


export const logoutUser = async (req, res) => {
  try {
    console.log("Clearing refresh token cookie...");

    // --- THIS IS THE FIX ---
    // The options here MUST match the options you used in res.cookie()
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Must match
      sameSite: "strict",                        // Must match
      path: "/", // Explicitly add path, defaults often work but this is safer
    });

    console.log("✅ Cookie cleared successfully");

    // Send the success response
    return res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getUnits = async (req,res)=>{
  try {
    console.log('units ');
    
    const units = await Unit.find().select('name');
    console.log(units);
    
    res.status(200).json(units)
  } catch (error) {
    res.status(500).json({ message: "Error fetching units", error });
  } 

}