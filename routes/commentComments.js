const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.post('/', (req, res) => {
    let { text, commentId, username, avatarUrl } = req.body

    commentId = Number(commentId)

    const query = 'INSERT INTO comment_comments (text, comment_id, username, user_avatar_url) VALUES ($1, $2, $3, $4)'

    const values = [text, commentId, username, avatarUrl]

    pool.query(query, values)

    return res.json().status(200)
})

router.get('/', async (req, res) => {
    let { comment_id } = req.query
    comment_id = Number(comment_id)

    const query = 'SELECT * FROM comment_comments WHERE comment_id = $1'

    const values = [ comment_id ]

    const { rows: comments } = await pool.query(query, values)

    return res.json({ comments }).status(200)
})

module.exports = router