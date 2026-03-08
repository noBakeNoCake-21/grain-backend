require('dotenv').config();
const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRETKEY;


function authyMiddlware(req, res, next) {

    try {
        if (!req.cookies.token) return res.status(401).json({ message: "invalid" });
        const token = req.cookies.token
        const decodedId = jwt.verify(token, secretKey);
        req.user = decodedId;
        next();

    } catch (error) {
        console.log(error, "what the fuck is the error ");
        res.status(401).json({ message: 'Invalid token' })
    }

}

module.exports = authyMiddlware; 