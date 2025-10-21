"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { adminLogin } from "../services/admin.service"

const LoginForm = () => {
  const navigate = useNavigate()
  const { login, error: authError, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Check if this is an admin login attempt (specific admin email)
      const isAdminLogin = formData.email === 'admin@gmail.com'

      if (isAdminLogin) {
        // Try admin login
        try {
          await adminLogin(formData.email, formData.password)
          navigate("/admin/dashboard")
          return
        } catch (adminError) {
          // If admin login fails, continue with regular user login
          console.log("Admin login failed, trying user login:", adminError.message)
        }
      }

      // Regular user login
      const data = await login(formData.email, formData.password)
      // Redirect based on user role
      if (data.user.role === 'Learner') {
        navigate("/learning-dashboard")
      } else if (data.user.role === 'Educator') {
        navigate("/dashboard") // Educator dashboard
      } else {
        navigate("/dashboard") // Default dashboard
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {authError && (
            <div className="alert alert-danger" role="alert">
              {authError}
            </div>
          )}

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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="form-check mb-3">
            <input type="checkbox" className="form-check-input" id="rememberCheck" />
            <label className="form-check-label" htmlFor="rememberCheck">
              Remember me
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn primary w-100" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center mt-3">
            <p>
              Don't have an account? <a href="/signup">Sign up</a>
            </p>
          </div>
        </form>

        <div className="login-info">
          <h5>Perceptify Learning Platform</h5>
          <p>
            Our platform helps you understand and identify deepfakes through interactive lessons, quizzes, and
            AI-powered tools.
          </p>
          <div className="login-features">
            <div className="feature-item">
              <i className="bi bi-shield-check"></i>
              <span>Secure authentication</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-person-badge"></i>
              <span>Personalized learning</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-graph-up"></i>
              <span>Track your progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm