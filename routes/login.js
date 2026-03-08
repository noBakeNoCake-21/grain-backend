require('dotenv').config()
const { Router } = require('express');
const router = Router();
const connect = require('../db/grain_db_connect')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authyMiddlware = require('../middleware/auth');

const secretKey = process.env.SECRETKEY;

router.route('/').post(async (req, res) => {
    try {
        const user = req.body.email;

        const userP = await connect.query("SELECT id, username, email, profile_pic, password, bio FROM users WHERE email = $1", [user]);
        const data = userP.rows[0];

        if (!data) return res.status(404).json({ message: 'User does not exist' });

        const match = await bcrypt.compare(req.body.password, data.password);

        if (!match) return res.status(401).json({ message: "invalid" });

        const token = jwt.sign({ id: data.id }, secretKey, { expiresIn: '1d' });
        delete data.password;
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json(data);

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

router.route('/me').get(authyMiddlware, async (req, res) => {

    try {
        const id = req.user.id;
        const userP = await connect.query("SELECT id, username, email, profile_pic, password, bio FROM users WHERE id = $1", [id]);
        delete userP.rows[0].password;
        res.json(userP.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(401).json({ messaage: "error" });
    }


});



module.exports = router; 