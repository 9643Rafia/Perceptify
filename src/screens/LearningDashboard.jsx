import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaFire, FaStar, FaClock, FaAward } from 'react-icons/fa';
import learningService from '../services/learning.service';

const LearningDashboard = () => {
  const [tracks, setTracks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tracksData, progressData, statsData, badgesData] = await Promise.all([
        learningService.getAllTracks(),
        learningService.getUserProgress(),
        learningService.getDashboardStats(),
        learningService.getUserBadges()
      ]);

      setTracks(tracksData);
      setProgress(progressData);
      setStats(statsData);
      setBadges(badgesData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrack = async (trackId) => {
    try {
      await learningService.startTrack(trackId);
      navigate(`/course/${trackId}`);
    } catch (err) {
      setError('Failed to start track: ' + err.response?.data?.message);
    }
  };

  const handleContinueLearning = async () => {
    try {
      const nextContent = await learningService.getNextContent();

      if (nextContent.type === 'lesson') {
        navigate(`/lesson/${nextContent.lesson._id}`);
      } else if (nextContent.type === 'quiz') {
        navigate(`/quiz/${nextContent.quizId}`);
      } else if (nextContent.type === 'completed') {
        setError('Congratulations! You have completed all available content.');
      }
    } catch (err) {
      setError('Failed to get next content');
    }
  };

  const getTrackProgress = (trackId) => {
    if (!progress || !progress.tracksProgress) return null;
    return progress.tracksProgress.find(tp => tp.trackId === trackId);
  };

  const calculateTrackCompletion = (trackProgress) => {
    if (!trackProgress || !trackProgress.modulesProgress) return 0;

    const totalModules = trackProgress.modulesProgress.length;
    const completedModules = trackProgress.modulesProgress.filter(
      mp => mp.status === 'completed'
    ).length;

    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  const isTrackUnlocked = (track) => {
    if (!track.prerequisites || track.prerequisites.length === 0) return true;
    if (!progress || !progress.tracksProgress) return false;

    return track.prerequisites.every(prereqId => {
      const prereqProgress = progress.tracksProgress.find(tp => tp.trackId === prereqId);
      return prereqProgress && prereqProgress.status === 'completed';
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  return (
    <Container className="learning-dashboard py-5">
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Stats Overview */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">My Learning Dashboard</h2>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="stat-card text-center">
            <Card.Body>
              <FaStar className="stat-icon text-warning mb-2" size={32} />
              <h3>{stats?.totalXP || 0}</h3>
              <p className="text-muted mb-1">Total XP</p>
              <small>Level {stats?.level || 1}</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card text-center">
            <Card.Body>
              <FaFire className="stat-icon text-danger mb-2" size={32} />
              <h3>{stats?.currentStreak || 0}</h3>
              <p className="text-muted mb-1">Day Streak</p>
              <small>Best: {stats?.longestStreak || 0} days</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card text-center">
            <Card.Body>
              <FaClock className="stat-icon text-info mb-2" size={32} />
              <h3>{formatTime(stats?.totalTimeSpent || 0)}</h3>
              <p className="text-muted mb-1">Time Spent</p>
              <small>{stats?.lessonsCompleted || 0} lessons completed</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card text-center">
            <Card.Body>
              <FaAward className="stat-icon text-success mb-2" size={32} />
              <h3>{stats?.badgesEarned || 0}</h3>
              <p className="text-muted mb-1">Badges Earned</p>
              <small>{stats?.modulesCompleted || 0} modules done</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Continue Learning Button */}
      {progress && progress.currentLesson && (
        <Row className="mb-4">
          <Col>
            <Card className="bg-primary text-white">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Continue where you left off</h5>
                  <small>Pick up your learning journey</small>
                </div>
                <Button variant="light" onClick={handleContinueLearning}>
                  Continue Learning
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Learning Tracks */}
      <Row className="mb-4">
        <Col>
          <h4 className="mb-3">Learning Tracks</h4>
        </Col>
      </Row>

      <Row className="g-4">
        {tracks.map(track => {
          const trackProgress = getTrackProgress(track._id);
          const completion = calculateTrackCompletion(trackProgress);
          const unlocked = isTrackUnlocked(track);

          return (
            <Col md={4} key={track._id}>
              <Card className={`track-card h-100 ${!unlocked ? 'locked' : ''}`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="track-icon">{track.icon}</span>
                    <Badge bg={track.level === 1 ? 'success' : track.level === 2 ? 'warning' : 'danger'}>
                      Level {track.level}
                    </Badge>
                  </div>

                  <h5>{track.name}</h5>
                  <p className="text-muted small">{track.description}</p>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Progress</small>
                      <small>{completion}%</small>
                    </div>
                    <ProgressBar now={completion} variant={completion === 100 ? 'success' : 'primary'} />
                  </div>

                  <div className="track-meta mb-3">
                    <small className="d-block">
                      <FaClock className="me-1" />
                      {track.estimatedDuration}
                    </small>
                    <small className="d-block">
                      {track.moduleCount} modules
                    </small>
                  </div>

                  {!unlocked ? (
                    <Button variant="secondary" disabled block>
                      🔒 Locked
                    </Button>
                  ) : trackProgress?.status === 'completed' ? (
                    <Button variant="success" onClick={() => navigate(`/course/${track._id}`)} block>
                      <FaTrophy className="me-2" />
                      View Certificate
                    </Button>
                  ) : trackProgress ? (
                    <Button variant="primary" onClick={() => navigate(`/course/${track._id}`)} block>
                      Continue Track
                    </Button>
                  ) : (
                    <Button variant="outline-primary" onClick={() => handleStartTrack(track._id)} block>
                      Start Track
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Recent Badges */}
      {badges.earnedBadges && badges.earnedBadges.length > 0 && (
        <Row className="mt-5">
          <Col>
            <h4 className="mb-3">Recent Badges</h4>
          </Col>
        </Row>
      )}

      {badges.earnedBadges && badges.earnedBadges.length > 0 && (
        <Row className="g-3">
          {badges.earnedBadges.slice(0, 6).map(badge => (
            <Col md={2} key={badge.badgeId}>
              <Card className="badge-card text-center">
                <Card.Body>
                  <div className="badge-icon mb-2">{badge.icon}</div>
                  <small className="fw-bold">{badge.name}</small>
                  <br />
                  <small className="text-muted">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default LearningDashboard;
