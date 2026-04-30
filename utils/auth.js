import jwt from "jsonwebtoken";
import UserModule from "../module/user.module.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    let token = header.startsWith("Bearer ") ? header.slice(7) : header;
    
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ status: false, message: "Unauthorized" });
    
    const key = process.env.JWT_SECRET || "dev_secret";
    const payload = jwt.verify(token, key);
    const userId = Number(payload.id || payload._id);

    // Instant Termination Check (Non-blocking race)
    try {
      // Race the DB query against a 2-second timeout to prevent app hangs
      const dbUser = await Promise.race([
        UserModule.findById(userId).select('refreshToken status').lean(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('db_timeout')), 2000))
      ]);

      if (dbUser && (!dbUser.refreshToken || dbUser.status === 0)) {
        return res.status(401).json({ status: false, message: "Session terminated or Account blocked" });
      }
    } catch (dbError) {
      // If DB is slow or connecting, we log it and proceed to avoid freezing the app
      console.warn("Fast-auth check bypassed:", dbError.message);
    }

    req.user = { 
      id: userId, 
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
