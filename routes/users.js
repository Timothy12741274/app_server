const Router = require('express').Router
const pool = require('../db')
const multer = require('multer')
// const {savedUsers} = require('../variables')
const router = new Router()
const path = require('path')
const {idle_in_transaction_session_timeout} = require("pg/lib/defaults");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/avatar', upload.single('uploadedPhoto'), (req, res) => {
    const filename = req.file.filename

    pool.query(`UPDATE users SET photo_urls = CASE WHEN photo_urls IS NULL THEN ARRAY[${filename}]ELSE array_append(photo_urls, ${filename}) END WHERE id = ${req.cookies.id};`)

    return res.json({}).status(200)
})

router.post('/post', (req, res) => {
    const photos  = req.files.map(f => f.filename)

    const { text } = req.body


    pool.query(`INSERT INTO posts (photo_urls, text) VALUES (${photos}, ${text})`)

    return res.json({}).status(200)
})

router.get('/get-user/:id', async (req, res) => {
    const query = 'SELECT * FROM users WHERE id = $1'
    const { id } = req.params

    const values = [ Number(id) ]

    const { rows: [ user ] } = await pool.query(query, values)

    return res.json( { user })
})

// let savedUsers

router.get('/get-users/:id', async (req, res) => {
    let { id } = req.params

    id = Number(id)

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


    let { rows: users } = await pool.query(`SELECT * FROM users WHERE id IN (${ids}) OR id = ${id}`)

    let { rows: groups } = await pool.query(`SELECT * FROM groups WHERE ${id} IN user_ids`)

    const { rows: [ { found_chat_from_search_ids } ] } = await pool.query(`SELECT * FROM users WHERE id = ${Number(req.cookies.userId)}`)

    let found_user_from_search_ids = []
    let found_group_from_search_ids = []

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
        const { rows: found_groups_from_search } = await pool.query(`SELECT * FROM users WHERE id IN (${found_group_from_search_ids})`)

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
    global.savedUsers = users
    console.log('savedUsers', global.savedUsers)
    return res.json({ users, groups })

})

router.post('/get-users', async (req, res) => {
    const { userIds } = req.body

    const { rows } = await pool.query(`SELECT * FROM users WHERE id = ANY(${userIds})`)

    return res.json(rows).status(200)
})

router.get('/', async (req, res) => {
    let { count } = req.query

    const users = await pool.query(`SELECT * FROM users LIMIT ${Number(count)}`)

    return res.json(users)

})

router.put('/update-recent', async (req, res) => {
    const { ids } = req.body


    // await pool.query(`UPDATE users SET found_user_from_search_ids = ARRAY${ids.join(',')} WHERE id = ${Number(req.cookies.userId)}`)
    await pool.query(`UPDATE users SET found_chat_from_search_ids = $1 WHERE id = $2`, [JSON.stringify(ids), req.cookies.userId])

    return res.json().status(200)
})

router.get('/find-users', async (req, res) => {
    const { v } = req.query


    const query = {
        text: `
    SELECT *
    FROM users
    WHERE 
        first_name ILIKE $1 || '%' OR
        second_name ILIKE $1 || '%' OR
        username LIKE $1 || '%' OR
        EXISTS (
            SELECT 1
            FROM unnest(string_to_array(username, '_')) AS sub_username
            WHERE sub_username ILIKE $1 || '%'
        )
  `,
        values: [`%${v}%`], // Добавляем знаки '%' для выполнения поиска с учетом совпадений внутри строки
    };

    const { rows } = await pool.query(query.text, query.values);

    return res.json(rows)

    return res.json(rows).status(200)
})

router.post('/:id/update-status', async (req, res) => {
    const { isOnline } = req.body

    const { id } = req.params

    if (!isOnline) {
        console.log(req.body.lastOnlineDate, 'A')
        const query = 'UPDATE users SET last_online_date = $1 WHERE id = $2'
        const values = [req.body.lastOnlineDate, id]
        try {
            await pool.query(query, values)
        } catch (e) {
            console.log(`Error in file ${path.basename(__filename)} at line ${error.stack.match(/:(\d+):\d+/)[1]}: ${error.message}`)
        }

    }


    console.log(isOnline, id, 'YYY')

    await pool.query(`UPDATE users SET is_online = ${isOnline} WHERE id = ${id}`)

    return res.json().status(200)
})

router.post('/:id/update-writing-status', async (req, res) => {
    const { isWriting } = req.body

    const { id } = req.params

    await pool.query(`UPDATE users SET is_writing = ${isWriting} WHERE id = ${id}`)

    return res.json().status(200)


})

router.get('/:id/get-user-status', async (req, res) => {
    const { id } = req.params

    const { rows: [ { is_online, is_writing } ] } = await pool.query(`SELECT * FROM users WHERE id = ${id}`)

    return res.json({ isOnline: is_online, isWriting: is_writing })


})

let typingUserChats
let typingUsersFromUserMessenger

router.get('/get-user-statuses', async (req, res) => {
    const { userId } = req.cookies

    if (!global.savedUsers) return res.json([])

    const savedUserIds = global.savedUsers.map(u => u.id)

    let newUsers = []

    if (savedUserIds.length > 0) {
        ({ rows: newUsers } = await pool.query(`SELECT * FROM users WHERE id IN (${savedUserIds})`))
    }

    const usersWithNewWritingStatus = newUsers.filter(u => u.is_writing !== global.savedUsers.find(su => su.id === u.id).is_writing)

    global.savedUsers = newUsers

    return res.json(usersWithNewWritingStatus)





//     if (typingUserChats) {
//         const usersToUpload = []
//         const { rows: uploadedTypingUserChats} = await pool.query(`SELECT * FROM users WHERE id IN (${typingUserChats.flat(1).map(u => u.id)})`)
//         uploadedTypingUserChats.sort((a, b) => a.id - b.id).map((u, i) => {
//             if (u.is_writing !== typingUsersFromUserMessenger[i].is_writing) usersToUpload.push(u)
//         })
//
//         return res.json(usersToUpload)
//     }
//
//
//
//     const { rows: messages } = await pool.query(`SELECT * FROM messages WHERE
// (from_user_id = ${userId} OR to_user_id = ${userId}) OR (from_user_id = ${id} OR ${id} = ANY(to_user_ids))
// `)
//
//     let ids = []
//     for (let i = 0; i < messages.length; i++) {
//         messages[i].from_user_id
//         if (messages[i].to_user_id) ids.push(messages[i].to_user_id)
//         else ids.push(...messages[i].to_user_ids)
//     }
//
//     ( { rows: typingUsersFromUserMessenger.sort((a, b) => a.id - b.id) } = await pool.query(`SELECT * FROM users WHERE id IN (${ids})`) )
//
//     typingUserChats = typingUsersFromUserMessenger.reduce((acc, user) => {
//         const chatId = user.chat_id;
//         if (!acc[chatId]) {
//             acc[chatId] = [];
//         }
//         acc[chatId].push(user);
//         return acc;
//     }, {})
//
//
//     return res.json(Object.values(typingUserChats))
//

})

module.exports = router