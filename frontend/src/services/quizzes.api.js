import api from './api';

const QuizzesAPI = {
  async getQuizById(quizId) {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  async submitQuiz(quizId, answers, timeSpent) {
    const response = await api.post(`/quizzes/${quizId}/submit`, { answers, timeSpent });
    return response.data;
  },

  async getLabById(labId) {
    const response = await api.get(`/quizzes/labs/${labId}`);
    return response.data;
  },

  async submitLab(labId, responses) {
    const response = await api.post(`/quizzes/labs/${labId}/submit`, { responses });
    return response.data;
  }
};

export default QuizzesAPI;
