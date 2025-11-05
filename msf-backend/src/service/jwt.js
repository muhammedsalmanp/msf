import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const accessTokenSecret =  process.env.ACCESS_SECRET;
const refreshTokenSecret= process.env.REFRESH_SECRET;

if (!accessTokenSecret || !refreshTokenSecret) {
  throw new Error("JWT secrets are not set in environment variables.");
}

export const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,  
    accessTokenSecret,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,  
    refreshTokenSecret,
    { expiresIn: "7d" }
  );
};


export const verifayAccessToken = (token)=>{
    return jwt.verify(token,accessTokenSecret);
};

export const verifayRefreshToken =(token)=>{
    return jwt.verify(token,refreshTokenSecret);
};
