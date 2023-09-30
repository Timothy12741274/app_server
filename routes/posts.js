const Router = require('express').Router
const pool = require('../db')
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = new Router()

router.post('/get', async (req, res) => {
    const { ids } = req.body;

    const { rows } = await pool.query(`SELECT * FROM posts WHERE id IN (${ids})`)

    return res.status(200).json(rows);
})

router.get('/', async (req, res) => {
    let { pageSize, pageCount, pointer, userId } = req.query

    userId = Number(userId)

    pageSize = Number(pageSize)
    pageCount = Number(pageCount)
    pointer = Number(pointer)

    const from = pageSize * pageCount - 1, to = pageSize * pageCount

    console.log('from, to: ', from, to)

    // const query = 'SELECT * FROM posts WHERE (user_id = $1) BETWEEN $2 AND $3'

    const query = `SELECT *
FROM posts
WHERE user_id = $1
AND id BETWEEN (SELECT MAX(id) FROM posts) - $3 + 1 AND (SELECT MAX(id) FROM posts) - $2 + 1
ORDER BY id DESC;`

    const values = [ userId, from, to ]

    const { rows: posts } = await pool.query(query, values)

    return res.json({ posts })
})

router.post('/add_comment', async (req, res) => {
    let { text, userId, username } = req.body

    const query = ''
})

router.post('/add_post', upload.array('photos'), async (req, res) => {
    const { text } = req.body

    const { photos } = req.files

    const userId = Number(req.cookies.userId)

    let photoFileNames = []

    for (let i = 0; i < req.files.length; i++) {
        const p = req.files[i]

        photoFileNames.push(p.originalname)
    }

    const query = 'INSERT INTO posts (text, photo_urls, user_id) VALUES ($1, $2, $3)'

    const values = [ text, photoFileNames, userId ]

    pool.query(query, values)

    return res.json().status(200)
})

module.exports = router