const { getUserCertificates, verifyCertificate } = require('../services/certificate.service');

exports.getUserCertificates = async (req, res) => {
  try {
    const certificates = await getUserCertificates(req.user.id);
    res.json({ success: true, certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;
    const result = await verifyCertificate(verificationCode);
    res.json(result);
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};
