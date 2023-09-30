const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.get('/', async (req, res) => {
    const { pageSize, pageCount } = req.query;

    const offset = (Number(pageCount) - 1) * Number(pageSize);

    const limit = Number(pageSize);

    const query = 'SELECT * FROM jobs LIMIT $1 OFFSET $2';

    const values = [limit, offset];

    const { rows } = await pool.query(query, values);

    return res.status(200).json(rows);
})

module.exports = router