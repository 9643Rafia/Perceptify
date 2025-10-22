const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/progress/lessons/68f84a3dced17f8d82aea8c2/complete', {
      timeSpent: 120,
      skipQuiz: true,
      forceModuleComplete: true
    }, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjdmZTkyZDJjODY5MjhjZGMxMDFiNSIsImVtYWlsIjoic29oYWlibWF5bzEyQGdtYWlsLmNvbSIsInJvbGUiOiJMZWFybmVyIiwic3RhdHVzIjoiYWN0aXZlIiwiaWF0IjoxNzYxMTAyMTE3LCJleHAiOjE3NjE3MDY5MTd9.HOnV1n-d4kAos0MPBwgHCqyb6Tll9sua4-9LyEJtAoM'
      }
    });
    console.log('SUCCESS', res.data);
  } catch (err) {
    console.error('FAILED', err.response ? err.response.data : err.message);
    process.exit(1);
  }
})();
