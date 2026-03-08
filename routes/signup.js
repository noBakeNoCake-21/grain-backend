require('dotenv').config();
const { Router } = require('express');
const router = Router();
const connect = require('../db/grain_db_connect');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const secretKey = process.env.SECRETKEY;

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage });

router.route('/').post(upload.single('profilePic'), async (req, res) => {

    try {

        //hash password 
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const profile_pic = req.file ? req.file.path : null;
        console.log(profile_pic);
        //insert user in database creating a user. then return the id from that user 
        const data = await connect.query
            ("INSERT INTO users (first_name, last_name, username, email, password, profile_pic, bio) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, profile_pic, bio ",
                [req.body.firstName, req.body.lastName, req.body.username, req.body.email, hashedPassword, profile_pic, req.body.bio]);
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
