const axios = require('axios');

const urls = [
  'http://localhost:5000/media/videos/sample-video.mp4',
  'http://localhost:5000/media/videos/ml-for-detection.mp4'
];

(async () => {
  for (const url of urls) {
    try {
      console.log('\nChecking URL:', url);
      const resp = await axios.head(url, { timeout: 5000 });
      console.log('Status:', resp.status);
      console.log('Headers:', resp.headers);
    } catch (err) {
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Headers:', err.response.headers);
      } else {
        console.log('Error:', err.message);
      }
    }
  }
})();