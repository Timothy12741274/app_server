const Router = require('express').Router
const pool = require('../db')

const router = new Router()

router.post('/', async (req, res) => {
    const { email, password } = req.body



    const query = 'SELECT * FROM users WHERE email = $1'

    const values = [ email ]

    let candidate

    try {
        const {rows: [candidateResoult]} = await pool.query(query, values)
        candidate = candidateResoult
    } catch (e) {
        return res.json({ message: 'User not found'}).status(401)
    }

    if (candidate.password !== password) {
        return res.json({ message: 'Email or password is incorrect'}).status(401)
    }

    return res.json({id: candidate.id})


})

router.get('/:id', async (req, res) => {
    const { id } = req.params

    const { rows } = await pool.query(`SELECT * FROM users WHERE id = ${id}`)

    return res.json(rows[0])
})



module.exports = router