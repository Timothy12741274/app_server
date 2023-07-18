const jobRouter = require('./jobs')
const userRouter = require('./users')
const postRouter = require('./posts')
const likeRouter = require('./likes')
const dislikeRouter = require('./dislikes')
const messagesRouter = require('./messages')
const authRouter = require('./auth')
const postCommentRouter = require('./postComments')
const commentCommentRouter = require('./commentComments')
const commentRouter = require('./comments')
const Router = require('express').Router

const router = new Router()

router.use('/jobs', jobRouter)
router.use('/users', userRouter)
router.use('/posts', postRouter)
router.use('/likes', likeRouter)
router.use('/dislikes', dislikeRouter)
router.use('/messages', messagesRouter)
router.use('/auth', authRouter)
router.use('/post_comments', postCommentRouter)
router.use('/comment_comments', commentCommentRouter)
router.use('/comments', commentRouter)

module.exports = router
