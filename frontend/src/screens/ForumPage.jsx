import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ForumPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // Comment state
  const [commentInputs, setCommentInputs] = useState({});
  const [addingComment, setAddingComment] = useState({});

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/forum/posts');

      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to fetch forum posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!newPostContent.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    try {
      setCreatingPost(true);
      setError('');
      setSuccess('');

      const response = await api.post('/forum/posts', {
        content: newPostContent
      });

      if (response.data.success) {
        setSuccess('Post created successfully!');
        setNewPostContent('');
        fetchPosts(); // Refresh posts

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  // Add comment to post
  const handleAddComment = async (postId) => {
    const commentContent = commentInputs[postId];

    if (!commentContent || !commentContent.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setAddingComment({ ...addingComment, [postId]: true });
      setError('');

      const response = await api.post(`/forum/posts/${postId}/comments`, {
        content: commentContent
      });

      if (response.data.success) {
        setCommentInputs({ ...commentInputs, [postId]: '' });
        fetchPosts(); // Refresh posts
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setAddingComment({ ...addingComment, [postId]: false });
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    try {
      setError('');
      const response = await api.delete(`/forum/posts/${postId}`);

      if (response.data.success) {
        setSuccess('Post deleted successfully!');
        fetchPosts(); // Refresh posts
        setShowDeleteModal(false);
        setDeleteTarget(null);

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.response?.data?.message || 'Failed to delete post');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      setError('');
      const response = await api.delete(`/forum/posts/${postId}/comments/${commentId}`);

      if (response.data.success) {
        setSuccess('Comment deleted successfully!');
        fetchPosts(); // Refresh posts
        setShowDeleteModal(false);
        setDeleteTarget(null);

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.response?.data?.message || 'Failed to delete comment');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (type, postId, commentId = null) => {
    setDeleteTarget({ type, postId, commentId });
    setShowDeleteModal(true);
  };

  // Execute delete based on type
  const executeDelete = () => {
    if (deleteTarget.type === 'post') {
      handleDeletePost(deleteTarget.postId);
    } else if (deleteTarget.type === 'comment') {
      handleDeleteComment(deleteTarget.postId, deleteTarget.commentId);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading forum posts...</p>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h1 className="mb-4">Community Forum</h1>
      <p className="text-muted mb-4">
        Share your thoughts, ask questions, and engage with the Perceptify community!
      </p>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Create New Post */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Create a New Post</h5>
          <Form onSubmit={handleCreatePost}>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Share your thoughts, questions, or experiences..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                maxLength={5000}
                disabled={creatingPost}
              />
              <Form.Text className="text-muted">
                {newPostContent.length}/5000 characters
              </Form.Text>
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              disabled={creatingPost || !newPostContent.trim()}
            >
              {creatingPost ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Forum Posts */}
      <h4 className="mb-3">Recent Posts</h4>
      {posts.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-chat-dots" style={{ fontSize: '3rem', color: '#ccc' }}></i>
            <p className="mt-3 text-muted">No posts yet. Be the first to start a discussion!</p>
          </Card.Body>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post._id} className="mb-4 shadow-sm">
            <Card.Body>
              {/* Post Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-person-circle me-2"></i>
                    {post.author?.fullName || 'Unknown User'}
                  </h6>
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    {formatDate(post.createdAt)}
                  </small>
                </div>
                {user && post.author?._id === user._id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => confirmDelete('post', post._id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                )}
              </div>

              {/* Post Content */}
              <Card.Text className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                {post.content}
              </Card.Text>

              {/* Comments Section */}
              <div className="border-top pt-3">
                <h6 className="mb-3">
                  <i className="bi bi-chat-left-text me-2"></i>
                  Comments ({post.comments?.length || 0})
                </h6>

                {/* Display Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mb-3">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="mb-3 ps-3 border-start border-3 border-primary">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <small className="fw-bold">
                              {comment.author?.fullName || 'Unknown User'}
                            </small>
                            <small className="text-muted ms-2">
                              {formatDate(comment.createdAt)}
                            </small>
                            <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                              {comment.content}
                            </p>
                          </div>
                          {user && comment.author?._id === user._id && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger p-0 ms-2"
                              onClick={() => confirmDelete('comment', post._id, comment._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleAddComment(post._id);
                }}>
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => setCommentInputs({
                        ...commentInputs,
                        [post._id]: e.target.value
                      })}
                      maxLength={1000}
                      disabled={addingComment[post._id]}
                    />
                  </Form.Group>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    type="submit"
                    disabled={addingComment[post._id] || !commentInputs[post._id]?.trim()}
                  >
                    {addingComment[post._id] ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </Button>
                </Form>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ForumPage;
