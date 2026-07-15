import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const { email, username, password } = req.body;

  // Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });

  if (userExists) {
    return res.status(400).json({
      status: "error",
      message: "User already exists with this email",
    });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create the user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  // Generate JWT token. I only wanna do this when logging in, not registering.
  // const token = generateToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: email,
        username: username,
      },
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Check if user email exists in the table
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "No account with that email",
    });
  }

  // Verify the password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      status: "error",
      message: "Invalid email or password",
    });
  }

  // Generate JWT token
  const token = generateToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: email,
      },
      token,
    },
  });
};

// Since im using next.js api as a proxy I cant delete the jwt token here. I will do it in the next.js API routes.
const logout = (req, res) => {
  // Setting the cookie to nothing
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

// We do not wanna use our authMiddleware for this, since we wanna set "user: null" if there is none here.
const Me = async (req, res) => {
  try {
    const token = req.cookies?.jwt;

    // No token = guest user
    if (!token) {
      return res.status(200).json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Token valid but user missing (deleted account etc.)
    if (!user) {
      res.clearCookie("jwt");
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({ user });
  } catch (err) {
    // Invalid/expired token = treat as guest
    res.clearCookie("jwt");
    return res
      .status(200)
      .json({ user: null, message: "Something went wrong, proceed as guest" });
  }
};

export { register, login, Me };
