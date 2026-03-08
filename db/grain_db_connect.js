require('dotenv').config();
const pg = require('pg');



const grainDatabase = process.env.DATABASE_URL;

const connect = new pg.Pool({ connectionString: grainDatabase });



module.exports = connect;


