require('dotenv').config();
const express = require('express');
let router = express.Router();
const connect = require('../db/grain_db_connect');
const authyMiddlware = require('../middleware/auth');
const { movieHomepageLimit, movieSingleLimit, movieMyMovieLimit, movieDeleteLimit } = require('../middleware/apiLimiter');
const axios = require('axios');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');



const cloudflareAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareStreamToken = process.env.CLOUDFLARE_STREAM_TOKEN;

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

//Homepage API 
router.route('/').get(movieHomepageLimit, async (req, res) => {
    try {
        const data = await connect.query("SELECT id, user_id, title, description, video_file, poster_file, genre, uploaded_on FROM movies");
        res.json(data.rows);
    } catch (error) {
        console.log(err);
        res.status(500).json({ error: "Server error" });
    }
});

//Dashboard API - Get User Movies
router.route('/my-movies').get(authyMiddlware, movieMyMovieLimit, async (req, res) => {
    try {
        const userId = req.user.id;
        const movieData = await connect.query
            ("SELECT id, user_id, title, description, video_file, poster_file, genre FROM movies WHERE user_id = $1", [userId]);
        res.json(movieData.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'invalid' });
    }
});

//This deletes movies in the Database and in Cloudflare Stream. Fix this route to also delete the poster file r2 object storage. 
router.route('/:id').delete(authyMiddlware, movieDeleteLimit, async (req, res) => {

    try {
        const userId = req.user.id;          // logged-in user
        const movieId = req.params.id;       // movie to delete

        const userMovie = await connect.query(
            "SELECT id, poster_file, video_file FROM movies WHERE id = $1 AND user_id = $2",
            [movieId, userId]
        );

        if (userMovie.rowCount === 0) {
            return res.status(404).json({ error: "Movie not found or not yours" });
        }

        const movieFile = userMovie.rows[0].video_file;


        //Delete Movie on stream using the stream API 
        await axios.delete(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccount}/stream/${movieFile}`, {
            headers: {
                Authorization: `Bearer ${cloudflareStreamToken}`,
            }
        });

        // Delete the poster of movie 
        const posterFile = userMovie.rows[0].poster_file;
        const getKeyFromUrl = (url) => url.split('/').pop().split('?')[0];
        const posterKey = getKeyFromUrl(posterFile);

        if (posterFile) {
            await s3.send(new DeleteObjectCommand({
                Bucket: cloudFlareBuketR,
                Key: posterKey,
            }));
        }

        // Only delete if this movie belongs to the user
        const result = await connect.query(
            "DELETE FROM movies WHERE id = $1 AND user_id = $2 RETURNING *",
            [movieId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Movie not found or not yours" });
        }

        //Movie deleted Successfully
        res.json({ message: "Movie deleted successfully" });

    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
        console.log(error);
    }

});

//MoviePage API 
router.route('/:id').get(movieSingleLimit, async (req, res) => {
    try {
        const specificMovie = req.params.id;
        const data = await connect.query("SELECT id, user_id, title, description, video_file, poster_file, genre, uploaded_on FROM movies WHERE id = $1", [specificMovie]);
        res.json(data.rows[0]);
    } catch (error) {
        console.log(error);
        res.status().json({ error: "server Error" })
    }
});



module.exports = router;

