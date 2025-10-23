"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiCheck, FiX, FiArrowRight, FiZoomIn, FiInfo, FiAward, FiBarChart2 } from "react-icons/fi"
import confetti from "canvas-confetti"
import pg1img1 from "../assets/pg1img1.jpg";
import pg1img2 from "../assets/pg1img2.png";
import pg2img2 from "../assets/pg2img2.jpg"
import pg2img1 from "../assets/pg2img1.png"

const DeepfakeDetectionDemo = () => {
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [score, setScore] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(null)
  const confettiCanvasRef = useRef(null)

  // Sample challenge data
  const challenges = [
    {
      id: 1,
      imageA: pg1img1,
      imageB: pg1img2,
      fakeImage: "B",
      explanation:
        "Image B was generated using ChatGPT. Notice the unnatural nailpolish on the hands and the stringy, out of place eyelashes. The background is also inconsistently blurred",
    },
    {
      id: 2,
      imageA: pg2img2,
      imageB: pg2img1,
      fakeImage: "A",
      explanation:
        "Image A is AI-generated. Look at the teeth - they appear blurred and unnaturally aligned. Also, the background has inconsistent blurring patterns.",
    }
  ]

  const triggerConfetti = () => {
    if (confettiCanvasRef.current) {
      confetti.create(confettiCanvasRef.current, {
        resize: true,
        useWorker: true,
      })({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }

  const handleSelectImage = (image) => {
    setSelectedImage(image)
    setShowResult(true)

    // Check if answer is correct
    const isCorrect = image === challenges[currentChallenge].fakeImage
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1)
      triggerConfetti()
    }
  }

  const handleConfidenceSelect = (level) => {
    setConfidence(level)
  }

  const handleNextChallenge = () => {
    setSelectedImage(null)
    setShowResult(false)
    setConfidence(0)
    setZoomedImage(null)

    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge((prev) => prev + 1)
    } else {
      setShowSummary(true)
    }
  }

  const handleRestart = () => {
    setCurrentChallenge(0)
    setSelectedImage(null)
    setShowResult(false)
    setConfidence(0)
    setScore(0)
    setShowSummary(false)
    setZoomedImage(null)
  }

  const handleZoomImage = (image) => {
    setZoomedImage(zoomedImage === image ? null : image)
  }

  return (
    <div className="deepfake-demo-container">
      <canvas ref={confettiCanvasRef} className="confetti-canvas"></canvas>
      
      {/* Background Elements */}
      <div className="background-elements">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Header */}
      <header className="demo-header">
        <div className="logo">
          <span className="logo-icon">P</span>
          <span className="logo-text">Perceptify</span>
        </div>
        <h1 className="page-title">Deepfake Detection Challenge</h1>
        <a href="/" className="return-link">
          Return to Dashboard
        </a>
      </header>

      {/* Main Content */}
      <main className="demo-content">
        <AnimatePresence mode="wait">
          {!showSummary ? (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="challenge-container"
            >
              {/* Intro Section */}
              <section className="intro-section">
                <h2>Can You Spot the Fake?</h2>
                <p>
                  You'll be shown two faces side by side. One is real, the other is AI-generated. Can you tell which one
                  is fake?
                </p>
              </section>

              {/* Progress Bar */}
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${((currentChallenge + 1) / challenges.length) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  Challenge {currentChallenge + 1} of {challenges.length}
                </div>
              </div>

              {/* Image Comparison Interface */}
              <section className="comparison-section">
                <div className="images-container">
                  <motion.div
                    className={`image-card ${selectedImage === "A" ? "selected" : ""} ${
                      showResult && challenges[currentChallenge].fakeImage === "A" ? "fake" : ""
                    } ${showResult && challenges[currentChallenge].fakeImage !== "A" ? "real" : ""}`}
                    whileHover={{ scale: zoomedImage === "A" ? 1 : 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="image-wrapper">
                      <img
                        src={challenges[currentChallenge].imageA || "/placeholder.svg"}
                        alt="Portrait A - option A"
                        className={zoomedImage === "A" ? "zoomed" : ""}
                      />
                      <button className="zoom-button" onClick={() => handleZoomImage("A")}>
                        <FiZoomIn />
                      </button>
                      {showResult && (
                        <div
                          className={`image-badge ${
                            challenges[currentChallenge].fakeImage === "A" ? "fake-badge" : "real-badge"
                          }`}
                        >
                          {challenges[currentChallenge].fakeImage === "A" ? "FAKE" : "REAL"}
                        </div>
                      )}
                    </div>
                    <div className="image-label">Image A</div>
                    {!showResult && (
                      <button
                        className="select-button"
                        onClick={() => handleSelectImage("A")}
                        disabled={selectedImage !== null}
                      >
                        Select A
                      </button>
                    )}
                  </motion.div>

                  <motion.div
                    className={`image-card ${selectedImage === "B" ? "selected" : ""} ${
                      showResult && challenges[currentChallenge].fakeImage === "B" ? "fake" : ""
                    } ${showResult && challenges[currentChallenge].fakeImage !== "B" ? "real" : ""}`}
                    whileHover={{ scale: zoomedImage === "B" ? 1 : 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="image-wrapper">
                      <img
                        src={challenges[currentChallenge].imageB || "/placeholder.svg"}
                        alt="Portrait B - option B"
                        className={zoomedImage === "B" ? "zoomed" : ""}
                      />
                      <button className="zoom-button" onClick={() => handleZoomImage("B")}>
                        <FiZoomIn />
                      </button>
                      {showResult && (
                        <div
                          className={`image-badge ${
                            challenges[currentChallenge].fakeImage === "B" ? "fake-badge" : "real-badge"
                          }`}
                        >
                          {challenges[currentChallenge].fakeImage === "B" ? "FAKE" : "REAL"}
                        </div>
                      )}
                    </div>
                    <div className="image-label">Image B</div>
                    {!showResult && (
                      <button
                        className="select-button"
                        onClick={() => handleSelectImage("B")}
                        disabled={selectedImage !== null}
                      >
                        Select B
                      </button>
                    )}
                  </motion.div>
                </div>
              </section>

              {/* User Feedback Section */}
              <AnimatePresence>
                {showResult && (
                  <motion.section
                    className="feedback-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`result-card ${
                        selectedImage === challenges[currentChallenge].fakeImage ? "correct" : "incorrect"
                      }`}
                    >
                      <div className="result-icon">
                        {selectedImage === challenges[currentChallenge].fakeImage ? <FiCheck /> : <FiX />}
                      </div>
                      <h3>
                        {selectedImage === challenges[currentChallenge].fakeImage
                          ? "You got it right!"
                          : "Oops, that was incorrect."}
                      </h3>
                      <p className="explanation">
                        <FiInfo className="explanation-icon" />
                        {challenges[currentChallenge].explanation}
                      </p>

                      <div className="confidence-rating">
                        <p>How confident were you in your answer?</p>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className={`star-button ${confidence >= star ? "active" : ""}`}
                              onClick={() => handleConfidenceSelect(star)}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <button className="next-button" onClick={handleNextChallenge}>
                        {currentChallenge < challenges.length - 1 ? (
                          <>
                            Next Challenge <FiArrowRight />
                          </>
                        ) : (
                          <>
                            See Results <FiArrowRight />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="summary-container"
            >
              <div className="summary-card">
                <div className="summary-header">
                  <h2>Challenge Complete!</h2>
                  <div className="trophy-icon">
                    <FiAward />
                  </div>
                </div>

                <div className="score-section">
                  <div className="score-circle">
                    <svg viewBox="0 0 100 100">
                      <circle className="score-circle-bg" cx="50" cy="50" r="45" />
                      <circle
                        className="score-circle-fill"
                        cx="50"
                        cy="50"
                        r="45"
                        strokeDasharray={`${(score / challenges.length) * 283} 283`}
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-number">{score}</span>
                      <span className="score-total">/{challenges.length}</span>
                    </div>
                  </div>
                  <div className="score-label">Correct Answers</div>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <FiBarChart2 />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{((score / challenges.length) * 100).toFixed(0)}%</div>
                      <div className="stat-label">Accuracy</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <div className="stat-value">3.5</div>
                      <div className="stat-label">Avg. Confidence</div>
                    </div>
                  </div>
                </div>

                <div className="tips-section">
                  <h3>Tips to Improve</h3>
                  <ul className="tips-list">
                    <li>
                      <span className="tip-bullet">•</span>
                      <span>
                        Check for asymmetry in facial features. AI often struggles with perfect symmetry in eyes,
                        earrings, or glasses.
                      </span>
                    </li>
                    <li>
                      <span className="tip-bullet">•</span>
                      <span>
                        Look at the background. Deepfakes often have blurry, inconsistent, or unnaturally blended
                        backgrounds.
                      </span>
                    </li>
                    <li>
                      <span className="tip-bullet">•</span>
                      <span>
                        Examine fine details like hair strands, teeth alignment, and reflections in the eyes.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="summary-actions">
                  <button className="restart-button" onClick={handleRestart}>
                    Try Again
                  </button>
                  <a href="/for-educators" className="educator-link">
                    Want to use this in your classroom? <span>Customize a module →</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default DeepfakeDetectionDemo
