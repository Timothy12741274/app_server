const Router = require('express').Router
const pool = require('../db')

const router = new Router()

/*router.post('/:id', async (req, res) => {
    const { ids } = req.body;

    const { rows } = await pool.query(`SELECT * FROM comments WHERE id IN (${ids})`)

    return res.status(200).json(rows);
})*/

router.post('/', (req, res) => {
    const { text, userId} = req.body, query = `INSERT INTO comments (text, userId) VALUES ($1, $2)`, values = [text, userId]

    pool.query(query, values); return res.json().status(200)
})

module.exports = router