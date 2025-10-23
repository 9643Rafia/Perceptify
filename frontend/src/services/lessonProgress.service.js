import api from './api';

const LessonProgressAPI = {
  async startLesson(lessonId) {
    console.log("Starting lesson with ID:", lessonId);
    const response = await api.post(`/progress/lesson/${lessonId}/start`);
    console.log("Started lesson response:", response);
    return response.data;
  },

  async updateLessonProgress(lessonId, data) {
    const response = await api.put(`/progress/lesson/${lessonId}/update`, data);
    return response.data;
  },

  async completeLesson(lessonId, timeSpent) {
    const body = { timeSpent };
    const response = await api.post(`/progress/lesson/${lessonId}/complete`, body);
    return response.data;
  }
};

export default LessonProgressAPI;
