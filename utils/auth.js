// Minimal JWT auth middleware to protect endpoints and scope data per user.
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    let token = header.startsWith("Bearer ") ? header.slice(7) : header;
    
    // Fallback to query parameter for GET requests (like PDF downloads)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ status: false, message: "Unauthorized" });
    const key = process.env.JWT_SECRET || "dev_secret";
    const payload = jwt.verify(token, key);
    req.user = { 
      id: Number(payload.id || payload._id), 
      email: payload.email, 
      plan: payload.plan,
      role: payload.role 
    };
    return next();
  } catch (err) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: false, message: "Forbidden: Admin access required" });
    }
    next();
  });
}
