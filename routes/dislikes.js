const Router = require('express').Router
const pool = require('../db')
const router = new Router()

router.post('/', async (req, res) => {
    const { commentId, postId, userId, isPost } = req.body, entityId = postId ?? commentId, entityName = postId ? 'post_id' : 'comment_id'

    const query = isPost ? `INSERT INTO dislikes ($3, userId) VALUES ($1, $2)` : `DELETE FROM dislikes WHERE $3 = $1 AND userId = $2`

    pool.query(query, [entityId, userId, entityName]); return res.json().status(200)
})

router.get('/:comment_id', async (req, res) => {
    const { comment_id } = req.params, { rows: dislikes} = await pool.query(`SELECT * FROM dislikes WHERE comment_id = ${comment_id}`);

    return res.json({ dislikes })

})

module.exports = router