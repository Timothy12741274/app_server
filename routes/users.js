const Router = require('express').Router
const pool = require('../db')
const multer = require('multer')

const router = new Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/avatar', upload.single('uploadedPhoto'), (req, res) => {
    const filename = req.file.filename

    pool.query(`UPDATE users SET photo_urls = CASE WHEN photo_urls IS NULL THEN ARRAY[${filename}]ELSE array_append(photo_urls, ${filename}) END WHERE id = ${req.cookies.id};`)

    return res.json({}).status(200)
})

router.post('/post', (req, res) => {
    const photos  = req.files.map(f => f.filename)

    const { text } = req.body


    pool.query(`INSERT INTO posts (photo_urls, text) VALUES (${photos}, ${text})`)

    return res.json({}).status(200)
})

router.get('/me', async (req, res) => {
    const query = 'SELECT * FROM users WHERE id = $1'

    const values = [Number(req.cookies.userId)]

    const { rows: [ user ] } = await pool.query(query, values)

    return res.json( { user })
})

module.exports = router