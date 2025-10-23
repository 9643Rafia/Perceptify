const ForumPost = require("../models/forumPost.model")

// Validation helper
const validatePostContent = (content) => {
  if (!content || typeof content !== 'string') {
    return "Post content is required"
  }
  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return "Post content cannot be empty"
  }
  if (trimmedContent.length > 5000) {
    return "Post content must not exceed 5000 characters"
  }
  return null
}

const validateCommentContent = (content) => {
  if (!content || typeof content !== 'string') {
    return "Comment content is required"
  }
  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return "Comment content cannot be empty"
  }
  if (trimmedContent.length > 1000) {
    return "Comment content must not exceed 1000 characters"
  }
  return null
}

// Get all forum posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate("author", "fullName email")
      .populate("comments.author", "fullName email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: posts
    })
  } catch (error) {
    console.error("Error fetching forum posts:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch forum posts",
      error: error.message
    })
  }
}

// Get single forum post
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params

    const post = await ForumPost.findById(postId)
      .populate("author", "fullName email")
      .populate("comments.author", "fullName email")

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found"
      })
    }

    res.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error("Error fetching forum post:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch forum post",
      error: error.message
    })
  }
}

// Create new forum post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body
    const userId = req.user.userId

    // Validate input
    const validationError = validatePostContent(content)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      })
    }

    const newPost = new ForumPost({
      content: content.trim(),
      author: userId
    })

    await newPost.save()

    // Populate author details before sending response
    await newPost.populate("author", "fullName email")

    res.status(201).json({
      success: true,
      message: "Forum post created successfully",
      data: newPost
    })
  } catch (error) {
    console.error("Error creating forum post:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create forum post",
      error: error.message
    })
  }
}

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params
    const { content } = req.body
    const userId = req.user.userId

    // Validate input
    const validationError = validateCommentContent(content)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      })
    }

    const post = await ForumPost.findById(postId)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found"
      })
    }

    const newComment = {
      content: content.trim(),
      author: userId,
      createdAt: new Date()
    }

    post.comments.push(newComment)
    await post.save()

    // Populate author details
    await post.populate("author", "fullName email")
    await post.populate("comments.author", "fullName email")

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: post
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message
    })
  }
}

// Delete forum post (only by author)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId

    const post = await ForumPost.findById(postId)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found"
      })
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts"
      })
    }

    await ForumPost.findByIdAndDelete(postId)

    res.json({
      success: true,
      message: "Forum post deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting forum post:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete forum post",
      error: error.message
    })
  }
}

// Delete comment (only by comment author)
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params
    const userId = req.user.userId

    const post = await ForumPost.findById(postId)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Forum post not found"
      })
    }

    const comment = post.comments.id(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      })
    }

    // Check if user is the comment author
    if (comment.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      })
    }

    comment.deleteOne()
    await post.save()

    // Populate author details
    await post.populate("author", "fullName email")
    await post.populate("comments.author", "fullName email")

    res.json({
      success: true,
      message: "Comment deleted successfully",
      data: post
    })
  } catch (error) {
    console.error("Error deleting comment:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message
    })
  }
}
