"use client"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { FiArrowLeft, FiArrowRight, FiCheckCircle } from "react-icons/fi"
import api from "../services/api"

const InitialAssessmentQuiz = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState(null)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    heardAboutDeepfakes: "",
    knowWhatDeepfakesUsedFor: "",
    canIdentifyDeepfake: "",
    awareOfRisks: "",
    triedToDetect: ""
  })

  const totalSteps = 6

  const questions = [
    {
      step: 2,
      question: "Have you heard about deepfakes before?",
      field: "heardAboutDeepfakes",
      options: ["Yes", "No", "Not Sure"]
    },
    {
      step: 3,
      question: "Do you know what deepfakes are used for?",
      field: "knowWhatDeepfakesUsedFor",
      options: ["Yes, I understand", "I have a basic idea", "No idea"]
    },
    {
      step: 4,
      question: "Can you identify a deepfake video if you see one?",
      field: "canIdentifyDeepfake",
      options: ["Yes, confidently", "Maybe sometimes", "No, not at all"]
    },
    {
      step: 5,
      question: "Are you aware of the risks associated with deepfakes?",
      field: "awareOfRisks",
      options: ["Very aware", "Somewhat aware", "Not aware"]
    },
    {
      step: 6,
      question: "Have you ever tried to detect or analyze deepfake content?",
      field: "triedToDetect",
      options: ["Yes, multiple times", "Once or twice", "Never"]
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.email.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      case 2:
        return formData.heardAboutDeepfakes !== ""
      case 3:
        return formData.knowWhatDeepfakesUsedFor !== ""
      case 4:
        return formData.canIdentifyDeepfake !== ""
      case 5:
        return formData.awareOfRisks !== ""
      case 6:
        return formData.triedToDetect !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1)
      } else {
        handleSubmit()
      }
    } else {
      setError("Please complete this step before continuing")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError("")
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      const response = await api.post("/assessment/submit", {
        name: formData.name,
        email: formData.email,
        answers: {
          heardAboutDeepfakes: formData.heardAboutDeepfakes,
          knowWhatDeepfakesUsedFor: formData.knowWhatDeepfakesUsedFor,
          canIdentifyDeepfake: formData.canIdentifyDeepfake,
          awareOfRisks: formData.awareOfRisks,
          triedToDetect: formData.triedToDetect
        }
      })

      if (response.data.success) {
        setAssessmentResult(response.data.data)
        setSubmitSuccess(true)

        // If user is authenticated, redirect to dashboard after delay
        if (response.data.data.isAuthenticated) {
          setTimeout(() => {
            navigate("/dashboard", {
              state: {
                assessmentResult: response.data.data
              }
            })
          }, 2500)
        }
        // If not authenticated, show signup prompt (no auto-redirect)
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assessment. Please try again.")
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  }

  if (submitSuccess) {
    return (
      <motion.div
        className="assessment-quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="assessment-success">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <FiCheckCircle className="success-icon" />
          </motion.div>
          <h2>Assessment Complete!</h2>

          {assessmentResult?.isAuthenticated ? (
            <p>Thank you for completing the initial assessment. Redirecting to your dashboard...</p>
          ) : (
            <>
              <p className="assessment-result-message">
                Your assessment has been saved! Complete your registration to access your personalized learning track.
              </p>
              <div className="assessment-success-actions">
                <button
                  className="nav-button primary"
                  onClick={() => navigate("/signup", { state: { email: formData.email, fromAssessment: true } })}
                >
                  Sign Up to Continue
                </button>
                <button
                  className="nav-button secondary"
                  onClick={() => navigate("/login", { state: { email: formData.email, fromAssessment: true } })}
                >
                  Already have an account? Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="assessment-quiz-container">
      <div className="assessment-card">
        <div className="assessment-header">
          <h1>Initial Assessment Quiz</h1>
          <p className="assessment-subtitle">
            Help us understand your current knowledge about deepfakes
          </p>

          <div className="progress-indicator">
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="progress-text">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="assessment-content"
          >
            {currentStep === 1 && (
              <div className="step-content">
                <h2>Basic Information</h2>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>
            )}

            {questions.map(q => (
              currentStep === q.step && (
                <div key={q.step} className="step-content">
                  <h2>Question {q.step - 1}</h2>
                  <p className="question-text">{q.question}</p>
                  <div className="options-container">
                    {q.options.map((option, index) => (
                      <motion.button
                        key={index}
                        className={`option-button ${formData[q.field] === option ? "selected" : ""}`}
                        onClick={() => handleInputChange(q.field, option)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="option-radio">
                          {formData[q.field] === option && (
                            <motion.div
                              className="option-radio-selected"
                              layoutId="selected"
                            />
                          )}
                        </div>
                        <span>{option}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="assessment-navigation">
          <button
            className="nav-button secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <FiArrowLeft />
            Previous
          </button>

          <button
            className={`nav-button primary ${!isStepValid() ? "disabled" : ""}`}
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : currentStep === totalSteps ? (
              <>
                Submit
                <FiCheckCircle />
              </>
            ) : (
              <>
                Next
                <FiArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InitialAssessmentQuiz
