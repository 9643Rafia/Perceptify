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

(async () => {
  try {
    const token = await login();
    console.log('Got token');
    const lessonId = '68f8017586c82c0ddd615555';
    const resp = await axios.get(`${API_BASE}/learning/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('GET lesson response:');
    console.dir(resp.data, { depth: 5 });
  } catch (err) {
    if (err.response) console.error('API error', err.response.status, err.response.data);
    else console.error('Error', err.message);
    process.exit(1);
  }
})();