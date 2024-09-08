const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const secretKey = process.env.JWT_SECRET_KEY;

const authenticate = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ message: 'User is not logged in' });
    }

    jwt.verify(token.replace("Bearer ", ""), secretKey, async (err, payload) => {
        if (err) {
            return next(err); // Pass the error to the error handler
        }

        try {
            const user = await User.findById(payload.userId);
            if (!user) {
                return res.status(401).json({ message: 'Invalid token: user not found' });
            }

            req.user = {
                userId: payload.userId,
                email: payload.userEmail,
                role: payload.userRole,
                token
            };
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token', error });
        }
    });
};

module.exports = authenticate;
