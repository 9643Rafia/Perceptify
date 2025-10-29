"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState(null)

  useEffect(() => {
    if (user && user.fullName) setUserName(user.fullName.split(" ")[0])
    setLoading(false)
  }, [user])

  if (loading) return <div className="dashboard-loading">Loading...</div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-greeting">Hello, {userName || "User"}</div>
      </header>

      <section className="dashboard-main">
        <div className="stats">
          <div className="stat">Certificates: 2</div>
          <div className="stat">Courses: 8</div>
          <div className="stat">Hours: 24</div>
        </div>

        <div className="recommended">
          <h2>Recommended Courses</h2>
          <ul>
            <li>Introduction to Deepfakes</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
