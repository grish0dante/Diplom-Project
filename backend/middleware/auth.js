const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Auth middleware: Starting token verification');
  console.log('Auth middleware: Request headers:', req.headers);
  
  // Отримати токен 
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log('Auth middleware: No Authorization header');
    return res.status(401).json({ message: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  console.log('Auth middleware: Token received:', token);

  try {
    // Перевірити токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    console.log('Auth middleware: Token decoded successfully:', decoded);
    
    if (!decoded.userId) {
      console.error('Auth middleware: Token missing userId');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Додати користувача у запит
    req.user = {
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    console.log('Auth middleware: User object set in request:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware: Token verification failed:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
      token: token.substring(0, 20) + '...' 
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 