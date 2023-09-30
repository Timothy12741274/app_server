const Router = require('express').Router
const pool = require('../db')
const {query} = require("express");
const router = new Router()

router.get('/', async (req, res) => {
    let { firstUserId, secondUserId } = req.query

    if (secondUserId === undefined) secondUserId = -1

    const query = `SELECT * FROM messages WHERE (from_user_id = $1 OR from_user_id = $2) AND (to_user_id = $1 OR to_user_id = $2)`

    const values = [firstUserId, secondUserId]


    // const companionUserId = req.cookies.userId !== firstUserId ? firstUserId : secondUserId

    // const UsersQuery = `SELECT * FROM users WHERE id = $1`
    // const UsersValues = [companionUserId]

    // console.log('ids', req.params, req.query)
    // const {rows: [companionData]} = await pool.query(UsersQuery, UsersValues)

    const {rows: messages} = await pool.query(query, values);

    console.log('m', messages)
    return res.json(messages)
})

router.get('/get-user-messages/:id', async (req, res) => {
    let { id } = req.params

    const { rows: messages } = await pool.query(`SELECT * FROM messages WHERE (from_user_id = ${id} OR to_user_id = ${id})`)

    return res.json(messages)
})

router.post('/', async (req, res) => {
    const { time, text, from_user_id, to_user_id, isRead } = req.body
    // const { time, text, fromUserId, toUserId } = req.body

    const { rows: [ { isOnline} ] } = await pool.query(`SELECT * FROM users WHERE id = ${to_user_id}`)

    const query = `INSERT INTO messages (time, text, from_user_id, to_user_id, read) VALUES ($1, $2, $3, $4, $5) RETURNING id`
    // const query = `INSERT INTO messages (time, text, from_user_id, to_user_id, read) VALUES ($1, $2, $3, $4, $5) RETURNING id`

    const values = [time, text, from_user_id, to_user_id, isRead]

/*    try {
        const result = await pool.query(query, values)
    } finally {
        const { rows } = await pool.query(`SELECT * FROM messages WHERE id = ${(здесь нужен result)}`)

        return res.json(rows).status(200)
    }*/

/*    pool.query({ query, values }, async ( { rows: [ { id } ] } ) => {
        const { rows: [ newMessage ] } = await pool.query(`SELECT * FROM messages WHERE id = ${id}`, values)
        console.log(newMessage)
        return res.json(newMessage).status(200)
    })*/

    const { rows: [ { id } ] } = await pool.query(query, values)

    const { rows: [ newMessage ] } = await pool.query(`SELECT * FROM messages WHERE id = ${id}`)

    return res.json(newMessage).status(200)
    // pool.query({ query, values }, async ( { rows: [ { id } ] } ) => {
    //     const { rows: [ newMessage ] } = await pool.query(`SELECT * FROM messages WHERE id = ${id}`, values)
    //     console.log(newMessage)
    //     return res.json(newMessage).status(200)
    // })

/*    console.log(result)

    res.json().status(200)*/
/*    pool.query(query, values, async () => {
        const { rows: [ newMessage ] } = await pool.query(`SELECT * FROM messages WHERE time = $1 AND text = $2 AND from_user_id = $2 AND to_user_id = $4`, values)

        return res.json(newMessage).status(200)
    })*/

})

router.put('/:id', (req, res) => {
    const { id } = req.params

    pool.query(`UPDATE messages SET read = true WHERE id = ${id}`)

    return res.json().status(200)
})

module.exports = router