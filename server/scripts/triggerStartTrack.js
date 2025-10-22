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

async function startTrack(token, trackId) {
  const resp = await axios.post(`${API_BASE}/progress/tracks/${trackId}/start`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return resp.data;
}

(async () => {
  try {
    const token = await login();
    console.log('Got token');
    const trackId = '68f8017486c82c0ddd615546'; // beginner track
    const result = await startTrack(token, trackId);
    console.log('Start track result:', JSON.stringify(result, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('API error', err.response.status, err.response.data);
    } else {
      console.error('Error', err.message);
    }
    process.exit(1);
  }
})();