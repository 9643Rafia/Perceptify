const Certificate = require('../models/certificate.model');

/**
 * Fetch all valid certificates of a user.
 */
async function getUserCertificates(userId) {
  const certificates = await Certificate.find({ userId, isValid: true })
    .sort({ issueDate: -1 })
    .populate('trackId');
  return certificates;
}

/**
 * Verify a certificate using its verification code.
 */
async function verifyCertificate(verificationCode) {
  const certificate = await Certificate.findOne({ verificationCode, isValid: true })
    .populate('userId', 'fullName email')
    .populate('trackId');

  if (!certificate) throw new Error('Certificate not found or invalid');

  return {
    valid: true,
    certificate: {
      certificateId: certificate.certificateId,
      recipientName: certificate.userId.fullName,
      trackName: certificate.trackId.name,
      issueDate: certificate.issueDate,
      achievements: certificate.achievements
    }
  };
}

module.exports = { getUserCertificates, verifyCertificate };
