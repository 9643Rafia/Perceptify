import api from './api';

const CertificatesAPI = {
  async getUserCertificates() {
    const response = await api.get('/certificates');
    return response.data;
  },

  async verifyCertificate(verificationCode) {
    const response = await api.get(`/certificates/verify/${verificationCode}`);
    return response.data;
  }
};

export default CertificatesAPI;
