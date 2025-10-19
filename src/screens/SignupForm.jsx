"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { register } from "../services/auth.service"

const SignUpForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    role: "",
    guardianEmail: "",
  })

  const [errors, setErrors] = useState({})
  const [isMinor, setIsMinor] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is a minor whenever age changes
  useEffect(() => {
    if (formData.age && Number.parseInt(formData.age) < 18) {
      setIsMinor(true)
    } else {
      setIsMinor(false)
      // Clear guardian email if user is not a minor
      if (formData.guardianEmail) {
        setFormData((prev) => ({ ...prev, guardianEmail: "" }))
      }
    }
  }, [formData.age])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.age) {
      newErrors.age = "Age is required"
    } else if (isNaN(formData.age) || Number.parseInt(formData.age) <= 0 || Number.parseInt(formData.age) > 120) {
      newErrors.age = "Please enter a valid age"
    }

    if (!formData.role) {
      newErrors.role = "Please select a role"
    }

    if (isMinor && !formData.guardianEmail) {
      newErrors.guardianEmail = "Guardian's email is required for users under 18"
    } else if (isMinor && !/\S+@\S+\.\S+/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = "Guardian's email is invalid"
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSubmitStatus(null)
      return
    }

    setIsLoading(true)

    try {
      // Prepare data for API
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        role: formData.role,
        guardianEmail: isMinor ? formData.guardianEmail : null,
      }

      // Call the register API
      const response = await register(userData)

      // Set success status
      setSubmitStatus({
        type: isMinor ? "pending" : "success",
        message: isMinor
          ? "Your account is pending guardian approval. An email has been sent to your guardian for confirmation."
          : "Registration successful! You will be redirected to the dashboard.",
      })

      // If adult, redirect to dashboard after a delay
      if (!isMinor) {
        setTimeout(() => {
          navigate("/dashboard")
        }, 2000)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setSubmitStatus({
        type: "error",
        message: error.response?.data?.message || "Registration failed. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <div className="signup-header">
          <h2>Create Your Account</h2>
          <p>Join Perceptify and start your journey to understanding deepfakes</p>
        </div>

        {submitStatus ? (
          <div className={`signup-status ${submitStatus.type}`}>
            <h4>
              {submitStatus.type === "success"
                ? "Registration Complete"
                : submitStatus.type === "pending"
                  ? "Registration Pending"
                  : "Registration Failed"}
            </h4>
            <p>{submitStatus.message}</p>
            {submitStatus.type === "success" && (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Redirecting to dashboard...</p>
              </div>
            )}
            {submitStatus.type === "pending" && (
              <button onClick={() => navigate("/")} className="btn secondary mt-3">
                Return to Home
              </button>
            )}
            {submitStatus.type === "error" && (
              <button onClick={() => setSubmitStatus(null)} className="btn primary mt-3">
                Try Again
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                className={`form-control ${errors.age ? "is-invalid" : ""}`}
                id="age"
                name="age"
                placeholder="Enter your age"
                min="1"
                max="120"
                value={formData.age}
                onChange={handleChange}
              />
              {errors.age && <div className="invalid-feedback">{errors.age}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <select
                className={`form-select ${errors.role ? "is-invalid" : ""}`}
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select your role</option>
                <option value="Learner">Learner</option>
                <option value="Guardian">Guardian</option>
                <option value="Educator">Educator</option>
              </select>
              {errors.role && <div className="invalid-feedback">{errors.role}</div>}
            </div>

            {isMinor && (
              <div className="form-group guardian-section">
                <div className="guardian-notice">
                  <p>Since you are under 18, we need your guardian's approval to create your account.</p>
                </div>
                <label htmlFor="guardianEmail">Guardian's Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.guardianEmail ? "is-invalid" : ""}`}
                  id="guardianEmail"
                  name="guardianEmail"
                  placeholder="Enter your guardian's email"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                />
                {errors.guardianEmail && <div className="invalid-feedback">{errors.guardianEmail}</div>}
                <small className="form-text text-muted">
                  We'll send a confirmation email to your guardian. Your account will be activated after they approve.
                </small>
              </div>
            )}

            <div className="form-check mb-3">
              <input type="checkbox" className="form-check-input" id="termsCheck" required />
              <label className="form-check-label" htmlFor="termsCheck">
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="btn primary w-100" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="text-center mt-3">
              <p>
                Already have an account? <a href="/login">Log in</a>
              </p>
            </div>
          </form>
        )}

        <div className="signup-benefits">
          <h5>Why join Perceptify?</h5>
          <ul>
            <li>Learn to identify deepfakes with interactive lessons</li>
            <li>Test your knowledge with quizzes and challenges</li>
            <li>Access our AI-powered deepfake detection tools</li>
            <li>Track your progress and earn certificates</li>
          </ul>

          <div className="role-info mt-4">
            <h5>User Roles</h5>
            <div className="role-item">
              <strong>Learner:</strong> Access all learning materials and track your progress
            </div>
            <div className="role-item">
              <strong>Guardian:</strong> Monitor and approve minor accounts
            </div>
            <div className="role-item">
              <strong>Educator:</strong> Access teaching resources and monitor student progress
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpForm
