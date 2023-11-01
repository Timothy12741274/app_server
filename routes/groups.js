const Router = require('express').Router
const pool = require('../db')
const {query} = require("express");
const router = new Router()

router.post('/', async (req, res) => {
    const { userIds, createdAt, newGroupName /*createdAt, avatarUrls, description, mediaUrls*/ } = req.body

    console.log(userIds, createdAt)

    const query = 'INSERT INTO groups (user_ids, created_at, name /* created_at, avatar_urls, description, media_urls */) VALUES ($1, $2, $3 /* $2, $3, $4, $5 */) RETURNING *'
    const values = [userIds, createdAt, newGroupName /*createdAt, avatarUrls, description, mediaUrls*/]
    const { rows: [ createdGroup ] } = await pool.query(query, values)
    return res.json(createdGroup).status(200)
})

router.put('/add-member', async (req, res) => {
    const { userId, groupId } = req.body

    try {
        await pool.query(`UPDATE groups SET user_ids = array_append(user_ids, ${userId}) WHERE id = ${groupId}`)
    }catch (e) {
        console.log(e)
    } finally {
        return res.json().status(200)
    }

})

router.put('/delete-member', async (req, res) => {
    const { userId, groupId } = req.body

    try {
        await pool.query(`UPDATE groups SET user_ids = array_remove(user_ids, ${userId}) WHERE id = ${groupId}`)
    } catch (e) {
        console.log(e)
    } finally {
        return res.json().status(200)
    }
})

router.get('/get-group/:id', async (req, res) => {
    const { id } = req.params

    const { rows: [ group ] } = await pool.query(`SELECT * FROM groups WHERE id = ${id}`)

    return res.json(group).status(200)
})

router.get('/', async (req, res) => {
    const groups = await pool.query(`SELECT * FROM groups WHERE ${req.cookies.userId} = ANY(users)`)

    return res.json(groups)

})

router.put('/user', async (req, res) => {
    const { groupId, userId } = req.body

    await pool.query(`UPDATE groups SET user_ids = array_append(user_ids, ${userId}) WHERE id = ${groupId}`)

    return res.json().status(200)
})

router.delete('/user', async (req, res) => {
    const { group_id, user_id } = req.query

    await pool.query(`UPDATE groups SET user_ids = array_remove(user_ids, ${user_id}) WHERE id = ${group_id}`)

    return res.json().status(200)
})

module.exports = router

router.put('/description', async (req, res) => {
    const { text, groupId } = req.body

    await pool.query(`UPDATE group SET description = ${text} WHERE ${groupId}`)

    return res.json().status(200)
})

router.get('/group-status', async (req, res) => {
    const { group_ids } = req.body

    const { rows: [ group ]} = await pool.query(`SELECT * FROM groups WHERE id = ${group_id}`)

    const groupTypingUsers = await pool.query(`SELECT * FROM users WHERE id IN (${group.user_ids}) AND is_writing = true`)

    return res.json(groupTypingUsers)

})

module.exports = router

