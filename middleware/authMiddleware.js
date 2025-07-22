const logger = require('../utils/logger');

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if(!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn(`Unauthorized access attempt to ${req.method} ${req.url}`);

        return res.status(401).json({success: false, error:'Invalid or missing API key' });
    }
    logger.info(`Authenticated request to ${req.method} ${req.url}`);
    next();
};
module.exports = { verifyApiKey };
