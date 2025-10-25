import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import LearningAPI from '../services/learning.api';
import LessonProgressAPI from '../services/lessonProgress.service';
import ProgressAPI from '../services/progress.api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

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
  const [completedItems, setCompletedItems] = useState([]);
  const timerRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const timeSpentRef = useRef(0);
  const [videoFallbackUrl, setVideoFallbackUrl] = useState(null);
  const autoSaveRef = useRef(null);
  const [videoFallbackAttempted, setVideoFallbackAttempted] = useState(false);
  const timeDisplayRef = useRef(null);
  const debounceRef = useRef(null);

  // --- helpers for persistence ---
  const lsKey = `lesson:${lessonId}`;
  const mirrorLocal = useCallback((payload) => {
    try {
      console.log('💾 MIRROR LOCAL: Saving to localStorage', { lsKey, payload });
      localStorage.setItem(lsKey, JSON.stringify({
        lastPosition: payload.lastPosition,
        timeSpent: payload.timeSpent,
        completedContentItems: payload.completedContentItems,
        t: Date.now(),
      }));
      console.log('✅ MIRROR LOCAL: Successfully saved to localStorage');
    } catch (err) {
      console.error('❌ MIRROR LOCAL: Failed to save to localStorage:', err);
    }
  }, [lsKey]);
  const persistDebounced = useCallback((payload, delay = 600) => {
    mirrorLocal(payload);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await LessonProgressAPI.updateLessonProgress(lessonId, payload);
      } catch (e) {
        console.warn('Debounced save failed', e?.message || e);
      } finally {
        setSaving(false);
      }
    }, delay);
  }, [lessonId, mirrorLocal]);

  // Function to refresh progress from server (used when returning from quiz)
  const refreshProgress = useCallback(async () => {
    if (!lesson) {
      console.log('🚫 PROGRESS REFRESH: No lesson loaded, skipping');
      return;
    }

    console.log('🔄 PROGRESS REFRESH: Starting progress refresh...', { lessonId });

    try {
      console.log('� PROGRESS REFRESH: Fetching latest lesson data from server...');
      const data = await LearningAPI.getLessonById(lessonId);
      let serverProgress = data.progress || {};
      console.log('📊 PROGRESS REFRESH: Server progress received:', serverProgress);

      // Load current localStorage
      let local = null;
      try {
        const localRaw = localStorage.getItem(lsKey);
        local = localRaw ? JSON.parse(localRaw) : null;
        console.log('💽 PROGRESS REFRESH: localStorage data loaded:', local);
      } catch (localErr) {
        console.warn('⚠️ PROGRESS REFRESH: Failed to parse localStorage:', localErr);
      }

      // Current state
      console.log('📈 PROGRESS REFRESH: Current component state:', {
        timeSpent: timeSpentRef.current,
        completedItems: completedItems,
        currentContentIndex: currentContentIndex
      });

      // Merge server and local data
      const mergedProgress = {
        timeSpent: Math.max(serverProgress.timeSpent || 0, local?.timeSpent || timeSpentRef.current || 0),
        completedContentItems: Array.from(new Set([
          ...(serverProgress.completedContentItems || []),
          ...(local?.completedContentItems || []),
          ...completedItems
        ])),
        lastPosition: serverProgress.lastPosition ?? local?.lastPosition ?? currentContentIndex
      };

      console.log('🔀 PROGRESS REFRESH: Merged progress result:', mergedProgress);

      // Check if there are changes
      const hasChanges =
        mergedProgress.timeSpent !== timeSpentRef.current ||
        mergedProgress.completedContentItems.length !== completedItems.length ||
        mergedProgress.lastPosition !== currentContentIndex;

      console.log('🔍 PROGRESS REFRESH: Changes detected:', hasChanges, {
        timeChanged: mergedProgress.timeSpent !== timeSpentRef.current,
        completedChanged: mergedProgress.completedContentItems.length !== completedItems.length,
        positionChanged: mergedProgress.lastPosition !== currentContentIndex
      });

      // Update state and refs
      timeSpentRef.current = mergedProgress.timeSpent;
      setCompletedItems(mergedProgress.completedContentItems);
      setCurrentContentIndex(mergedProgress.lastPosition);

      // Update localStorage with merged data
      mirrorLocal(mergedProgress);

      console.log('✅ PROGRESS REFRESH: Progress refresh completed successfully');

      if (hasChanges) {
        console.log('🎯 PROGRESS REFRESH: UI should update with new progress');
      }

    } catch (err) {
      console.error('❌ PROGRESS REFRESH: Failed to refresh progress:', err);
    }
  }, [lesson, lessonId, lsKey, completedItems, currentContentIndex, mirrorLocal]);

  // --- Load Lesson Data ---
  useEffect(() => {
    let mounted = true;

    const loadLesson = async () => {
      try {
        setLoading(true);
        console.log('🎥 Fetching lesson data for:', lessonId);
        const data = await LearningAPI.getLessonById(lessonId);
        if (!mounted) return;

        setLesson(data.lesson);
        setContent(data.content || []);

        // start with server values
        let serverTime = Number(data?.progress?.timeSpent ?? 0);
        let serverIndex = Number(data?.progress?.lastPosition ?? 0);
        let serverCompleted = Array.isArray(data?.progress?.completedContentItems)
          ? data.progress.completedContentItems
          : [];

        console.log('📊 LESSON LOAD: Server progress loaded:', {
          serverTime,
          serverIndex,
          serverCompleted
        });

        // merge with local snapshot (if present)
        let local = null;
        try { local = JSON.parse(localStorage.getItem(lsKey) || 'null'); } catch {}
        console.log('💽 LESSON LOAD: localStorage progress loaded:', local);

        if (local) {
          if (Number.isFinite(local.timeSpent) && local.timeSpent > serverTime) {
            console.log('⏰ LESSON LOAD: Using localStorage timeSpent (higher than server)');
            serverTime = local.timeSpent;
          }
          if (Number.isFinite(local.lastPosition)) {
            console.log('📍 LESSON LOAD: Using localStorage lastPosition');
            serverIndex = local.lastPosition;
          }
          if (Array.isArray(local.completedContentItems)) {
            console.log('✅ LESSON LOAD: Merging completedContentItems');
            serverCompleted = Array.from(new Set([...serverCompleted, ...local.completedContentItems]));
          }
        }

        // clamp index to available content
        const maxIndex = Math.max(0, (data.content?.length || 1) - 1);
        const startIndex = Math.min(Math.max(0, serverIndex), maxIndex);

        console.log('🎯 LESSON LOAD: Final merged progress:', {
          timeSpent: serverTime,
          lastPosition: startIndex,
          completedContentItems: serverCompleted
        });

        timeSpentRef.current = Math.max(0, serverTime | 0);
        setCompletedItems(serverCompleted);
        setCurrentContentIndex(startIndex);
      } catch (err) {
        console.error('❌ Error loading lesson:', err);
        if (mounted) setError('Failed to load lesson');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadLesson();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      if (videoFallbackUrl) {
        try { URL.revokeObjectURL(videoFallbackUrl); } catch (e) {}
      }
    };
  }, [lessonId, videoFallbackUrl, lsKey]); // ✅ Only re-run if lessonId, fallback, or lsKey changes

  // --- Timer + Auto-Save Logic ---
  // Keep a fresh copy of auto-save function (refs avoid re-renders)
  useEffect(() => {
    autoSaveRef.current = async () => {
      if (!lesson) return;
      const latestTimeSpent = timeSpentRef.current;
      try {
        setSaving(true);
        const payload = {
          timeSpent: latestTimeSpent,
          lastPosition: currentContentIndex,
          completedContentItems: completedItems,
        };
        mirrorLocal(payload); // mirror on every autosave
        await LessonProgressAPI.updateLessonProgress(lessonId, payload);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    };
  }, [lesson, lessonId, currentContentIndex, completedItems, mirrorLocal]);

  useEffect(() => {
    if (!lesson) return;

    // 1️⃣ Timer: increment every second
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        timeSpentRef.current += 1;
      }, 1000);
    }

    // 2️⃣ Update visible time every 1s directly via DOM (no React state updates)
    const syncInterval = setInterval(() => {
      try {
        const secs = timeSpentRef.current;
        const mins = Math.floor(secs / 60);
        const formatted = `${mins}:${(secs % 60).toString().padStart(2, '0')}`;
        if (timeDisplayRef.current) timeDisplayRef.current.textContent = formatted;
      } catch (e) {
        console.warn('Time display update failed', e.message || e);
      }
    }, 1000);

    // 3️⃣ Auto-save progress every 30s using the latest ref
    if (!saveIntervalRef.current) {
      saveIntervalRef.current = setInterval(() => {
        if (autoSaveRef.current) autoSaveRef.current();
      }, 30000);
    }

    // 🧹 Cleanup on unmount or lesson change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      clearInterval(syncInterval);
    };
  }, [lesson]); // ✅ Run once per lesson load

  // Persist on tab close / hide (sendBeacon + local mirror)
  useEffect(() => {
    const handler = () => {
      const payload = {
        timeSpent: timeSpentRef.current || 0,
        lastPosition: currentContentIndex,
        completedContentItems: completedItems,
      };
      mirrorLocal(payload);
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const url = `${API_BASE}/progress/lesson/${lessonId}`;
        if (navigator.sendBeacon) navigator.sendBeacon(url, blob);
      } catch {}
    };
    const visHandler = () => { if (document.visibilityState === 'hidden') handler(); };

    window.addEventListener('beforeunload', handler);
    document.addEventListener('visibilitychange', visHandler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, [lessonId, currentContentIndex, completedItems, mirrorLocal]);

  // Refresh progress when window regains focus (e.g., returning from quiz)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🎯 WINDOW FOCUS: Window regained focus, refreshing progress...');
      refreshProgress();
    };

    console.log('👂 WINDOW FOCUS: Setting up focus event listener');
    window.addEventListener('focus', handleFocus);
    return () => {
      console.log('🧹 WINDOW FOCUS: Cleaning up focus event listener');
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshProgress]);

  // --- actions that should persist immediately (debounced) ---
  const markContentComplete = (contentId) => {
    if (!completedItems.includes(contentId)) {
      const next = [...completedItems, contentId];
      setCompletedItems(next);
      persistDebounced({
        timeSpent: timeSpentRef.current || 0,
        lastPosition: currentContentIndex,
        completedContentItems: next,
      });
    }
  };

  const handleNextContent = () => {
    if (currentContentIndex < content.length - 1) {
      const currentContent = content[currentContentIndex];
      if (currentContent) markContentComplete(currentContent._id);
      const nextIndex = currentContentIndex + 1;
      setCurrentContentIndex(nextIndex);
      persistDebounced({
        timeSpent: timeSpentRef.current || 0,
        lastPosition: nextIndex,
        completedContentItems: completedItems,
      });
    }
  };

  const handlePreviousContent = () => {
    if (currentContentIndex > 0) {
      const prevIndex = currentContentIndex - 1;
      setCurrentContentIndex(prevIndex);
      persistDebounced({
        timeSpent: timeSpentRef.current || 0,
        lastPosition: prevIndex,
        completedContentItems: completedItems,
      });
    }
  };

  // quizzes are filtered out from `content`, so no need for quiz-skipping helpers

  const handleCompleteLesson = async () => {
    try {
      const currentContent = content[currentContentIndex];
      // Guard: content may be empty (we filtered out quizzes), so only mark if present
      if (currentContent) markContentComplete(currentContent._id);

      // Sync timeSpent state and ref to latest timer value
      const finalTimeSpent = timeSpentRef.current;

      // Send accurate timeSpent to backend
      const result = await LessonProgressAPI.completeLesson(lessonId, finalTimeSpent);

      // clear local snapshot on success
      try { localStorage.removeItem(lsKey); } catch {}

      try {
        const response = await fetch('http://localhost:5000/api/progress/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const progressData = await response.json();
        localStorage.setItem('progress', JSON.stringify(progressData));
      } catch (err) {
        console.warn('⚠️ Could not refresh progress data', err);
      }

      if (result.xpEarned) {
        alert(`Lesson completed! You earned ${result.xpEarned} XP!${result.leveledUp ? ' Level Up!' : ''}`);
      }

      navigate(-1);
      const latest = await ProgressAPI.getProgress();
      localStorage.setItem('progress', JSON.stringify(latest.data));
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
                  try { URL.revokeObjectURL(videoFallbackUrl); } catch (e) { }
                  setVideoFallbackUrl(null);
                }
                setVideoFallbackAttempted(false);
                if (videoRef.current) {
                  try { videoRef.current.pause(); } catch (e) { }
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

      case 'quiz':
        console.log('🎯 QUIZ RENDER: Rendering quiz content', {
          contentId: currentContent._id,
          quizId: currentContent.quizId,
          isCompleted: completedItems.includes(currentContent._id),
          completedItems: completedItems
        });
        return (
          <div className="lms-content-box text-center">
            <h3>{currentContent.title}</h3>
            <p>{currentContent.description}</p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                console.log('🚀 QUIZ CLICK: Navigating to quiz', {
                  quizId: currentContent.quizId,
                  lessonId,
                  contentId: currentContent._id
                });
                navigate(`/quiz/${currentContent.quizId}?lessonId=${lessonId}&contentId=${currentContent._id}`);
              }}
            >
              Start Quiz
            </Button>
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

  // Persist when choosing a content item from the list
  const onSelectContentIndex = (index) => {
    setCurrentContentIndex(index);
    persistDebounced({
      timeSpent: timeSpentRef.current || 0,
      lastPosition: index,
      completedContentItems: completedItems,
    });
  };

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
  const allQuizzesCompleted = content.filter(c => c.type === 'quiz').every(c => completedItems.includes(c._id));

  console.log('🎯 LESSON STATE: Completion check', {
    hasNoRenderableContent,
    isLastContent,
    currentContentIndex,
    totalContent: content.length,
    allQuizzesCompleted,
    quizItems: content.filter(c => c.type === 'quiz').map(c => ({
      id: c._id,
      completed: completedItems.includes(c._id)
    })),
    completedItems
  });

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
              <strong ref={timeDisplayRef} className="fs-5">{formatTime(timeSpentRef.current || 0)}</strong>
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

              {isLastContent && allQuizzesCompleted ? (
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
              ) : isLastContent ? (
                <div className="text-muted small">
                  Complete all quizzes to finish the lesson
                </div>
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
                      className={`list-group-item list-group-item-action ${index === currentContentIndex ? 'active' : ''
                        } ${completedItems.includes(item._id) ? 'list-group-item-success' : ''}`}
                      style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                      onClick={() => onSelectContentIndex(index)}
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
                    <strong>{formatTime(timeSpentRef.current)}</strong>
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
