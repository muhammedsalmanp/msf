import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import cors from "cors";
import os from "os";   // 👈 to detect LAN IP

import authRoute from "./routes/authRoutes.js";
import adminRoute from "./routes/adminRoute.js";
import userRoute from "./routes/userRoute.js";
import unitRoute from "./routes/unitRoute.js";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Static files
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.use(
  cors({
    origin: [
      "https://msfcheekodepanchayat.online", 
      "https://www.msfcheekodepanchayat.online",
      "http://localhost:5173/"
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);
app.use("/api/unit",unitRoute)

// Detect LAN IP
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const PORT = process.env.PORT || 5000;
const IP = getLocalIp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server started on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${IP}:${PORT}`);
});
