import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaCheck, FaClock, FaPlay } from 'react-icons/fa';
import learningService from '../services/learning.service';

const CourseView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseData();
  }, [trackId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const data = await learningService.getTrackById(trackId);
      setTrack(data.track);
      setModules(data.modules);
      setProgress(data.progress);
    } catch (err) {
      setError('Failed to load course data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    if (!progress || !progress.modulesProgress) return null;
    return progress.modulesProgress.find(mp => mp.moduleId === moduleId);
  };

  const calculateModuleCompletion = (moduleProgress) => {
    if (!moduleProgress || !moduleProgress.lessonsProgress) return 0;

    const totalLessons = moduleProgress.lessonsProgress.length;
    const completedLessons = moduleProgress.lessonsProgress.filter(
      lp => lp.status === 'completed'
    ).length;

    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const isModuleUnlocked = (module) => {
    if (!module.prerequisites || module.prerequisites.length === 0) return true;
    if (!progress || !progress.modulesProgress) return false;

    return module.prerequisites.every(prereqId => {
      const prereqProgress = progress.modulesProgress.find(mp => mp.moduleId === prereqId);
      return prereqProgress && prereqProgress.status === 'completed';
    });
  };

  const handleModuleClick = (module) => {
    const unlocked = isModuleUnlocked(module);
    if (unlocked) {
      navigate(`/module/${module._id}`);
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

  if (!track) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Course not found</Alert>
      </Container>
    );
  }

  return (
    <div className="course-view-container">
      {error && (
        <Container className="mt-3">
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        </Container>
      )}

      <div className="lms-course-header-wrapper">
        <Container>
          <Row>
            <Col>
              <div className="d-flex align-items-center mb-3">
                <span className="lms-track-icon me-3">{track.icon}</span>
                <div>
                  <h1 className="mb-1">{track.name}</h1>
                  <p className="mb-0 opacity-75">{track.title}</p>
                </div>
              </div>
              <p className="lead">{track.description}</p>
              <div className="d-flex gap-4 mt-3">
                <div>
                  <FaClock className="me-2" />
                  <span>{track.estimatedDuration}</span>
                </div>
                <div>
                  <Badge bg="light" text="dark">
                    Level {track.level}
                  </Badge>
                </div>
                <div>
                  <span>{track.moduleCount} Modules</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <Row>
          <Col lg={8}>
            <h3 className="mb-4">Course Modules</h3>

            {modules.map((module, index) => {
              const moduleProgress = getModuleProgress(module._id);
              const completion = calculateModuleCompletion(moduleProgress);
              const unlocked = isModuleUnlocked(module);
              const status = moduleProgress?.status || 'locked';

              return (
                <Card
                  key={module._id}
                  className={`lms-module-card ${!unlocked ? 'lms-locked' : ''} ${
                    status === 'completed' ? 'lms-completed' : ''
                  } ${status === 'in_progress' ? 'lms-in-progress' : ''}`}
                  onClick={() => handleModuleClick(module)}
                  style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
                >
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={1} className="text-center">
                        <div className="fs-4 fw-bold text-muted">
                          {index + 1}
                        </div>
                      </Col>

                      <Col md={7}>
                        <h5 className="mb-1">
                          {module.name}
                          {status === 'completed' && (
                            <FaCheck className="text-success ms-2" />
                          )}
                        </h5>
                        <p className="text-muted mb-2 small">
                          {module.description}
                        </p>
                        <div className="d-flex gap-3 small">
                          <span>
                            <FaClock className="me-1" />
                            {module.estimatedDuration}
                          </span>
                          <span>{module.lessonCount} lessons</span>
                        </div>
                      </Col>

                      <Col md={3}>
                        <div className="mb-2">
                          <small className="text-muted">Progress</small>
                          <ProgressBar
                            now={completion}
                            variant={completion === 100 ? 'success' : 'primary'}
                            className="mb-1"
                          />
                          <small>{completion}%</small>
                        </div>
                      </Col>

                      <Col md={1} className="text-center">
                        {!unlocked ? (
                          <FaLock className="text-muted" />
                        ) : status === 'completed' ? (
                          <Button variant="success" size="sm">
                            <FaCheck />
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm">
                            <FaPlay />
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              );
            })}
          </Col>

          <Col lg={4}>
            <Card className="lms-progress-box sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h5 className="mb-3">Your Progress</h5>

                {progress ? (
                  <>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Overall Completion</small>
                        <small>
                          {progress.modulesProgress.filter(m => m.status === 'completed').length} / {modules.length} modules
                        </small>
                      </div>
                      <ProgressBar
                        now={(progress.modulesProgress.filter(m => m.status === 'completed').length / modules.length) * 100}
                        variant="success"
                      />
                    </div>

                    <hr />

                    <div className="mb-2">
                      <strong>Learning Objectives:</strong>
                    </div>
                    <ul className="small mb-0">
                      {modules.slice(0, 3).map((module, idx) => (
                        <li key={idx}>{module.learningObjectives?.[0] || 'Complete module'}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">Start the course to track your progress</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CourseView;
