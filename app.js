const express = require('express');
const app = express();
const connect = require('./db/grain_db_connect');
const movieRouter = require('./routes/movies.js');
const loginRouter = require('./routes/login.js');
const signupRouter = require('./routes/signup.js');
const profileRouter = require('./routes/users.js');
const streamupload = require('./routes/streamupload.js')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads')); // take out for deployment 

const allowedOrigins = [
    'https://grain-frontend.grainstreaming.workers.dev',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: function (origin, callback) {

        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

console.log("route hit app");

app.use('/api/movies', movieRouter);

app.use('/api/login', loginRouter);

app.use('/api/signup', signupRouter);

app.use('/api/users', profileRouter);

app.use('/api/users', streamupload);




app.listen(PORT, () => console.log(`Server running on ${PORT}`));