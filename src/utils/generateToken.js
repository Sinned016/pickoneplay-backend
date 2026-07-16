import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const payload = { id: userId };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  console.log("TOKEN CREATED: ", token);

  // Setting the cookie on the frontend, this happens because we return "res.cookie". This is also the safest way of doing it.
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    // Scopes the cookie to the whole pickoneplay.online site (including the
    // api. subdomain) instead of just api.pickoneplay.online, so it's sent
    // both on direct browser->backend fetches and on SSR requests to the
    // frontend that forward cookies to the backend.
    domain: isProd ? ".pickoneplay.online" : undefined,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
};
