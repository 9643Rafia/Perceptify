"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import AuthAPI from "../services/auth.api"

const GuardianApproval = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("processing")
  const [message, setMessage] = useState("Processing approval request...")
  const token = searchParams.get("token")

  useEffect(() => {
    const processApproval = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid approval link. No token provided.")
        return
      }

      try {
        await AuthAPI.approveAccount(token)
        setStatus("success")
        setMessage("Account approved successfully! The user can now log in.")
      } catch (error) {
        console.error("Approval error:", error)
        setStatus("error")
        setMessage(error.response?.data?.message || "Failed to approve account. The link may be invalid or expired.")
      }
    }

    processApproval()
  }, [token])

  return (
    <div className="approval-container">
      <div className="approval-card">
        <div className="approval-header">
          <h2>Guardian Approval</h2>
        </div>
        <div className="approval-content">
          {status === "processing" && (
            <div className="processing">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="success">
              <div className="success-icon">✓</div>
              <h3>Approval Successful</h3>
              <p>{message}</p>
              <button onClick={() => navigate("/")} className="btn primary mt-3">
                Return to Home
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="error">
              <div className="error-icon">✗</div>
              <h3>Approval Failed</h3>
              <p>{message}</p>
              <button onClick={() => navigate("/")} className="btn primary mt-3">
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuardianApproval
