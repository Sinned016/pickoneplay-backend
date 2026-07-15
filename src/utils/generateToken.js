import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const payload = { id: userId };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  console.log("TOKEN CREATED: ", token);

  // Setting the cookie on the frontend, this happens because we return "res.cookie". This is also the safest way of doing it.
  // I can only use this if communicate directly with the frontend. Since im using next.js api routes as a proxy this does not work.
  // res.cookie("jwt", token, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "strict",
  //   maxAge: 1000 * 60 * 60 * 24 * 7,
  // });
  return token;
};
