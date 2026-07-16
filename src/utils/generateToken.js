import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const payload = { id: userId };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  console.log("TOKEN CREATED: ", token);

  // Setting the cookie on the frontend, this happens because we return "res.cookie". This is also the safest way of doing it.
  // I can only use this if communicate directly with the frontend. Since im using next.js api routes as a proxy this does not work.
  // Decided to stop using next.js as a proxy so i can use this now.
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    // SameSite=None requires Secure, and Secure cookies require HTTPS.
    // Locally (http://localhost:3000 -> http://localhost:5001) that combo
    // gets silently dropped by the browser, so fall back to Lax there.
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
};
