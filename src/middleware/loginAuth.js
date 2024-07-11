const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports = (req, res, next) => {
  const token =
    req.header('Authorization') &&
    req.header('Authorization').replace('Bearer ', '');
  if (!token) {
    return res.status(401).send('Access denied');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Invalid token:', error.message);
    // Content-Type을 application/json으로 설정하여 JSON 형식의 응답을 보냄
    res.type('application/json').status(400).json({ error: 'Invalid token' });
  }
};
