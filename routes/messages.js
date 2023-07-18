const Router = require('express').Router
const pool = require('../db')
const router = new Router()

router.get('/', async (req, res) => {
    const { firstUserId, secondUserId } = req.params

    const MessagesQuery = `SELECT * FROM messages WHERE (from = $1 OR from = $2) AND (to = $1 OR to = $2)`
    const MessagesValues = values = [firstUserId, secondUserId]


    const companionUserId = req.cookies.userId === firstUserId ? firstUserId : secondUserId

    const UsersQuery = `SELECT * FROM users WHERE id = $1`
    const UsersValues = [companionUserId]

    const {rows: [companionData]} = await pool.query(UsersQuery, UsersValues)

    const {rows: messages} = await pool.query(MessagesQuery, MessagesValues);

    return res.json({ messages, companionData })
})

module.exports = router