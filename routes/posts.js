const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.post('/:id', async (req, res) => {
    const { ids } = req.body;

    const { rows } = await pool.query(`SELECT * FROM posts WHERE id IN (${ids})`)

    return res.status(200).json(rows);
})

module.exports = router