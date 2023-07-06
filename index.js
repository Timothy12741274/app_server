const pool = require('./db.js')
const express = require('express');
const app = express();
const cors = require('cors')
const router =  require('./routes/index')
const cookieParser = require('cookie-parser')

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))


app.use('/', router)
/*app.post('/testi', (req, res) => {
    console.log('body', req.body)
    return res.status(200).json(req.body)
})*/

app.listen(5000, ()=>{
    pool.connect()
    console.log("Server is now listening at port 5000");
})







