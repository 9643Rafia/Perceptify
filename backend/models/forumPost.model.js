const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "Comment content is required"],
    trim: true,
    minlength: [1, "Comment must not be empty"],
    maxlength: [1000, "Comment must not exceed 1000 characters"]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Comment author is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const forumPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "Post content is required"],
    trim: true,
    minlength: [1, "Post must not be empty"],
    maxlength: [5000, "Post must not exceed 5000 characters"]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Post author is required"]
  },
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const ForumPost = mongoose.model("ForumPost", forumPostSchema)

module.exports = ForumPost
