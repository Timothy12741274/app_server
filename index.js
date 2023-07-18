const pool = require('./db.js')
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

app.use(express.static(dir))

app.use('/', router)

app.listen(5000, () => {
    pool.connect()
    console.log("Server is now listening at port 5000");
})







