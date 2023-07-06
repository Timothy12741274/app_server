const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.get('/', async (req, res) => {
    const { pageSize, pageCount } = req.query;
    //console.log(pageSize, pageCount)
    console.log('params', req.params)

    const offset = (Number(pageCount) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const query = 'SELECT * FROM jobs LIMIT $1 OFFSET $2';
    const values = [limit, offset];

    const { rows } = await pool.query(query, values);

    return res.status(200).json(rows);
})
router.get('/test', async (req, res) => {
    console.log(req.query)
    return res.json(req.query)
})

module.exports = router