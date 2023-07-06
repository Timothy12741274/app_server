const jobRouter = require('./jobs')
const userRouter = require('./users')
const postRouter = require('./posts')
const likeRouter = require('./likes')
const dislikeRouter = require('./dislikes')
const Router = require('express').Router

const router = new Router()

router.use('/jobs', jobRouter)
router.use('/users', userRouter)
router.use('/posts', postRouter)
router.use('/likes', likeRouter)
router.use('/dislikes', dislikeRouter)

module.exports = router
