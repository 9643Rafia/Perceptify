import api from './api';

const ForumAPI = {
  async getPosts(params = {}) {
    const response = await api.get('/forum/posts', { params });
    return response.data;
  },

  async createPost(content) {
    const response = await api.post('/forum/posts', { content });
    return response.data;
  },

  async addComment(postId, content) {
    const response = await api.post(`/forum/posts/${postId}/comments`, { content });
    return response.data;
  },

  async deletePost(postId) {
    const response = await api.delete(`/forum/posts/${postId}`);
    return response.data;
  },

  async deleteComment(postId, commentId) {
    const response = await api.delete(`/forum/posts/${postId}/comments/${commentId}`);
    return response.data;
  }
};

export default ForumAPI;
