// const {Pool} = require('pg')
// require('dotenv').config()
//
// const client = new Pool({
//     user: process.env.USER,
//     database: process.env.DATABASE,
//     password: process.env.PASSWORD,
//     port: process.env.PORT,
//     host: process.env.HOST,
// })
//
// module.exports = client
require('dotenv').config()

const pg = require('pg');
//or native libpq bindings
//var pg = require('pg').native

const conString = process.env.POSTGRES_URL //Can be found in the Details page
const client = new pg.Client(conString);

module.exports = client