import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaLock, FaCheck, FaClock, FaPlay } from 'react-icons/fa';
import LearningAPI from '../services/learning.api';

const buildModuleAliases = (module) => {
  const aliases = new Set();
  if (!module) return aliases;

  const objId = module._id ? String(module._id) : null;
  if (objId) {
    aliases.add(objId);
    aliases.add(objId.toLowerCase());
  }

  const modId = module.moduleId ? String(module.moduleId) : null;
  if (modId) {
    const raw = modId;
    const lower = raw.toLowerCase();

    aliases.add(raw);
    aliases.add(lower);

    const modAsModule = lower.replace(/^mod[-_]?/, 'module_');
    aliases.add(modAsModule);

    const modulePrefixNormalized = lower.replace(/^module[-_]?/, 'module_');
    aliases.add(modulePrefixNormalized);

    const alphanumeric = lower.replace(/[^a-z0-9]/g, '');
    if (alphanumeric) aliases.add(alphanumeric);
  }

  return aliases;
};

const createLookupKeyVariants = (value) => {
  if (!value && value !== 0) return [];
  const raw = String(value);
  const variants = new Set();
  variants.add(raw);
  variants.add(raw.toLowerCase());
  variants.add(raw.replace(/^MOD[-_]?/i, 'module_'));
  variants.add(raw.toLowerCase().replace(/^mod[-_]?/, 'module_'));
  variants.add(raw.replace(/^MODULE[-_]?/i, 'module_'));
  variants.add(raw.toLowerCase().replace(/^module[-_]?/, 'module_'));
  variants.add(raw.replace(/[^a-zA-Z0-9]/g, ''));
  variants.add(raw.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return Array.from(variants).filter(Boolean);
};

const CourseView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LearningAPI.getTrackById(trackId);
      console.log('Loaded course data:', {
        track: data.track?.name,
        modulesCount: data.modules?.length,
        progress: data.progress ? {
          modulesProgressCount: data.progress.modulesProgress?.length,
          modulesProgress: data.progress.modulesProgress?.map(mp => ({ id: mp.moduleId, status: mp.status }))
        } : null
      });
      setTrack(data.track);
      setModules(data.modules);
      setProgress(data.progress);
      setError('');
    } catch (err) {
      setError('Failed to load course data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Refresh progress when component comes back into focus
  useEffect(() => {
    const handleFocus = () => {
      loadCourseData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCourseData]);

  const moduleLookup = useMemo(() => {
    const map = new Map();
    modules.forEach(mod => {
      buildModuleAliases(mod).forEach(alias => {
        if (!map.has(alias)) {
          map.set(alias, mod);
        }
      });
    });
    return map;
  }, [modules]);

  useEffect(() => {
    if (modules?.length) {
      console.log(
        '📚 CourseView: modules list',
        modules.map(mod => ({
          _id: String(mod._id),
          moduleId: mod.moduleId || null,
          order: mod.order,
          name: mod.name,
          prerequisites: mod.prerequisites || []
        }))
      );
    } else {
      console.log('📚 CourseView: no modules received yet');
    }
  }, [modules]);

  const progressLookup = useMemo(() => {
    const map = new Map();
    if (progress?.modulesProgress) {
      progress.modulesProgress.forEach(mp => {
        const key = String(mp.moduleId);
        map.set(key, mp);

        const lowerKey = key.toLowerCase();
        const modKeyVariant = key.replace(/^MOD[-_]?/i, 'module_');
        const lowerModKeyVariant = lowerKey.replace(/^mod[-_]?/, 'module_');

        const linkedModule =
          moduleLookup.get(key) ||
          moduleLookup.get(lowerKey) ||
          moduleLookup.get(modKeyVariant) ||
          moduleLookup.get(lowerModKeyVariant);

        if (linkedModule) {
          buildModuleAliases(linkedModule).forEach(alias => {
            if (!map.has(alias)) {
              map.set(alias, mp);
            }
          });
        } else {
          createLookupKeyVariants(key).forEach(alias => {
            if (!map.has(alias)) {
              map.set(alias, mp);
            }
          });
        }
      });
    }
    return map;
  }, [progress, moduleLookup]);

  useEffect(() => {
    if (progress?.modulesProgress) {
      console.log(
        '📈 CourseView: progress list',
        progress.modulesProgress.map(mp => ({
          moduleId: String(mp.moduleId),
          status: mp.status,
          bestQuizScore: mp.bestQuizScore,
          lessonsCount: mp.lessonsProgress?.length || 0
        }))
      );
    } else {
      console.log('📈 CourseView: no module progress from server yet');
    }
  }, [progress]);

  const findModuleByIdentifier = (identifier) => {
    if (!identifier && identifier !== 0) return null;
    const attempts = createLookupKeyVariants(identifier);
    for (const attempt of attempts) {
      if (moduleLookup.has(attempt)) {
        return moduleLookup.get(attempt);
      }
    }
    return null;
  };

  const getModuleProgress = (moduleId) => {
    if (!moduleId) return null;
    const attempts = createLookupKeyVariants(moduleId);
    for (const key of attempts) {
      if (progressLookup.has(key)) {
        return progressLookup.get(key);
      }
    }
    return null;
  };

  const calculateModuleCompletion = (moduleProgress) => {
    if (!moduleProgress || !moduleProgress.lessonsProgress) return 0;

    const totalLessons = moduleProgress.lessonsProgress.length;
    const completedLessons = moduleProgress.lessonsProgress.filter(
      lp => lp.status === 'completed'
    ).length;

    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const prerequisitesMet = (module) => {
    if (!module?.prerequisites || module.prerequisites.length === 0) return true;

    return module.prerequisites.every(prereqId => {
      const prereqModule = findModuleByIdentifier(prereqId);
      if (!prereqModule) {
        if (typeof prereqId === 'string' && prereqId.toLowerCase().includes('track')) {
          console.log('📎 CourseView: treating track-level prerequisite as satisfied (backend enforces track completion)', {
            moduleId: String(module._id),
            moduleName: module.name,
            prereqId
          });
          return true;
        }
        console.warn('Prerequisite module not found in course data:', prereqId);
        return false;
      }

      const prereqProgress = getModuleProgress(prereqModule._id);
      return prereqProgress?.status === 'completed';
    });
  };

  const isModuleUnlocked = (module, index) => {
    const moduleProgress = getModuleProgress(module._id);
    const prereqsSatisfied = prerequisitesMet(module);
    const previousModule = index > 0 ? modules[index - 1] : null;
    const previousProgress = previousModule ? getModuleProgress(previousModule._id) : null;
    const previousStatus = previousProgress?.status || 'none';

    if (!progress) {
      // Track not started yet - allow only the very first module to be previewed
      const decision = index === 0;
      console.log('🔐 CourseView: gate check (no progress yet)', {
        moduleId: String(module._id),
        moduleName: module.name,
        index,
        decision
      });
      return decision;
    }

    if (!moduleProgress) {
      if (!prereqsSatisfied) {
        console.log('🔐 CourseView: gate check (missing prereqs, no progress record)', {
          moduleId: String(module._id),
          moduleName: module.name,
          index,
          prereqsSatisfied,
          decision: false
        });
        return false;
      }

      // Fallback: allow only if prerequisites satisfied and previous module is completed
      if (index === 0) {
        console.log('🔐 CourseView: gate check (first module without progress record)', {
          moduleId: String(module._id),
          moduleName: module.name,
          index,
          decision: true
        });
        return true;
      }

      const decision = previousStatus === 'completed';
      console.log('🔐 CourseView: gate check (no progress record, using previous module status)', {
        moduleId: String(module._id),
        moduleName: module.name,
        index,
        previousModuleId: previousModule ? String(previousModule._id) : null,
        previousStatus,
        decision
      });
      return decision;
    }

    const status = moduleProgress.status || 'unlocked';
    if (status === 'locked') {
      console.log('🔐 CourseView: gate check (explicit locked status)', {
        moduleId: String(module._id),
        moduleName: module.name,
        index,
        status,
        prereqsSatisfied,
        decision: false
      });
      return false;
    }

    const decision = prereqsSatisfied;
    console.log('🔐 CourseView: gate check (unlocked/in progress/completed)', {
      moduleId: String(module._id),
      moduleName: module.name,
      index,
      status,
      prereqsSatisfied,
      decision
    });
    return decision;
  };

  const handleModuleClick = (module, index) => {
    const unlocked = isModuleUnlocked(module, index);
    if (unlocked) {
      navigate(`/module/${module._id}`);
    }
  };

  const totalModules = modules.length;
  const completedModulesCount = progress?.modulesProgress
    ? progress.modulesProgress.filter(mp => mp.status === 'completed').length
    : 0;
  const unlockedModulesCount = progress?.modulesProgress
    ? progress.modulesProgress.filter(mp => mp.status && mp.status !== 'locked').length
    : 0;
  const completionPercent = totalModules > 0
    ? Math.round((completedModulesCount / totalModules) * 100)
    : 0;
  const currentModuleNumber = progress
    ? totalModules > 0
      ? Math.min(totalModules, Math.max(1, unlockedModulesCount))
      : 0
    : 0;

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
              const unlocked = isModuleUnlocked(module, index);
              const status = moduleProgress?.status || 'locked';

              return (
                <Card
                  key={module._id}
                  className={`lms-module-card ${!unlocked ? 'lms-locked' : ''} ${
                    status === 'completed' ? 'lms-completed' : ''
                  } ${status === 'in_progress' ? 'lms-in-progress' : ''}`}
                  onClick={() => handleModuleClick(module, index)}
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
                        <small>{completionPercent}%</small>
                      </div>
                      <ProgressBar
                        now={completionPercent}
                        variant={completionPercent === 100 ? 'success' : 'primary'}
                      />
                      <div className="d-flex justify-content-between mt-2">
                        <small>Current Module</small>
                        <small>
                          Module {currentModuleNumber} / {totalModules || 0}
                        </small>
                      </div>
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
