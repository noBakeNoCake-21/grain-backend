require('dotenv').config();
const { Router } = require('express');
const router = Router();
const connect = require('../db/grain_db_connect');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const upload = require('../middleware/multer.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { signupLimit } = require('../middleware/apiLimiter.js')

const cloudFlareAccessKeyR = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const cloudFlareSecretKeyR = process.env.CLOUDFLARE_R2_SECRET_KEY;
const cloudFlareEndPointR = process.env.CLOUDFLARE_R2_ENDPOINT;
const cloudFlareBuketR = process.env.CLOUDFLARE_R2_BUCKET;

const secretKey = process.env.SECRETKEY;

//Cloudflare client to the account it is going and the creds for that account. 
const s3 = new S3Client({
    region: 'auto',
    endpoint: cloudFlareEndPointR,
    credentials: {
        accessKeyId: cloudFlareAccessKeyR,
        secretAccessKey: cloudFlareSecretKeyR,
    }
});

// this is for the signup page on the frontend 
router.route('/').post(signupLimit, upload.fields([{ name: 'profilePic' }]), async (req, res) => {

    try {
        //Make sure all inputs are filled. 
        if (!req.body.firstName ||
            !req.body.lastName ||
            !req.body.username ||
            !req.body.email ||
            !req.body.password ||
            !req.files ||
            !req.files.profilePic ||
            !req.files.profilePic[0]) {
            return res.status(400).json({ error: "All fields are required" });
        }

        //Username validation regex
        const usernameRegex = /^[a-zA-Z0-9_-]{5,15}$/;
        if (!usernameRegex.test(req.body.username)) {
            return res.status(400).json({ error: "Invalid username" });
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ error: "Invalid email" });
        }

        // Password validation regex
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(req.body.password)) {
            return res.status(400).json({ error: "Weak password" });
        }


        //Check if the user exist in the database. 
        const duplicateCheck = await connect.query(
            "SELECT id, first_name, last_name, username, email FROM users WHERE username = $1 OR email = $2",
            [req.body.username, req.body.email]
        );
        if (duplicateCheck.rows.length > 0) {
            const existingUser = duplicateCheck.rows[0];
            let message = "User already exists: ";

            if (existingUser.username === req.body.username) message += `Username "${existingUser.username}" `;
            if (existingUser.email === req.body.email) message += `Email "${existingUser.email}"`;

            return res.status(409).json({ error: message.trim() });
        }

        //hash password 
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const profile_pic = req.files.profilePic[0].buffer;
        const profileKey = `${Date.now()}__${req.files.profilePic[0].originalname}`;

        //To what cloudflare bucket specifically? and the content of the bucket we are sending 
        const cloudFlare = new PutObjectCommand({
            Bucket: cloudFlareBuketR,
            Key: profileKey,
            Body: profile_pic,
            ContentType: req.files.profilePic[0].mimetype,
        });

        //send the bucket using the account we set up via the client. 
        await s3.send(cloudFlare);

        const profilePicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_BUCKET}/${profileKey}`;

        //insert user in database creating a user. then return the id from that user 
        const data = await connect.query
            ("INSERT INTO users (first_name, last_name, username, email, password, profile_pic, bio) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, profile_pic, bio ",
                [req.body.firstName, req.body.lastName, req.body.username, req.body.email, hashedPassword, profilePicUrl, req.body.bio]);

        //create token with the user id 
        const userInfo = data.rows[0]
        const token = jwt.sign({ id: userInfo.id }, secretKey, { expiresIn: '1d' });

        //send back jwt cookie and user created 
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json(userInfo)
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' })
        console.log(error);
    }

});

module.exports = router;  
