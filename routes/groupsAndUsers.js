const Router = require('express').Router
const pool = require('../db')
// let {savedUsers} = require('../variables')
const router = new Router()


router.get('/', async (req, res) => {
    let id = Number(req.cookies.userId)

    let foundMessages = []
    // try {
    //     const { rows: messages } = await pool.query(`SELECT * FROM messages WHERE from_user_id = ${id} OR to_user_id = ${id}`)
    //     console.log('a')
    //     return res.json(messages).status(200)
    // } catch (e) {
    //     console.log('b')
    //     return res.json([]).status(200)
    // }
    const { rows: messages } = await pool.query(`SELECT * FROM messages WHERE from_user_id = ${id} OR to_user_id = ${id}`)

    let ids = []

    if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
            const toUserId = messages[i].to_user_id

            if (ids.includes(toUserId) || ids.includes(messages[i].from_user_id)) continue

            if (toUserId !== id) ids.push(toUserId)
            else ids.push(messages[i].from_user_id)
        }

        for (let i = 0; i < ids.length; i++) {
            ids[i] = Number(ids[i])
        }
    }

    try {
        await pool.query(`UPDATE users SET is_online = true WHERE id = ${req.cookies.userId}`)
    } finally {
        let {rows: users} = await pool.query(`SELECT * FROM users WHERE id IN (${ids}) OR id = ${id}`)

        let {rows: groups} = await pool.query(`SELECT * FROM groups WHERE ${id} = ANY(user_ids)`)
        console.log('groups1', groups)

        const {rows: [{found_chat_from_search_ids}]} = await pool.query(`SELECT * FROM users WHERE id = ${Number(req.cookies.userId)}`)

        let found_user_from_search_ids = []
        let found_group_from_search_ids = []

        if (found_chat_from_search_ids)
            for (let i = 0; i < found_chat_from_search_ids.length; i++) {
                const currChat = found_chat_from_search_ids[i]
                if (currChat.isUser) found_user_from_search_ids.push(currChat.id)
                else found_group_from_search_ids.push(currChat.id)
            }

        if (found_user_from_search_ids.length !== 0) {
            const {rows: found_users_from_search} = await pool.query(`SELECT * FROM users WHERE id IN (${found_user_from_search_ids})`)

            const usernames = new Set()

            users.push(...found_users_from_search)

            users = users.filter(u => {
                if (!usernames.has(u.username)) {
                    usernames.add(u.username)
                    return true
                }
                return false
            })

            // const allUsers = [...users, ...found_users_from_search]
            //     .filter(u => {
            //         if (!usernames.has(u.username)) {
            //             usernames.add(u.username)
            //             return true
            //         }
            //         return false
            // })
            // savedUsers = allUsers
            // return res.json(allUsers)
        } /*else {*/
        // savedUsers = users
        // return res.json(users)
        // }
        if (found_group_from_search_ids.length !== 0) {
            const {rows: found_groups_from_search} = await pool.query(`SELECT * FROM groups WHERE id IN (${found_group_from_search_ids})`)

            groups.push(...found_groups_from_search)

            let groupIds = new Set()

            groups = groups.filter(u => {
                if (!groupIds.has(u.id)) {
                    groupIds.add(u.id)
                    return true
                }
                return false
            })
        }
        console.log('groups2', groups)

        const lackingUserIds = groups.map(g => g.user_ids.filter(id => !users.find(u => u.id === id))).flat(1)

        const { rows: lackingUsers } = await pool.query(`SELECT * FROM users WHERE id IN (${lackingUserIds})`)

        users.push(...lackingUsers)

        global.savedUsers = users

        console.log('savedUsers in group_and_users endpoint', global.savedUsers && global.savedUsers.length)

        return res.json({users, groups})
    }
})



module.exports = router