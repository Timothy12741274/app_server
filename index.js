const client = require('./db.js')
// const pool = require('./db.js')
const express = require('express');
const app = express();
const cors = require('cors')
const router =  require('./routes/index')
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

const dir = path.join(__dirname, 'uploads');
const dir2 = path.join(__dirname, 'downloads/message-photos')

app.use(express.static(dir))
app.use(express.static(dir2))

app.use('/', router)

app.listen(5000, () => {
    // pool.connect()
    client.connect(function(err) {
        if(err) {
            return console.error('could not connect to postgres', err);
        }
        client.query('SELECT NOW() AS "theTime"', function(err, result) {
            if(err) {
                return console.error('error running query', err);
            }
            console.log(result.rows[0].theTime);
            // >> output: 2018-08-23T14:02:57.117Z
            //client.end();
        });
    });
    console.log("Server is now listening at port 5000");
})







