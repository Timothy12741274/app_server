const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.get('/', async (req, res) => {
    const query = 'SELECT * FROM post_comments WHERE post_id = $1'

    const values = [ Number(req.query.postId) ]

    const { rows: comments} = await pool.query(query, values)

    return res.json({ comments }).status(200)
})

module.exports = router