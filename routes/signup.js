require('dotenv').config();
const { Router } = require('express');
const router = Router();
const connect = require('../db/grain_db_connect');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const upload = require('../middleware/multer.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const cloudFlareAccessKeyR = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const cloudFlareSecretKeyR = process.env.CLOUDFLARE_R2_SECRET_KEY;
const cloudFlareEndPointR = process.env.CLOUDFLARE_R2_ENDPOINT;
const cloudFlareBuketR = process.env.CLOUDFLARE_R2_BUCKET;

const secretKey = process.env.SECRETKEY;


const s3 = new S3Client({
    region: 'auto',
    endpoint: cloudFlareEndPointR,
    credentials: {
        accessKeyId: cloudFlareAccessKeyR,
        secretAccessKey: cloudFlareSecretKeyR,
    }
});


router.route('/').post(upload.fields([{ name: 'profilePic' }]), async (req, res) => {

    try {

        //hash password 
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const profile_pic = req.files.profilePic[0].buffer;
        const profileKey = `${Date.now()}__${req.files.profilePic[0].originalname}`;


        const cloudFlare = new PutObjectCommand({
            Bucket: cloudFlareBuketR,
            Key: profileKey,
            Body: profile_pic,
            ContentType: req.files.profilePic[0].mimetype,
        });
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
        res.status(500).json({ message: 'Something went wrong' })
        console.log(error);
    }

});

module.exports = router;  
