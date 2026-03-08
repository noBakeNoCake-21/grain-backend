require('dotenv').config();
const pg = require('pg');
const bcrypt = require('bcrypt');

const grainDatabase = process.env.DATABASE_URL;

const connect = new pg.Pool({ connectionString: grainDatabase });

const users = [
    { first_name: 'John', last_name: 'Smith', username: 'johnsmith', email: 'john@email.com', password: 'password123', profile_pic: null, bio: 'Film enthusiast', tier: 'free' },
    { first_name: 'Sarah', last_name: 'Johnson', username: 'sarahj', email: 'sarah@email.com', password: 'password123', profile_pic: null, bio: 'I love indie films', tier: 'premium' },
    { first_name: 'Marcus', last_name: 'Williams', username: 'marcusw', email: 'marcus@email.com', password: 'password123', profile_pic: null, bio: 'Documentary lover', tier: 'free' },
    { first_name: 'Priya', last_name: 'Patel', username: 'priyap', email: 'priya@email.com', password: 'password123', profile_pic: null, bio: 'Sci-fi fanatic', tier: 'pro' },
    { first_name: 'James', last_name: 'Brown', username: 'jamesb', email: 'james@email.com', password: 'password123', profile_pic: null, bio: 'Horror movie buff', tier: 'free' },
];

const movies = [
    { user_id: 1, title: 'Neon Requiem', description: 'A cyberpunk detective hunts a killer through a rain soaked city', video_file: 'neon_requiem.mp4', poster_file: null, genre: 'Thriller' },
    { user_id: 2, title: 'The Last Horizon', description: 'An astronaut stranded in deep space fights to survive', video_file: 'last_horizon.mp4', poster_file: null, genre: 'Sci-Fi' },
    { user_id: 3, title: 'Echoes of War', description: 'A documentary following veterans returning home', video_file: 'echoes_of_war.mp4', poster_file: null, genre: 'Documentary' },
    { user_id: 4, title: 'Crimson Tide Rising', description: 'A small town is terrorized by an unknown creature from the deep', video_file: 'crimson_tide.mp4', poster_file: null, genre: 'Horror' },
    { user_id: 5, title: 'Whispers in the Wind', description: 'A love story set against the backdrop of the civil rights movement', video_file: 'whispers_wind.mp4', poster_file: null, genre: 'Drama' },
    { user_id: 1, title: 'Digital Ghost', description: 'A hacker discovers a conspiracy that goes all the way to the top', video_file: 'digital_ghost.mp4', poster_file: null, genre: 'Thriller' },
    { user_id: 2, title: 'Beyond the Stars', description: 'First contact with an alien civilization changes humanity forever', video_file: 'beyond_stars.mp4', poster_file: null, genre: 'Sci-Fi' },
];


async function seedData() {
    for (let user of users) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    await connect.query('TRUNCATE movies, users RESTART IDENTITY CASCADE');

    for (let user of users) {
        await connect.query(
            `INSERT INTO users (first_name, last_name, username, email, password, profile_pic, bio, tier) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [user.first_name, user.last_name, user.username, user.email, user.password, user.profile_pic, user.bio, user.tier]
        );
    }

    for (let movie of movies) {
        await connect.query(
            `INSERT INTO movies (user_id, title, description, video_file, poster_file, genre) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
            [movie.user_id, movie.title, movie.description, movie.video_file, movie.poster_file, movie.genre]
        );
    }

    console.log("database filled");

    connect.end();
}

seedData(); 
