import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaFire, FaStar, FaClock, FaAward } from 'react-icons/fa';
import LearningAPI from '../services/learning.api';
import DashboardAPI from '../services/dashboard.service';
import BadgesAPI from '../services/badges.service';
import ProgressAPI from '../services/progress.api';

const createTrackVariants = (value) => {
  if (value === undefined || value === null) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  const condensed = lower.replace(/[^a-z0-9]/g, '');
  const underscored = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const variants = new Set([
    raw,
    lower,
    raw.toUpperCase(),
    condensed,
    underscored,
    raw.replace(/[^a-zA-Z0-9]/g, ''),
    raw.replace(/[^a-zA-Z0-9]+/g, '_'),
    `track_${condensed}`,
    `track_${underscored}`,
    `track-${condensed}`,
    `track-${underscored}`
  ]);

  return Array.from(variants).filter(Boolean);
};

const buildTrackAliases = (track) => {
  const aliases = new Set();
  if (!track) return aliases;

  const add = (value) => {
    createTrackVariants(value).forEach((variant) => aliases.add(variant));
  };

  add(track._id);
  add(track.trackId);
  add(track.id);
  add(track.legacyId);
  add(track.slug);

  if (track.name) {
    const nameSlug = track.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    add(nameSlug);
    if (nameSlug.includes('_')) {
      const [firstSegment] = nameSlug.split('_');
      add(firstSegment);
      add(`track_${firstSegment}`);
    }
    add(`track_${nameSlug}`);
  }

  if (typeof track.order === 'number') {
    add(`track_${track.order}`);
    add(`track${track.order}`);
  }

  return aliases;
};

const LearningDashboard = () => {
  const [tracks, setTracks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const trackAliasMap = useMemo(() => {
    const map = new Map();
    (tracks || []).forEach((track) => {
      buildTrackAliases(track).forEach((alias) => {
        if (!map.has(alias)) {
          map.set(alias, track);
        }
      });
    });
    return map;
  }, [tracks]);

  const trackProgressLookup = useMemo(() => {
    const map = new Map();
    if (!progress?.tracksProgress) return map;

    progress.tracksProgress.forEach((tp) => {
      const baseId = String(tp.trackId || '');
      createTrackVariants(baseId).forEach((variant) => {
        if (!map.has(variant)) {
          map.set(variant, tp);
        }
      });

      const linkedTrack =
        trackAliasMap.get(baseId) ||
        trackAliasMap.get(baseId.toLowerCase?.()) ||
        null;

      if (linkedTrack) {
        buildTrackAliases(linkedTrack).forEach((alias) => {
          if (!map.has(alias)) {
            map.set(alias, tp);
          }
        });
      }
    });

    return map;
  }, [progress, trackAliasMap]);

  const getTrackProgressByIdentifier = (identifier) => {
    if (!identifier && identifier !== 0) return null;
    const variants = createTrackVariants(identifier);

    for (const variant of variants) {
      if (trackProgressLookup.has(variant)) {
        return trackProgressLookup.get(variant);
      }

      const matchedTrack = trackAliasMap.get(variant);
      if (matchedTrack) {
        const matchedAliases = buildTrackAliases(matchedTrack);
        for (const alias of matchedAliases) {
          if (trackProgressLookup.has(alias)) {
            return trackProgressLookup.get(alias);
          }
        }
      }
    }

    return null;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 LearningDashboard: Starting to fetch data...');

      // Fetch tracks, dashboard stats, badges, and user progress
      const [tracksData, statsData, badgesData, progressData] = await Promise.all([
        LearningAPI.getAllTracks(),
        DashboardAPI.getDashboardStats().catch(e => {
          console.warn('dashboard stats not available', e.message || e);
          return null;
        }),
        BadgesAPI.getUserBadges().catch(e => {
          console.warn('badges not available', e.message || e);
          return null;
        }),
        ProgressAPI.getUserProgress().catch(e => {
          console.warn('user progress not available', e.message || e);
          return null;
        })
      ]);

      console.log('📊 LearningDashboard: Data received:', { tracksData, statsData, badgesData, progressData });

      setTracks(tracksData);
      setStats(statsData);
      setBadges(badgesData);
      setProgress(progressData);

      try {
        if (typeof window !== 'undefined') {
          if (progressData) {
            localStorage.setItem('progress', JSON.stringify(progressData));
          } else {
            localStorage.removeItem('progress');
          }
        }
      } catch (storageErr) {
        console.warn('📦 LearningDashboard: Failed to sync progress to localStorage', storageErr);
      }

      console.log('📊 LearningDashboard: State updated, tracks count:', tracksData?.length);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('❌ LearningDashboard: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrack = async (trackId) => {
    try {
      await ProgressAPI.startTrack(trackId);
      // If server populated modules, just navigate to the course page which will
      // fetch module progress when available.
      navigate(`/course/${trackId}`);
    } catch (err) {
      setError('Failed to start track: ' + err.response?.data?.message);
    }
  };

  const handleContinueLearning = async () => {
    try {
      const nextContent = await LearningAPI.getNextContent();

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

  const getTrackProgress = (trackId) => getTrackProgressByIdentifier(trackId);

  const calculateTrackCompletion = (trackProgress) => {
    if (!trackProgress || !trackProgress.modulesProgress) return 0;

    const totalModules = trackProgress.modulesProgress.length;
    const completedModules = trackProgress.modulesProgress.filter(
      mp => mp.status === 'completed'
    ).length;

    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  const isTrackUnlocked = (track) => {
    if (!track?.prerequisites || track.prerequisites.length === 0) return true;
    if (!progress?.tracksProgress) return false;

    const evaluation = track.prerequisites.map((prereqId) => {
      const prereqProgress = getTrackProgressByIdentifier(prereqId);
      return {
        prereqId,
        found: !!prereqProgress,
        status: prereqProgress?.status || 'missing'
      };
    });

    const unlocked = evaluation.every((entry) => entry.found && entry.status === 'completed');

    console.log('🔐 LearningDashboard: track unlock evaluation', {
      trackId: track._id,
      trackName: track.name,
      prerequisites: evaluation,
      unlocked
    });

    return unlocked;
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
        {console.log('🎨 LearningDashboard: Rendering tracks:', tracks)}
        {tracks && tracks.length > 0 ? (
          tracks.map(track => {
            const trackProgress = getTrackProgress(track._id);
            const completion = calculateTrackCompletion(trackProgress);
            const unlocked = isTrackUnlocked(track);

            console.log('🎨 LearningDashboard: Rendering track:', {
              track: track,
              trackProgress,
              completion,
              unlocked
            });

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
          })
        ) : (
          <Col>
            <Card className="text-center p-5">
              <Card.Body>
                <h5>No Learning Tracks Available</h5>
                <p className="text-muted">Please contact your administrator or check back later.</p>
              </Card.Body>
            </Card>
          </Col>
        )}
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
