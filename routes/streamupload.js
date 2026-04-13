require('dotenv').config();
const express = require('express');
const authyMiddlware = require('../middleware/auth.js')

const acccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;

const router = express.Router();
const axios = require('axios');
const { uploadLimit } = require('../middleware/apiLimiter.js')


//Upload API for uploading movies to clouldflare
//This API is sending the frontend a link to upload. The frontend then takes care of uploading. Yeah I know
router.post('/streamupload', authyMiddlware, uploadLimit, async (req, res) => {
    try {
        const uploadLength = req.headers['upload-length'];
        const uploadMetadata = req.headers['upload-metadata'];
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${acccountId}/stream?direct_user=true`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${streamToken}`,
                    "Tus-Resumable": "1.0.0",
                    'Upload-Length': uploadLength,
                    'Upload-Metadata': uploadMetadata,
                }
            }

        );

        const location = response.headers.location;
        res.set({
            'Access-Control-Expose-Headers': 'Location',
            'Location': location,
        });
        res.status(201).send();


    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Failed to create upload URL" });
    }
});


module.exports = router; 