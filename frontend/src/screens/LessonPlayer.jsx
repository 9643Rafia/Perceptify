import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import LearningAPI from '../services/learning.api';
import ProgressAPI from '../services/progress.api';

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  // lessonProgress intentionally not stored in component state (not used in UI)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [completedItems, setCompletedItems] = useState([]);
  const timerRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const timeSpentRef = useRef(0);
  const [videoFallbackUrl, setVideoFallbackUrl] = useState(null);
  const [videoFallbackAttempted, setVideoFallbackAttempted] = useState(false);

  const fetchLessonData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🎥 LessonPlayer: Fetching lesson data for lessonId:', lessonId);

  const data = await LearningAPI.getLessonById(lessonId);
      console.log('🎥 LessonPlayer: Lesson data received:', data);

    setLesson(data.lesson);
    // Remove mini-quiz content from lesson UI entirely so lessons don't show embedded quiz forms
    const filtered = (data.content || []).filter(i => i.type !== 'quiz');
    setContent(filtered);

      console.log('🎥 LessonPlayer: Content items:', data.content);
      data.content.forEach((item, index) => {
        console.log(`🎥 Content ${index + 1}:`, {
          title: item.title,
          type: item.type,
          url: item.url
        });
      });

      if (data.progress) {
        setTimeSpent(data.progress.timeSpent || 0);
        timeSpentRef.current = data.progress.timeSpent || 0;
        setCompletedItems(data.progress.completedContentItems || []);
      }
    } catch (err) {
      setError('Failed to load lesson');
      console.error('❌ LessonPlayer: Error fetching lesson:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLessonData();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      // cleanup blob url
      if (videoFallbackUrl) {
        try { URL.revokeObjectURL(videoFallbackUrl); } catch (e) {}
      }
    };
  }, [fetchLessonData, videoFallbackUrl]);



    const autoSaveProgress = useCallback(async () => {
      if (!lesson || timeSpentRef.current === 0) return;

      try {
        setSaving(true);
        await ProgressAPI.updateLessonProgress(lessonId, {
          timeSpent: timeSpentRef.current,
          lastPosition: currentContentIndex,
          completedContentItems: completedItems
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    }, [lesson, lessonId, currentContentIndex, completedItems]);
  useEffect(() => {
  // Start timer when lesson loaded: increment a ref every second to avoid
    // forcing a full re-render every tick. We update visible state less
    // frequently (every 5s) so the UI doesn't re-render every second.
    if (!lesson) return;

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        timeSpentRef.current += 1;
      }, 1000);
    }

    // Sync ref -> state every 5 seconds for UI and occasional updates
    let syncInterval = setInterval(() => {
      setTimeSpent(timeSpentRef.current);
    }, 5000);

    // Auto-save every 30 seconds
    if (!saveIntervalRef.current) {
      saveIntervalRef.current = setInterval(() => {
        autoSaveProgress();
      }, 30000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [lesson, autoSaveProgress]);



  const markContentComplete = (contentId) => {
    if (!completedItems.includes(contentId)) {
      setCompletedItems([...completedItems, contentId]);
    }
  };

  const handleNextContent = () => {
    if (currentContentIndex < content.length - 1) {
      const currentContent = content[currentContentIndex];
      markContentComplete(currentContent._id);
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const handlePreviousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  // quizzes are filtered out from `content`, so no need for quiz-skipping helpers

  const handleCompleteLesson = async () => {
    try {
      const currentContent = content[currentContentIndex];
      // Guard: content may be empty (we filtered out quizzes), so only mark if present
      if (currentContent) markContentComplete(currentContent._id);

      // No confirmation: complete lesson immediately even if some items are incomplete

      // Request server to skip quiz/module-level requirements when completing
  const result = await ProgressAPI.completeLesson(lessonId, timeSpent, { skipQuiz: true, forceModuleComplete: true });

      if (result.xpEarned) {
        alert(`Lesson completed! You earned ${result.xpEarned} XP!${result.leveledUp ? ' Level Up!' : ''}`);
      }

      navigate(-1);
    } catch (err) {
      setError('Failed to complete lesson');
    }
  };

  const renderContent = () => {
    if (!content[currentContentIndex]) return null;

    const currentContent = content[currentContentIndex];
    // moved logging to a useEffect to avoid logging on every timer tick
    switch (currentContent.type) {
      case 'video':
        console.log('🎬 LessonPlayer: Rendering video with URL:', currentContent.url);
        return (
          <div className="lms-video-wrapper">
            <div className="mb-2 small text-muted">Source: {videoFallbackUrl || currentContent.url}</div>
            <video
              className="lms-video-player"
              controls
              preload="metadata"
              crossOrigin="anonymous"
              ref={videoRef}
              src={videoFallbackUrl || currentContent.url}
              onLoadStart={() => console.log('🎬 Video: Load start')}
              onLoadedData={() => console.log('🎬 Video: Loaded data')}
              onCanPlay={() => console.log('🎬 Video: Can play')}
              onWaiting={() => console.log('🎬 Video: Waiting for more data')}
              onStalled={() => console.log('🎬 Video: Stalled')}
              onProgress={() => console.log('🎬 Video: Progress event')}
              onError={async (e) => {
                console.error('❌ Video Error event:', e);
                console.error('❌ Video Error details:', e.target?.error);
                // Try a one-time fallback: fetch the file and create a blob URL
                if (!videoFallbackAttempted && currentContent.url) {
                  setVideoFallbackAttempted(true);
                  try {
                    console.log('🎬 Video: attempting fallback fetch for', currentContent.url);
                    const resp = await fetch(currentContent.url, { method: 'GET' });
                    if (!resp.ok) {
                      console.error('🎬 Video fallback fetch failed status:', resp.status);
                      return;
                    }
                    const blob = await resp.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setVideoFallbackUrl(blobUrl);
                    // load the blob into the player
                    if (videoRef.current) {
                      videoRef.current.src = blobUrl;
                      videoRef.current.load();
                      try { await videoRef.current.play(); } catch (playErr) { console.log('🎬 Video: play() after fallback failed:', playErr.message); }
                    }
                  } catch (err) {
                    console.error('🎬 Video fallback fetch error:', err.message || err);
                  }
                }
              }}
              onEnded={() => markContentComplete(currentContent._id)}
            >
              Your browser does not support the video tag.
            </video>
            <div className="mt-2">
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={async () => {
                // clear fallback and attempt reload
                if (videoFallbackUrl) {
                  try { URL.revokeObjectURL(videoFallbackUrl); } catch (e) {}
                  setVideoFallbackUrl(null);
                }
                setVideoFallbackAttempted(false);
                if (videoRef.current) {
                  try { videoRef.current.pause(); } catch (e) {}
                  videoRef.current.src = currentContent.url;
                  videoRef.current.load();
                  try { await videoRef.current.play(); } catch (e) { console.log('Retry play failed', e.message); }
                }
              }}>Retry</button>
            </div>
          </div>
        );

      case 'reading':
        return (
          <div className="lms-content-box">
            <h3>{currentContent.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: currentContent.htmlContent || currentContent.description }} />
          </div>
        );

      case 'interactive':
        return (
          <div className="lms-content-box">
            <h3>{currentContent.title}</h3>
            <p>{currentContent.description}</p>
            {currentContent.url && (
              <iframe
                src={currentContent.url}
                width="100%"
                height="600px"
                frameBorder="0"
                title={currentContent.title}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="lms-content-box">
            <h3>{currentContent.title}</h3>
            <p>{currentContent.description}</p>
          </div>
        );
    }
  };

  // Log when the currently rendered content actually changes
  const currentContentId = content[currentContentIndex]?._id || null;
  useEffect(() => {
    if (!currentContentId) return;
    const current = content[currentContentIndex];
    console.log('🎬 LessonPlayer: Rendering content:', {
      index: currentContentIndex,
      title: current?.title,
      type: current?.type,
      url: current?.url
    });
  }, [currentContentIndex, currentContentId, content]);

  // quizzes are filtered out so there's nothing to auto-skip

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (!lesson) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Lesson not found</Alert>
      </Container>
    );
  }

  const hasNoRenderableContent = content.length === 0;
  const isLastContent = hasNoRenderableContent ? true : currentContentIndex === content.length - 1;
  // Treat quiz-type content with missing quizId as not required for completion
  
  return (
    <div className="lesson-player-container">
      {error && (
        <Container className="mt-3">
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        </Container>
      )}

      {saving && (
        <div className="lms-save-badge">
          Saving progress...
        </div>
      )}

      <Container className="py-4">
        <Row className="mb-3">
          <Col>
            <Button variant="link" onClick={() => navigate(-1)} className="p-0 mb-2">
              <FaArrowLeft className="me-2" />
              Back to Module
            </Button>
            <h2>{lesson.name}</h2>
            <p className="text-muted">{lesson.description}</p>
          </Col>
          <Col xs="auto">
            <div className="text-end">
              <small className="text-muted d-block">Time Spent</small>
              <strong className="fs-5">{formatTime(timeSpent)}</strong>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">Progress:</small>
              {content.map((item, index) => (
                <div
                  key={item._id}
                  style={{
                    width: '30px',
                    height: '4px',
                    backgroundColor: completedItems.includes(item._id) ? '#28a745' : index === currentContentIndex ? '#007bff' : '#dee2e6',
                    borderRadius: '2px'
                  }}
                />
              ))}
              <small className="text-muted">
                {content.length === 0 ? '0 / 0' : `${currentContentIndex + 1} / ${content.length}`}
              </small>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={9}>
            {renderContent()}

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button
                variant="outline-secondary"
                onClick={handlePreviousContent}
                disabled={currentContentIndex === 0}
              >
                <FaArrowLeft className="me-2" />
                Previous
              </Button>

              <div className="text-center">
                <small className="text-muted">
                  {content[currentContentIndex]?.title}
                </small>
              </div>

              {isLastContent ? (
                <>
                <Button
                  variant="success"
                  onClick={handleCompleteLesson}
                  // Allow force-complete: user can complete even if not all items are marked completed
                  disabled={false}
                >
                  <FaCheck className="me-2" />
                  Complete Lesson
                </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleNextContent}
                >
                  Next
                  <FaArrowRight className="ms-2" />
                </Button>
              )}
            </div>
          </Col>

          <Col lg={3}>
            <Card className="lms-content-box sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h6 className="mb-3">Lesson Content</h6>
                <div className="list-group list-group-flush">
                  {content.map((item, index) => (
                      <div
                        key={item._id}
                        className={`list-group-item list-group-item-action ${
                          index === currentContentIndex ? 'active' : ''
                        } ${completedItems.includes(item._id) ? 'list-group-item-success' : ''}`}
                        style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                          onClick={() => {
                          // quizzes are filtered out earlier, so simply set the index
                          setCurrentContentIndex(index);
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <span className="me-2">{index + 1}.</span>
                          <span className="flex-grow-1">{item.title}</span>
                          {completedItems.includes(item._id) && (
                            <FaCheck className="text-success" size={12} />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <hr />

                <div className="small">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completed:</span>
                    <strong>{content.length === 0 ? '0 / 0' : `${completedItems.length} / ${content.length}`}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Time:</span>
                    <strong>{formatTime(timeSpent)}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LessonPlayer;
