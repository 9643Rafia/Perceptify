const axios = require('axios');

(async () => {
  try {
    const url = 'http://localhost:5000/media/videos/sample-video.mp4';
    console.log('Requesting Range 0-1023 from', url);
    const resp = await axios.get(url, {
      headers: { Range: 'bytes=0-1023' },
      responseType: 'arraybuffer',
      validateStatus: null
    });
    console.log('Status:', resp.status);
    console.log('Headers:', resp.headers);
    console.log('Bytes received:', resp.data ? resp.data.byteLength : 0);
  } catch (err) {
    console.error('Error:', err.message || err);
  }
})();