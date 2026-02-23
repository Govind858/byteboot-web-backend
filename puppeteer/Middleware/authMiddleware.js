const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_change_me_in_production';

const verifyAdmin = (req, res, next) => {
    // 1. Get the token from the header (usually sent as "Bearer <token>")
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract just the token string
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. Attach the decoded payload (adminId, userName) to the request object
        req.admin = decoded; 
        
        // 4. Move to the next function/route
        next(); 
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = verifyAdmin;