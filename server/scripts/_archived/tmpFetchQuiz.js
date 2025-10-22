const axios = require('axios');

(async () => {
  try {
    // Update credentials if needed - using test user from test.users.json
    const loginResp = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sohaibmayo12@gmail.com',
      password: 'Test@123'
    });

    const token = loginResp.data.token;
    console.log('Logged in, token:', token ? 'REDACTED' : 'none');

    const resp = await axios.get('http://localhost:5000/api/quizzes/quiz_1.1.1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Quiz response:');
    console.dir(resp.data, { depth: null });
  } catch (err) {
    console.error('Error fetching quiz:', err.response ? err.response.data : err.message);
  }
})();