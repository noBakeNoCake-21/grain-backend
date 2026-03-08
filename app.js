const express = require('express');
const app = express();
const connect = require('./db/grain_db_connect');
const movieRouter = require('./routes/movies.js');
const loginRouter = require('./routes/login.js');
const signupRouter = require('./routes/signup.js');
const profileRouter = require('./routes/users.js');
const cookieParser = require('cookie-parser');
const cors = require('cors');



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads')); // take out for deployment 

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

console.log("route hit app");

app.use('/api/movies', movieRouter);

app.use('/api/login', loginRouter);

app.use('/api/signup', signupRouter);

app.use('/api/users', profileRouter);




app.listen(3000, () => {
    console.log("Server Up and Running");
});