const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function login() {
  const resp = await axios.post(`${API_BASE}/auth/login`, {
    email: 'sohaibmayo12@gmail.com',
    password: 'Test@123'
  });
  return resp.data.token;
}

async function startLesson(token, lessonId) {
  const resp = await axios.post(`${API_BASE}/progress/lessons/${lessonId}/start`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.data;
}

(async () => {
  try {
    const token = await login();
    console.log('Got token');
    const lessonId = '68f8017586c82c0ddd615555'; // sample lesson id
    const result = await startLesson(token, lessonId);
    console.log('Start lesson result:', JSON.stringify(result, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API error', err.response.status, err.response.data);
    } else {
      console.error('Error', err.message);
    }
    process.exit(1);
  }
})();