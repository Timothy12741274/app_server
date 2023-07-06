const Router = require('express').Router
const pool = require('../db')

const router = new Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'путь_к_папке_сохранения'); // Укажите путь к папке, в которой будет сохраняться файл
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    console.log(req.paramsww)

    const { rows } = await pool.query(`SELECT * FROM users WHERE id = ${id}`)

    const user = rows[0]

    const users = await pool.query(`SELECT * FROM users WHERE id IN (${user.request_user_ids})`)

    const posts = await pool.query(`SELECT * FROM posts WHERE id IN (${user.post_ids})`)

    let comment_ids

    posts.map(p => comment_ids.push(...p.comment_ids))

    const comments = await pool.query(`SELECT * FROM posts WHERE id IN (${comment_ids})`)


    return res.status(200).json({user, users, posts, comments});
})
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

module.exports = router