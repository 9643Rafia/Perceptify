const express = require("express")
const router = express.Router()
const forumController = require("../controllers/forum.controller")
const authMiddleware = require("../middleware/auth.middleware")

// All forum routes require authentication
router.use(authMiddleware)

// Get all posts
router.get("/posts", forumController.getAllPosts)

// Get single post
router.get("/posts/:postId", forumController.getPost)

// Create new post
router.post("/posts", forumController.createPost)

// Add comment to post
router.post("/posts/:postId/comments", forumController.addComment)

// Delete post
router.delete("/posts/:postId", forumController.deletePost)

// Delete comment
router.delete("/posts/:postId/comments/:commentId", forumController.deleteComment)

module.exports = router
