const express = require('express');
let router = express.Router();
const connect = require('../db/grain_db_connect');
const authyMiddlware = require('../middleware/auth');
const upload = require('../middleware/multer');



//Homepage API 
router.route('/').get(async (req, res) => {
    const data = await connect.query("SELECT id, user_id, title, description, video_file, poster_file, genre, uploaded_on FROM movies");
    res.json(data.rows);
});

//Dashboard API - Get User Movies
router.route('/my-movies').get(authyMiddlware, async (req, res) => {
    try {
        const userId = req.user.id;
        const movieData = await connect.query
            ("SELECT id, user_id, title, description, video_file, poster_file, genre FROM movies WHERE user_id = $1", [userId]);
        res.json(movieData.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'invalid' });
    }
});

router.route('/:id').delete(authyMiddlware, async (req, res) => {

    try {
        const userId = req.user.id;          // logged-in user
        const movieId = req.params.id;       // movie to delete

        // Only delete if this movie belongs to the user
        const result = await connect.query(
            "DELETE FROM movies WHERE id = $1 AND user_id = $2 RETURNING *",
            [movieId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Movie not found or not yours" });
        }

        res.json({ message: "Movie deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
        console.log(error);
    }

});

//MoviePage API 
router.route('/:id').get(async (req, res) => {
    const specificMovie = req.params.id;
    const data = await connect.query("SELECT id, user_id, title, description, video_file, poster_file, genre, uploaded_on FROM movies WHERE id = $1", [specificMovie]);
    res.json(data.rows[0]);
});



module.exports = router;

