/*
const Router = require('express').Router
const pool = require('../db')

const router = new Router()

/!*router.post('/:id', async (req, res) => {
    const { ids } = req.body;

    const { rows } = await pool.query(`SELECT * FROM comments WHERE id IN (${ids})`)

    return res.status(200).json(rows);
})*!/

router.post('/', (req, res) => {
    let { text, userId } = req.body

    userId = Number(userId)

    const query = `INSERT INTO comments (text, userId) VALUES ($1, $2)`, values = [text, userId]

    pool.query(query, values)

    return res.json().status(200)
})

module.exports = router*/

const Router = require('express').Router
const pool = require('../db')

const router = new Router()

/*router.post('/', (req, res) => {
    let { text, commentId, username, avatarUrl } = req.body

    console.log('body: ', req.body)

    commentId = Number(commentId)

    const query = 'INSERT INTO comment_comments (text, comment_id, username, user_avatar_url) VALUES ($1, $2, $3, $4)'

    const values = [text, commentId, username, avatarUrl]

    pool.query(query, values)

    return res.json().status(200)
})*/

router.post('/', (req, res) => {
    let { text, commentedElementId, commentedElementType, username, avatarUrl } = req.body
    commentedElementId = Number(commentedElementId)

    const query = 'INSERT INTO comments (text, commented_element_id, commented_element_type, username, user_avatar_url) VALUES ($1, $2, $3, $4, $5)'

    const values = [text, commentedElementId, commentedElementType, username, avatarUrl]

    pool.query(query, values)

    return res.json().status(200)
})

router.get('/', async (req, res) => {
    let { commented_element_id, commented_element_type } = req.query
    commented_element_id = Number(commented_element_id)

    const query = 'SELECT * FROM comments WHERE (commented_element_id = $1) AND (commented_element_type = $2)'

    const values = [ commented_element_id, commented_element_type ]

    const { rows: comments } = await pool.query(query, values)

    return res.json({ comments }).status(200)
})

router.post('/add_like', async (req, res) => {
    let { commented_element_id, isLiked } = req.query
    commented_element_id = Number(commented_element_id)

    const query = `
UPDATE comments 
SET liked_user_ids = ${
        isLiked ? `JSON_ARRAY_APPEND(liked_user_ids, '$', $1) `
        : `JSON_REMOVE(liked_user_ids, JSON_UNQUOTE(JSON_SEARCH(liked_user_ids, 'one', $1)))`
    }
WHERE commented_element_id = $2
`

    const values = [ req.cookies.userId, commented_element_id ]

    pool.query(query, values)

    return res.json().status(200)
})

module.exports = router