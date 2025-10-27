const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-novelle-2025'; // FIXED: Match server.js default

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AUTH DEBUG] Endpoint: ${req.method} ${req.path}`); // Log request
    console.log(`[AUTH DEBUG] Full header: ${authHeader}`); // Log header
    console.log(`[AUTH DEBUG] Token prefix: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`); // Log token

    if (!token) {
        console.log('[AUTH DEBUG] No token - 401');
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error(`[AUTH DEBUG] Verify failed for ${req.path}:`, err.name, err.message); // Detailed error
            console.error(`[AUTH DEBUG] Decoded payload would be:`, decoded); // If partial
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token',
                debug: { errName: err.name, errMessage: err.message } // Temp for debug
            });
        }
        console.log(`[AUTH DEBUG] Success! UserId: ${decoded.userId}`); // Success
        req.userId = decoded.userId;
        next();
    });
}

module.exports = { authenticateToken };