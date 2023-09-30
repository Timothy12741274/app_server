const Router = require('express').Router
const pool = require('../db')
const multer = require('multer')

const router = new Router()

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


    const { rows: users } = await pool.query(`SELECT * FROM users WHERE id IN (${ids}) OR id = ${id}`)
    console.log('users1', users)

    const { rows: [ { found_user_from_search_ids } ] } = await pool.query(`SELECT * FROM users WHERE id = ${Number(req.cookies.userId)}`)

    if (found_user_from_search_ids.length !== 0) {
        const {rows: found_users_from_search} = await pool.query(`SELECT * FROM users WHERE id IN (${found_user_from_search_ids})`)

        const usernames = new Set()

        const allUsers = [...users, ...found_users_from_search]
            .filter(u => {
                if (!usernames.has(u.username)) {
                    usernames.add(u.username)
                    return true
                }
                return false
        })
        console.log('i', allUsers)
        return res.json(allUsers)
    } else {
        console.log('u', users)
        return res.json(users)
    }

})

router.get('/', async (req, res) => {
    let { count } = req.query

    const users = await pool.query(`SELECT * FROM users LIMIT ${Number(count)}`)

    return res.json(users)

})

router.put('/update-recent', async (req, res) => {
    const { ids } = req.body

    console.log("ids", ids)


    // await pool.query(`UPDATE users SET found_user_from_search_ids = ARRAY${ids.join(',')} WHERE id = ${Number(req.cookies.userId)}`)
    await pool.query(`UPDATE users SET found_user_from_search_ids = $1 WHERE id = $2`, [ids, req.cookies.userId])

    return res.json().status(200)
})

router.get('/find-users', async (req, res) => {
    const { v } = req.query

    console.log('v', v)

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

module.exports = router