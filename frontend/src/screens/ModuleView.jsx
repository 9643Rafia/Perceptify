import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaCheck, FaClock, FaPlay, FaClipboardCheck } from 'react-icons/fa';
import LearningAPI from '../services/learning.api';
import LessonProgressAPI from '../services/lessonProgress.service';

const ModuleView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [moduleProgress, setModuleProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await LearningAPI.getModuleById(moduleId);
        if (!mounted) return;
        setModule(data.module);
        setLessons(data.lessons);
        setModuleProgress(data.progress);
      } catch (err) {
        setError('Failed to load module data');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [moduleId]);

  const getLessonProgress = (lessonId) => {
    if (!moduleProgress || !moduleProgress.lessonsProgress) return null;
    return moduleProgress.lessonsProgress.find(lp => lp.lessonId === lessonId);
  };

  const isLessonUnlocked = (lesson) => {
    if (!lesson.prerequisites || lesson.prerequisites.length === 0) return true;
    if (!moduleProgress || !moduleProgress.lessonsProgress) return false;

    return lesson.prerequisites.every(prereqId => {
      const prereqProgress = moduleProgress.lessonsProgress.find(lp => lp.lessonId === prereqId);
      return prereqProgress && prereqProgress.status === 'completed';
    });
  };

  const handleLessonClick = async (lesson) => {
    const unlocked = isLessonUnlocked(lesson);
    if (unlocked) {
      try {
        await LessonProgressAPI.startLesson(lesson._id);
        navigate(`/lesson/${lesson._id}`);
      } catch (err) {
        setError('Failed to start lesson: ' + err.response?.data?.message);
      }
    }
  };

  const handleQuizClick = () => {
    if (module.quizId) {
      navigate(`/quiz/${module.quizId}`);
    }
  };

  const allLessonsCompleted = () => {
    if (!moduleProgress || !moduleProgress.lessonsProgress) return false;
    return lessons.every(lesson => {
      const progress = getLessonProgress(lesson._id);
      return progress && progress.status === 'completed';
    });
  };

  const formatDuration = (duration, type) => {
    if (type === 'minutes') {
      return `${duration} min`;
    }
    return duration;
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

  if (!module) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Module not found</Alert>
      </Container>
    );
  }

  return (
    <div className="module-view-container">
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
              <Button
                variant="link"
                className="text-white mb-3 p-0"
                onClick={() => navigate(-1)}
              >
                ← Back to Course
              </Button>
              <h1 className="mb-2">{module.name}</h1>
              <p className="lead mb-3">{module.description}</p>
              <div className="d-flex gap-4">
                <div>
                  <FaClock className="me-2" />
                  <span>{module.estimatedDuration}</span>
                </div>
                <div>
                  <span>{module.lessonCount} lessons</span>
                </div>
                {module.passingScore && (
                  <div>
                    <Badge bg="warning" text="dark">
                      Passing Score: {module.passingScore}%
                    </Badge>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <Row>
          <Col lg={8}>
            <h4 className="mb-3">Lessons</h4>

            <ListGroup className="lms-lesson-list">
              {lessons.map((lesson, index) => {
                const lessonProgress = getLessonProgress(lesson._id);
                const unlocked = isLessonUnlocked(lesson);
                const status = lessonProgress?.status || 'not_started';

                return (
                  <ListGroup.Item
                    key={lesson._id}
                    className={`lms-lesson-item ${!unlocked ? 'lms-locked' : ''} ${
                      status === 'completed' ? 'lms-completed' : ''
                    } ${status === 'in_progress' ? 'lms-in-progress' : ''}`}
                    onClick={() => handleLessonClick(lesson)}
                    style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
                  >
                    <Row className="align-items-center">
                      <Col xs={1} className="text-center">
                        <div className="fw-bold">{index + 1}</div>
                      </Col>

                      <Col xs={8}>
                        <h6 className="mb-1">
                          {lesson.name}
                          {status === 'completed' && (
                            <FaCheck className="text-success ms-2" size={16} />
                          )}
                        </h6>
                        <p className="text-muted mb-0 small">
                          {lesson.description}
                        </p>
                        <div className="mt-1">
                          <small className="text-muted">
                            <FaClock className="me-1" size={12} />
                            {formatDuration(lesson.estimatedDuration, lesson.durationType)}
                          </small>
                        </div>
                      </Col>

                      <Col xs={2} className="text-end">
                        {lessonProgress && (
                          <small className="text-muted">
                            {Math.floor(lessonProgress.timeSpent / 60)} min spent
                          </small>
                        )}
                      </Col>

                      <Col xs={1} className="text-center">
                        {!unlocked ? (
                          <FaLock className="text-muted" />
                        ) : status === 'completed' ? (
                          <FaCheck className="text-success" />
                        ) : (
                          <FaPlay className="text-primary" />
                        )}
                      </Col>
                    </Row>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>

            {module.quizId && (
              <Card className="mt-4 lms-content-box">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h5 className="mb-2">
                        <FaClipboardCheck className="me-2" />
                        Module Quiz
                      </h5>
                      <p className="text-muted mb-0">
                        Complete all lessons to unlock the module quiz
                      </p>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button
                        variant={allLessonsCompleted() ? 'primary' : 'secondary'}
                        disabled={!allLessonsCompleted()}
                        onClick={handleQuizClick}
                      >
                        {allLessonsCompleted() ? 'Take Quiz' : 'Locked'}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={4}>
            <Card className="lms-progress-box sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h5 className="mb-3">Module Overview</h5>

                <div className="mb-3">
                  <strong className="d-block mb-2">Learning Objectives:</strong>
                  <ul className="small mb-0">
                    {module.learningObjectives?.map((objective, idx) => (
                      <li key={idx}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <hr />

                <div className="mb-3">
                  <strong className="d-block mb-2">Progress:</strong>
                  <div className="small">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Lessons Completed</span>
                      <span>
                        {moduleProgress?.lessonsProgress.filter(lp => lp.status === 'completed').length || 0} / {lessons.length}
                      </span>
                    </div>
                    {moduleProgress?.bestQuizScore > 0 && (
                      <div className="d-flex justify-content-between">
                        <span>Best Quiz Score</span>
                        <span className="fw-bold">{moduleProgress.bestQuizScore}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {module.requiresLabCompletion && (
                  <>
                    <hr />
                    <div>
                      <Badge bg="info" className="w-100">
                        Hands-on Lab Required
                      </Badge>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ModuleView;
