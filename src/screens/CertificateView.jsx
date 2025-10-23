import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaShareAlt, FaAward } from 'react-icons/fa';
import ProgressAPI from '../services/progress.api';

const CertificateView = () => {
  const { certId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const certificates = await ProgressAPI.getUserCertificates();
        if (!mounted) return;
        const cert = certificates.find(c => c._id === certId || c.certificateId === certId);

        if (!cert) {
          setError('Certificate not found');
        } else {
          setCertificate(cert);
        }
      } catch (err) {
        setError('Failed to load certificate');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [certId]);

  const handleDownload = () => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank');
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/certificate/${certificate.certificateId}`;
    const shareText = `I just earned a certificate in ${certificate.title}!`;

    if (navigator.share) {
      navigator.share({
        title: certificate.title,
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (error || !certificate) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error || 'Certificate not found'}</Alert>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <div className="lms-cert-wrapper">
      <Container>
        <Row className="mb-4">
          <Col className="text-center">
            <Button variant="outline-primary" onClick={() => navigate('/dashboard')} className="me-2">
              Back to Dashboard
            </Button>
            <Button variant="primary" onClick={handleDownload} className="me-2">
              <FaDownload className="me-2" />
              Download PDF
            </Button>
            <Button variant="success" onClick={handleShare}>
              <FaShareAlt className="me-2" />
              Share
            </Button>
          </Col>
        </Row>

        <div className="lms-cert-box" id="certificate-print">
          <div className="lms-cert-seal">
            <FaAward />
          </div>

          <div className="text-center mb-4">
            <h1 className="lms-cert-title">Certificate of Completion</h1>
            <p className="text-muted">This certifies that</p>
          </div>

          <div className="text-center mb-4">
            <div className="lms-cert-recipient">{certificate.userId?.fullName || 'Certificate Holder'}</div>
          </div>

          <div className="text-center mb-4">
            <p className="lead">has successfully completed</p>
            <h3 className="mb-3">{certificate.title}</h3>
            <p className="text-muted">{certificate.description}</p>
          </div>

          {certificate.achievements && (
            <Row className="mt-4 mb-4">
              <Col md={3} className="text-center">
                <strong className="d-block">Overall Score</strong>
                <span className="fs-4 text-primary">{certificate.achievements.totalScore}%</span>
              </Col>
              <Col md={3} className="text-center">
                <strong className="d-block">Modules</strong>
                <span className="fs-4 text-success">{certificate.achievements.modulesCompleted}</span>
              </Col>
              <Col md={3} className="text-center">
                <strong className="d-block">XP Earned</strong>
                <span className="fs-4 text-warning">{certificate.achievements.totalXPEarned}</span>
              </Col>
              <Col md={3} className="text-center">
                <strong className="d-block">Badges</strong>
                <span className="fs-4 text-info">{certificate.achievements.badgesEarned}</span>
              </Col>
            </Row>
          )}

          <div className="lms-certificate-footer">
            <div className="text-center">
              <div className="mb-2">
                <strong>Issue Date</strong>
              </div>
              <div>{new Date(certificate.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <strong>Certificate ID</strong>
              </div>
              <div className="font-monospace">{certificate.certificateId}</div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <strong>Verification Code</strong>
              </div>
              <div className="font-monospace">{certificate.verificationCode}</div>
            </div>
          </div>

          {certificate.metadata && certificate.metadata.rank && (
            <div className="text-center mt-4">
              <Alert variant="success">
                <strong>Achievement Rank:</strong> {certificate.metadata.rank}
              </Alert>
            </div>
          )}
        </div>

        <Row className="mt-4">
          <Col className="text-center">
            <p className="text-muted small">
              This certificate can be verified at: {window.location.origin}/verify/{certificate.verificationCode}
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CertificateView;
