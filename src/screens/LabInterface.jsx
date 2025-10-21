import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes } from 'react-icons/fa';
import learningService from '../services/learning.service';

const LabInterface = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [responses, setResponses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLabData();
  }, [labId]);

  const fetchLabData = async () => {
    try {
      setLoading(true);
      const data = await learningService.getLabById(labId);
      setLab(data.lab);
      setResponses(
        data.lab.challenges.map(c => ({
          challengeId: c.challengeId,
          verdict: null,
          reasoning: '',
          timeSpent: 0
        }))
      );
    } catch (err) {
      setError('Failed to load lab');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerdictChange = (challengeId, verdict) => {
    setResponses(responses.map(r =>
      r.challengeId === challengeId ? { ...r, verdict } : r
    ));
  };

  const handleReasoningChange = (challengeId, reasoning) => {
    setResponses(responses.map(r =>
      r.challengeId === challengeId ? { ...r, reasoning } : r
    ));
  };

  const handleSubmit = async () => {
    const unansweredCount = responses.filter(r => !r.verdict).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered challenges. Submit anyway?`
      );
      if (!confirm) return;
    }

    try {
      setSubmitting(true);
      const result = await learningService.submitLab(labId, responses);
      setResults(result);
      setShowResults(true);
    } catch (err) {
      setError('Failed to submit lab: ' + err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderChallenge = () => {
    const challenge = lab.challenges[currentChallenge];
    const response = responses.find(r => r.challengeId === challenge.challengeId);

    return (
      <Card className="lms-lab-box">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5>Challenge {currentChallenge + 1} of {lab.challenges.length}</h5>
              <Badge bg="secondary">{challenge.difficulty}</Badge>
              <Badge bg="info" className="ms-2">{challenge.points} points</Badge>
            </div>
          </div>

          <h4 className="mb-3">{challenge.title}</h4>
          <p>{challenge.description}</p>

          <div className="lms-media-box">
            {challenge.mediaType === 'video' ? (
              <video
                controls
                src={challenge.mediaUrl}
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              >
                Your browser does not support the video tag.
              </video>
            ) : challenge.mediaType === 'image' ? (
              <img
                src={challenge.mediaUrl}
                alt={challenge.title}
                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
              />
            ) : challenge.mediaType === 'audio' ? (
              <audio controls src={challenge.mediaUrl} className="w-100">
                Your browser does not support the audio tag.
              </audio>
            ) : null}
          </div>

          <div className="mt-4">
            <h6>Your Verdict:</h6>
            <div className="lms-verdict-group">
              <Button
                variant={response?.verdict === 'real' ? 'success' : 'outline-success'}
                className={`lms-verdict-btn ${response?.verdict === 'real' ? 'lms-selected' : ''}`}
                onClick={() => handleVerdictChange(challenge.challengeId, 'real')}
              >
                ✓ Real
              </Button>
              <Button
                variant={response?.verdict === 'fake' ? 'danger' : 'outline-danger'}
                className={`lms-verdict-btn ${response?.verdict === 'fake' ? 'lms-selected' : ''}`}
                onClick={() => handleVerdictChange(challenge.challengeId, 'fake')}
              >
                ✗ Fake (Deepfake)
              </Button>
            </div>
          </div>

          <Form.Group className="mt-3">
            <Form.Label><strong>Explain your reasoning:</strong></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe what evidence led you to this conclusion..."
              value={response?.reasoning || ''}
              onChange={(e) => handleReasoningChange(challenge.challengeId, e.target.value)}
            />
            <Form.Text className="text-muted">
              Consider visual artifacts, audio inconsistencies, context clues, etc.
            </Form.Text>
          </Form.Group>
        </Card.Body>
      </Card>
    );
  };

  const renderResults = () => {
    return (
      <div className="lms-results-box">
        <div className={`lms-score-badge ${results.passed ? 'lms-passed' : 'lms-failed'}`}>
          {results.score}%
        </div>

        <h3>{results.passed ? 'Excellent Work!' : 'Keep Practicing!'}</h3>
        <p className="lead">
          {results.passed
            ? `You scored ${results.score}% on this lab!`
            : `You scored ${results.score}%. Passing score is ${lab.passingScore}%.`}
        </p>

        {results.xpEarned > 0 && (
          <Alert variant="success">
            <strong>+{results.xpEarned} XP</strong>
            {results.leveledUp && <span className="ms-2">🎉 Level Up!</span>}
          </Alert>
        )}

        <div className="mt-4">
          <h5>Challenge Results</h5>
          {lab.challenges.map((challenge, index) => {
            const result = results.responses.find(r => r.challengeId === challenge.challengeId);
            const userResponse = responses.find(r => r.challengeId === challenge.challengeId);

            return (
              <Card key={challenge.challengeId} className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={1} className="text-center">
                      {result.isCorrect ? (
                        <FaCheck className="text-success" size={32} />
                      ) : (
                        <FaTimes className="text-danger" size={32} />
                      )}
                    </Col>
                    <Col md={11}>
                      <h6>{challenge.title}</h6>
                      <div className="mb-2">
                        <Badge bg={challenge.difficulty === 'easy' ? 'success' : challenge.difficulty === 'medium' ? 'warning' : 'danger'}>
                          {challenge.difficulty}
                        </Badge>
                        <Badge bg="secondary" className="ms-2">{challenge.points} pts</Badge>
                      </div>

                      <div className="mt-3">
                        <Row>
                          <Col md={6}>
                            <strong>Your Verdict:</strong>
                            <Badge bg={result.verdict === 'real' ? 'success' : 'danger'} className="ms-2">
                              {result.verdict === 'real' ? 'Real' : 'Fake'}
                            </Badge>
                          </Col>
                          <Col md={6}>
                            <strong>Correct Answer:</strong>
                            <Badge bg={result.correctAnswer === 'real' ? 'success' : 'danger'} className="ms-2">
                              {result.correctAnswer === 'real' ? 'Real' : 'Fake'}
                            </Badge>
                          </Col>
                        </Row>
                      </div>

                      {userResponse?.reasoning && (
                        <div className="mt-2">
                          <strong className="d-block">Your Reasoning:</strong>
                          <p className="text-muted mb-1">{userResponse.reasoning}</p>
                        </div>
                      )}

                      {!result.isCorrect && result.artifacts && result.artifacts.length > 0 && (
                        <Alert variant="info" className="mt-3 mb-0">
                          <strong>Key Artifacts to Look For:</strong>
                          <ul className="mb-0 mt-2">
                            {result.artifacts.map((artifact, idx) => (
                              <li key={idx}>{artifact.type}: {artifact.description}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
        </div>

        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate(-1)} className="me-2">
            Back to Module
          </Button>
          {results.attemptsRemaining > 0 && !results.passed && (
            <Button variant="outline-primary" onClick={() => window.location.reload()}>
              Try Again ({results.attemptsRemaining} attempts left)
            </Button>
          )}
        </div>
      </div>
    );
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

  if (!lab) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Lab not found</Alert>
      </Container>
    );
  }

  if (showResults) {
    return (
      <div className="lms-lab-wrapper">
        <Container>{renderResults()}</Container>
      </div>
    );
  }

  return (
    <div className="lms-lab-wrapper">
      {error && (
        <Container>
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        </Container>
      )}

      <Container>
        <Card className="lms-quiz-header-box mb-4">
          <Card.Body>
            <h3>{lab.title}</h3>
            <p className="text-muted mb-0">{lab.description}</p>
            <div className="mt-2">
              <Badge bg="info">{lab.labType.replace('_', ' ')}</Badge>
            </div>
          </Card.Body>
        </Card>

        <div className="mb-4">
          <ProgressBar
            now={((currentChallenge + 1) / lab.challenges.length) * 100}
            label={`${currentChallenge + 1} / ${lab.challenges.length}`}
          />
        </div>

        <Row>
          <Col lg={9}>
            {renderChallenge()}

            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="outline-secondary"
                disabled={currentChallenge === 0}
                onClick={() => setCurrentChallenge(currentChallenge - 1)}
              >
                Previous Challenge
              </Button>

              {currentChallenge === lab.challenges.length - 1 ? (
                <Button variant="success" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Lab'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setCurrentChallenge(currentChallenge + 1)}
                >
                  Next Challenge
                </Button>
              )}
            </div>
          </Col>

          <Col lg={3}>
            <Card className="lms-content-box sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h6 className="mb-3">Lab Progress</h6>
                <div className="small mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Answered:</span>
                    <strong>{responses.filter(r => r.verdict).length} / {lab.challenges.length}</strong>
                  </div>
                </div>

                <hr />

                <h6 className="mb-2">Challenges:</h6>
                <div className="list-group list-group-flush">
                  {lab.challenges.map((challenge, index) => {
                    const response = responses.find(r => r.challengeId === challenge.challengeId);
                    return (
                      <div
                        key={challenge.challengeId}
                        className={`list-group-item list-group-item-action ${
                          index === currentChallenge ? 'active' : ''
                        } ${response?.verdict ? 'list-group-item-success' : ''}`}
                        style={{ cursor: 'pointer', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                        onClick={() => setCurrentChallenge(index)}
                      >
                        <div className="d-flex align-items-center">
                          <span className="me-2">{index + 1}.</span>
                          <span className="flex-grow-1">{challenge.difficulty}</span>
                          {response?.verdict && (
                            <FaCheck className="text-success" size={12} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LabInterface;
