require('dotenv').config();
const express = require('express');
const router = express.Router()
const connect = require('../db/grain_db_connect');
const authyMiddlware = require('../middleware/auth');
const upload = require('../middleware/multer.js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const cloudFlareAccessKeyR = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const cloudFlareSecretKeyR = process.env.CLOUDFLARE_R2_SECRET_KEY;
const cloudFlareEndPointR = process.env.CLOUDFLARE_R2_ENDPOINT;
const cloudFlareBuketR = process.env.CLOUDFLARE_R2_BUCKET;



const s3 = new S3Client({
    region: 'auto',
    endpoint: cloudFlareEndPointR,
    credentials: {
        accessKeyId: cloudFlareAccessKeyR,
        secretAccessKey: cloudFlareSecretKeyR,
    }
});


//Upload API 
router.route('/upload').post(authyMiddlware, upload.fields([{ name: 'posterFile' }]), async (req, res) => {
    try {

        const userId = req.user.id;
        console.log(userId);
        const posterFile = req.files.posterFile[0].buffer;
        const posterKey = `${Date.now()}_${req.files.posterFile[0].originalname}`;

        const cloudFlare = new PutObjectCommand({
            Bucket: cloudFlareBuketR,
            Key: posterKey,
            Body: posterFile
        });
        await s3.send(cloudFlare);

        const posterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_BUCKET}/${posterKey}`;

        const { title, description, genre, movieFile } = req.body;

        const result = await connect.query(
            "INSERT INTO movies (user_id, title, description, video_file, poster_file, genre) VALUES ($1, $2, $3, $4, $5, $6)",
            [userId, title, description, movieFile, posterUrl, genre]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'what is wrong?' });
    }
});

//User Profile API 
router.route('/:id').get(async (req, res) => {

    try {
        const id = req.params.id;
        const movies = await connect.query
            ("SELECT users.id, users.username, users.bio,  users.profile_pic, movies.id AS movie_id, movies.title, movies.poster_file, movies.video_file, movies.genre FROM users LEFT JOIN movies ON users.id = movies.user_id WHERE users.id = $1", [id]);

        const user = {
            id: movies.rows[0].id,
            username: movies.rows[0].username,
            bio: movies.rows[0].bio,
            profile_pic: movies.rows[0].profile_pic,
            movies: movies.rows.map(row => ({
                id: row.movie_id,
                title: row.title,
                poster_file: row.poster_file,
                video_file: row.video_file,
                genre: row.genre
            }))
        };
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'invalid' });
    }

});

//Dashboard API 
router.route('/delete-account').delete(authyMiddlware, async (req, res) => {

    try {
        const id = req.user.id;
        if (!id) return res.status(401).json({ message: 'invalid' });
        await connect.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: 'Success!' });

    } catch (error) {
        res.status(500).json({ message: 'invalid' });
    }

});


router.route('/logout').post(authyMiddlware, (req, res) => {

    res.clearCookie('token').json({ message: 'Logged out successfully' });
});

module.exports = router; 