const Router = require('express').Router
const pool = require('../db')
const {query} = require("express");
const router = new Router()
const path = require('path');

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

    return res.json(messages)
})

router.get('/get-user-messages/:id', async (req, res) => {
    let id = req.cookies.userId

    // let { id } = req.params
    let messages = []
try {
    ({rows: messages} = await pool.query(`
SELECT * FROM messages WHERE 
(from_user_id = ${id} OR to_user_id = ${id}) OR (from_user_id = ${id} OR ${id} = ANY(to_user_ids))
`))
} catch (e) {
    console.log('error in file ', path.basename(__filename), e, 'TEST', )
}

    return res.json(messages)
})

router.post('/resend', async (req, res) => {
    const { messages, items, time } = req.body

    // const itemIds = items.map(u => {u.id, )
    const itemIds = items.map(i => ({ isGroup: !!i.name, id: i.id }))

    let currentUsers = []
    let currentGroups = []

    const userIds = items.filter(i => !i.isGroup).map(u => u.id)
    // const groupIds = items.filter(i => i.isGroup).map(g => g.id)
    const userIdsOfEveryGroup = items.filter(i => !!i.name).map(g => g.user_ids)

    const groupUserIds = [].concat(...userIdsOfEveryGroup)

    const allUserIds = [...userIds, ...groupUserIds]

    try { ( { rows: currentUsers } = await pool.query(`SELECT * FROM users WHERE id IN(${allUserIds})`)) } catch (e) {
        console.log(e, 'an error has occurred')
    }

    try { ( { rows: currentGroups } = await pool.query(`SELECT * FROM users WHERE id IN(${groupUserIds})`)) } catch (e) {}

    const currentItems = [...currentUsers, ...currentGroups]



try {
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < messages.length; j++) {


            if (!itemIds[i].isGroup) {
                // console.log(currentUsers, items[i], 'THIS', itemIds[i].isGroup, items[i])
                const values = [time, messages[j].text, Number(req.cookies.userId), items[i].id, currentUsers.find(u => u.id === items[i].id).is_online, true, messages[j].message_to_answer_id]
                await pool.query(`INSERT INTO messages 
(time, text, from_user_id, to_user_id, read, resent, ${messages[j].messageToAnswerId ? 'message_to_answer_id' : ''}) 
VALUES ($1, $2, $3, $4, $5, $6, $7)`, values)
            } else {
                const values = [time, messages[j].text, Number(req.cookies.userId), items[i].user_ids.filter(id => id !== Number(req.cookies.userId)), items[i].id, !currentUsers.find(u => !u.read && userIdsOfEveryGroup[i].includes(u.id)), true, messages[j].message_to_answer_id]
                console.log(values, 'v')
                await pool.query(`INSERT INTO messages 
(time, text, from_user_id, to_user_ids, group_id, read, resent, ${messages[j].message_to_answer_id ? 'message_to_answer_id' : ''}) 
VALUES ($1, $2, $3, $4, $5, $6, $7)`, values)
            }
        }
    }
} catch (e) {
    console.log(e, 'actual error')
    return res.json({error: e}).status(500)
}

return res.json().status(200)
})

router.post('/', async (req, res) => {
    let { time, text, from_user_id /*to_user_id*/, isRead } = req.body

    const ids = req.body.to_user_id ?? req.body.to_user_ids

    const group_id = req.body.group_id ?? null

    const isToUserId = !!req.body.to_user_id
    // const { time, text, fromUserId, toUserId } = req.body

    // const { rows: [ { isOnline} ] } = await pool.query(`SELECT * FROM users WHERE id = ${to_user_id}`)
    const query = `INSERT INTO messages (time, text, from_user_id, ${isToUserId ? 'to_user_id' : 'to_user_ids'}, group_id, read, ${req.body.messageToAnswerId ? 'message_to_answer_id' : ''}) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
    // const query = `INSERT INTO messages (time, text, from_user_id, to_user_id, read) VALUES ($1, $2, $3, $4, $5) RETURNING id`
    const values = [time, text, from_user_id, ids, group_id, isRead, req.body.messageToAnswerId]

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

router.get('/added-messages', async (req, res) => {
    // console.log('max', req.query.max_message_id, 'id', )
    const { rows } = await pool.query(`
SELECT * FROM messages WHERE 
((from_user_id = ${req.cookies.userId} OR to_user_id = ${req.cookies.userId}) AND (id > ${req.query.max_message_id}))
OR 
((from_user_id = ${req.cookies.userId} OR ${req.cookies.userId} = ANY(to_user_ids)) AND (id > ${req.query.max_message_id}))
`)

    return res.json(rows).status(200)
})

router.post('/delete', async (req, res) => {
    const { messages, fromEveryone } = req.body

    const messageIds = messages.map(m => m.id)

    try {
        await pool.query(`UPDATE messages SET ${fromEveryone ? 'is_deleted' : 'is_deleted_from_me'} = true WHERE id IN (${messageIds})`)
    } catch (e) {
        console.log('HERE', e, messageIds, messages)
        return res.json({error: e}).status(500)
    }

    return res.json().status(200)

})



module.exports = router