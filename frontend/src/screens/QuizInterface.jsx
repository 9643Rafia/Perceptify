import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheck, FaTimes, FaFlag, FaClock } from 'react-icons/fa';
import QuizzesAPI from '../services/quizzes.api';
import LessonProgressAPI from '../services/lessonProgress.service';
import LearningAPI from '../services/learning.api';

const QuizInterface = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const contentId = searchParams.get('contentId');
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const handleSubmitRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await QuizzesAPI.getQuizById(quizId);
        if (!mounted) return;
        setQuiz(data.quiz);
      } catch (err) {
        setError('Failed to load quiz');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.timeLimit && !showResults) {
      setTimeRemaining(quiz.timeLimit * 60);

        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              handleSubmitRef.current && handleSubmitRef.current();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, showResults]);

  

  const handleAnswerSelect = (questionId, answer) => {
    const question = quiz.questions.find(q => q.questionId === questionId);

    if (question.questionType === 'multiple_select') {
      const currentAnswers = answers[questionId] || [];
      if (currentAnswers.includes(answer)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter(a => a !== answer)
        });
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, answer]
        });
      }
    } else {
      setAnswers({
        ...answers,
        [questionId]: answer
      });
    }
  };

  const toggleMarkForReview = (questionId) => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(questionId)) {
      newMarked.delete(questionId);
    } else {
      newMarked.add(questionId);
    }
    setMarkedForReview(newMarked);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unansweredCount = quiz.questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered questions. Submit anyway?`
      );
      if (!confirm) return;
    }

    try {
      setSubmitting(true);
      const formattedAnswers = quiz.questions.map(q => ({
        questionId: q.questionId,
        selectedAnswer: answers[q.questionId] || null,
        markedForReview: markedForReview.has(q.questionId)
      }));

      const startTime = quiz.timeLimit ? quiz.timeLimit * 60 - timeRemaining : 0;
  const result = await QuizzesAPI.submitQuiz(quizId, formattedAnswers, startTime);

      // If this is a mini-quiz from a lesson, mark the content as complete
      if (lessonId && contentId && result.passed) {
        console.log('🎯 QUIZ COMPLETION: Starting lesson progress update', {
          lessonId,
          contentId,
          quizPassed: result.passed,
          score: result.score
        });

        try {
          // Get current lesson progress to append the completed content
          console.log('📡 QUIZ COMPLETION: Fetching current lesson progress...');
          const lessonData = await LearningAPI.getLessonById(lessonId);
          const currentCompleted = lessonData.progress?.completedContentItems || [];
          console.log('📊 QUIZ COMPLETION: Current completed items:', currentCompleted);

          if (!currentCompleted.includes(contentId)) {
            console.log('💾 QUIZ COMPLETION: Updating backend progress...');
            await LessonProgressAPI.updateLessonProgress(lessonId, {
              completedContentItems: [...currentCompleted, contentId]
            });
            console.log('✅ QUIZ COMPLETION: Backend progress updated successfully');
          } else {
            console.log('⚠️ QUIZ COMPLETION: Content already marked as completed');
          }

          // Also update localStorage for immediate lesson player sync
          const lsKey = `lesson:${lessonId}`;
          console.log('💽 QUIZ COMPLETION: Updating lesson localStorage...', { lsKey });

          try {
            const existing = localStorage.getItem(lsKey);
            let localData = existing ? JSON.parse(existing) : {};
            console.log('📈 QUIZ COMPLETION: Current localStorage data:', localData);

            if (!localData.completedContentItems) localData.completedContentItems = [];
            if (!localData.completedContentItems.includes(contentId)) {
              localData.completedContentItems = [...localData.completedContentItems, contentId];
              localData.t = Date.now();
              localStorage.setItem(lsKey, JSON.stringify(localData));
              console.log('✅ QUIZ COMPLETION: localStorage updated successfully:', localData);
            } else {
              console.log('⚠️ QUIZ COMPLETION: Content already in localStorage');
            }
          } catch (localErr) {
            console.error('❌ QUIZ COMPLETION: Failed to update lesson localStorage:', localErr);
          }
        } catch (progressErr) {
          console.error('❌ QUIZ COMPLETION: Failed to update lesson progress:', progressErr);
        }
      } else {
        console.log('🚫 QUIZ COMPLETION: Skipping lesson update', {
          hasLessonId: !!lessonId,
          hasContentId: !!contentId,
          quizPassed: result.passed
        });
      }

      setResults(result);
      setShowResults(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (err) {
      setError('Failed to submit quiz: ' + err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // keep a stable ref to handleSubmit for timer effect
  handleSubmitRef.current = handleSubmit;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const question = quiz.questions[index];
    const isAnswered = answers[question.questionId] !== undefined;
    const isMarked = markedForReview.has(question.questionId);

    if (isMarked) return 'lms-marked';
    if (isAnswered) return 'lms-answered';
    return '';
  };

  const renderQuestion = () => {
    const question = quiz.questions[currentQuestion];
    const userAnswer = answers[question.questionId];

    return (
      <Card className="lms-question-box">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h5>Question {currentQuestion + 1} of {quiz.questions.length}</h5>
            <Button
              variant={markedForReview.has(question.questionId) ? 'warning' : 'outline-warning'}
              size="sm"
              onClick={() => toggleMarkForReview(question.questionId)}
            >
              <FaFlag className="me-1" />
              {markedForReview.has(question.questionId) ? 'Marked' : 'Mark for Review'}
            </Button>
          </div>

          <p className="fs-5 mb-4">{question.questionText}</p>

          {question.questionType === 'multiple_choice' || question.questionType === 'true_false' ? (
            <div>
              {question.options.map(option => (
                <div
                  key={option.optionId}
                  className={`lms-option-box ${
                    userAnswer === option.optionId ? 'lms-selected' : ''
                  }`}
                  onClick={() => handleAnswerSelect(question.questionId, option.optionId)}
                >
                  <Form.Check
                    type="radio"
                    id={option.optionId}
                    name={question.questionId}
                    label={option.text}
                    checked={userAnswer === option.optionId}
                    onChange={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : question.questionType === 'multiple_select' ? (
            <div>
              {question.options.map(option => (
                <div
                  key={option.optionId}
                  className={`lms-option-box ${
                    userAnswer && userAnswer.includes(option.optionId) ? 'lms-selected' : ''
                  }`}
                  onClick={() => handleAnswerSelect(question.questionId, option.optionId)}
                >
                  <Form.Check
                    type="checkbox"
                    id={option.optionId}
                    label={option.text}
                    checked={userAnswer && userAnswer.includes(option.optionId)}
                    onChange={() => {}}
                  />
                </div>
              ))}
              <small className="text-muted">Select all that apply</small>
            </div>
          ) : question.questionType === 'short_answer' ? (
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Type your answer here"
                value={userAnswer || ''}
                onChange={(e) => handleAnswerSelect(question.questionId, e.target.value)}
              />
            </Form.Group>
          ) : null}
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

        <h3>{results.passed ? 'Congratulations!' : 'Keep Trying!'}</h3>
        <p className="lead">
          {results.passed
            ? `You passed the quiz with ${results.score}%!`
            : `You scored ${results.score}%. Passing score is ${quiz.passingScore}%.`}
        </p>

        {results.xpEarned > 0 && (
          <Alert variant="success">
            <strong>+{results.xpEarned} XP</strong>
            {results.leveledUp && <span className="ms-2">🎉 Level Up!</span>}
          </Alert>
        )}

        <div className="mt-4">
          <h5>Review Answers</h5>
          {quiz.questions.map((question, index) => {
            const answer = results.answers.find(a => a.questionId === question.questionId);
            return (
              <Card key={question.questionId} className="mb-3">
                <Card.Body>
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      {answer.isCorrect ? (
                        <FaCheck className="text-success" size={24} />
                      ) : (
                        <FaTimes className="text-danger" size={24} />
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <h6>Question {index + 1}</h6>
                      <p>{question.questionText}</p>

                      {question.questionType !== 'short_answer' ? (
                        <>
                          <div className="mb-2">
                            <strong>Your Answer:</strong>
                            {question.options
                              .filter(opt => {
                                if (Array.isArray(answer.selectedAnswer)) {
                                  return answer.selectedAnswer.includes(opt.optionId);
                                }
                                return answer.selectedAnswer === opt.optionId;
                              })
                              .map(opt => (
                                <Badge
                                  key={opt.optionId}
                                  bg={answer.isCorrect ? 'success' : 'danger'}
                                  className="ms-2"
                                >
                                  {opt.text}
                                </Badge>
                              ))}
                          </div>
                          {!answer.isCorrect && (
                            <div className="mb-2">
                              <strong>Correct Answer:</strong>
                              {question.options
                                .filter(opt => {
                                  if (Array.isArray(answer.correctAnswer)) {
                                    return answer.correctAnswer.includes(opt.optionId);
                                  }
                                  return answer.correctAnswer === opt.optionId;
                                })
                                .map(opt => (
                                  <Badge key={opt.optionId} bg="success" className="ms-2">
                                    {opt.text}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="mb-2">
                            <strong>Your Answer:</strong> {answer.selectedAnswer}
                          </div>
                          {!answer.isCorrect && (
                            <div className="mb-2">
                              <strong>Correct Answer:</strong> {answer.correctAnswer}
                            </div>
                          )}
                        </>
                      )}

                      {answer.explanation && (
                        <Alert variant="info" className="mt-2 mb-0">
                          <small>{answer.explanation}</small>
                        </Alert>
                      )}
                    </div>
                  </div>
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

  if (!quiz) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Quiz not found</Alert>
      </Container>
    );
  }

  if (showResults) {
    return (
      <div className="lms-quiz-wrapper">
        <Container>{renderResults()}</Container>
      </div>
    );
  }

  return (
    <div className="lms-quiz-wrapper">
      {error && (
        <Container>
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        </Container>
      )}

      <Container>
        <Card className="lms-quiz-header-box">
          <Card.Body>
            <Row className="align-items-center">
              <Col>
                <h3 className="mb-0">{quiz.title}</h3>
                <small className="text-muted">{quiz.description}</small>
              </Col>
              {timeRemaining !== null && (
                <Col xs="auto">
                  <div className="lms-timer-display">
                    <FaClock className="me-2" />
                    {formatTime(timeRemaining)}
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        <div className="lms-question-nav-grid mt-4">
          {quiz.questions.map((q, index) => (
            <button
              key={q.questionId}
              className={`lms-q-nav-btn ${index === currentQuestion ? 'lms-current' : ''} ${getQuestionStatus(index)}`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <Row className="mt-4">
          <Col lg={9}>
            {renderQuestion()}

            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="outline-secondary"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Previous
              </Button>

              {currentQuestion === quiz.questions.length - 1 ? (
                <Button variant="success" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </Col>

          <Col lg={3}>
            <Card className="lms-content-box sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h6 className="mb-3">Quiz Progress</h6>
                <div className="small mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Answered:</span>
                    <strong>{Object.keys(answers).length} / {quiz.questions.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Marked:</span>
                    <strong>{markedForReview.size}</strong>
                  </div>
                </div>

                <hr />

                <div className="small">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="lms-q-nav-btn lms-answered" style={{ width: '20px', height: '20px', fontSize: '10px' }}></div>
                    <span>Answered</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="lms-q-nav-btn lms-marked" style={{ width: '20px', height: '20px', fontSize: '10px' }}></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="lms-q-nav-btn lms-current" style={{ width: '20px', height: '20px', fontSize: '10px' }}></div>
                    <span>Current Question</span>
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

export default QuizInterface;
