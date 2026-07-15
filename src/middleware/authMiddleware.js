import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

// Read the token from the request
// Check if token is valid
// We get the token from the headers, so make sure to take use the token in our cookies on the frontend in the header.
export const authMiddleware = async (req, res, next) => {
  console.log("Auth middleware reached");

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; // ["Bearer", "token"]
  } else if (req.cookies?.jwt) {
    // If the token is not sent as a bearer and is instead sent as a cookie in the headers, we do this instead.

    token = req.cookies.jwt;
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "error", message: "Not authorized, no token provided" });
  }

  try {
    // Verify token and extract the user Id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "User no longer exists" });
    }

    // Adding user into the req
    req.user = user;

    // Telling the middleware to continue to our endpoint
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: "error", message: "Not authorized, token failed" });
  }
};
