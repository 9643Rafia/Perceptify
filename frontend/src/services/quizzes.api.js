import api from './api';

const enc = encodeURIComponent;

const QuizzesAPI = {
  async getQuizById(quizId) {
    const response = await api.get(`/quizzes/${enc(quizId)}`);
    return response.data;
  },

  async submitQuiz(quizId, answers, timeSpent) {
    const response = await api.post(`/quizzes/${enc(quizId)}/submit`, { answers, timeSpent });
    return response.data;
  },

  async getLabById(labId) {
    const response = await api.get(`/quizzes/labs/${enc(labId)}`);
    return response.data;
  },

  async submitLab(labId, responses) {
    const response = await api.post(`/quizzes/labs/${enc(labId)}/submit`, { responses });
    return response.data;
  }
};

export default QuizzesAPI;
