const {Pool} = require('pg')

const client = new Pool({
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    host: process.env.HOST,
})

module.exports = client