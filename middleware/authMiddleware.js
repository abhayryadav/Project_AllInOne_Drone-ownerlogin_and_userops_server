import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req, res, next) => {
  const data = req.body;
  console.log("Request Body Data:", data);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log("Auth Header:", token);
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: 'Access token required' });
  }
  const user = jwt.decode(token);
  console.log("Decoded User from Token:=========================", user);
  console.log("Decoded User from Token:-------------------------", user.userId);
  req.userId = user.userId;
  console.log("Decoded User from Token:", user);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};