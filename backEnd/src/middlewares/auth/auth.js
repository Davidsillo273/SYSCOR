import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.sessionToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access denied. No session token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_secreto_super_seguro");

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The session has expired. Please log in again." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};