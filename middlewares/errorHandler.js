require('dotenv').config()
const productionUrl = process.env.APP_URL


const errorHandler = (err, req, res, next) => {
    let customError = { message: err.message }; 
    // Check for Token Expiration error
    if (err.name === "TokenExpiredError") {
        customError.message = "Token has expired and cannot be used";
        // Clear the token cookie
        res.clearCookie('token');
        return res.status(401).send(`
            <h2>${customError.message}</h2><br>
            <a href="${productionUrl}/login">Login Again</a>
        `);
    } else {
        // Handle other errors
        return res.status(401).send(customError.message);
    }
    
};

module.exports = errorHandler;
