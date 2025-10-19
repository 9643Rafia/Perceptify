"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { getCurrentUser } from "../services/auth.service"
import { FiBook, FiAward, FiClock, FiArrowRight, FiCalendar, FiBarChart2, FiSettings, FiSearch } from "react-icons/fi"
import { motion } from 'framer-motion'; // ✅ correct for v12

const Dashboard = () => {
  const { user, token } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

useEffect(() => {
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUser();
      setUserData(response.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
};

  fetchUserData(); // ✅ always fetch
}, []); // ✅ run on mount


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  // Mock data for the dashboard
  const mockData = {
    certificates: 2,
    courses: 8,
    hours: 24,
    progress: 45,
    todayLearning: {
      percentage: 58,
      minutes: 28,
    },
    schedule: [
      { id: 1, title: "Deepfake Detection Basics", time: "10:00 - 11:00", category: "detection" },
      { id: 2, title: "Media Ethics Workshop", time: "13:00 - 14:30", category: "ethics" },
      { id: 3, title: "AI Technology Overview", time: "16:00 - 17:00", category: "technology" },
    ],
    weekdays: ["M", "T", "W", "T", "F"],
    dates: [14, 15, 16, 17, 18],
    activeDay: 0,
    quizQuestion: "What visual cues might indicate a video has been deepfaked?",
    recommendedCourses: [
      {
        id: 1,
        title: "Introduction to Deepfakes",
        description: "Learn the basics of deepfake technology and its implications.",
        progress: 0,
        category: "technology",
      },
      {
        id: 2,
        title: "Deepfake Detection Basics",
        description: "Develop skills to identify manipulated media.",
        progress: 15,
        category: "detection",
      },
      {
        id: 3,
        title: "Ethics of AI-Generated Content",
        description: "Explore the ethical implications of synthetic media.",
        progress: 0,
        category: "ethics",
      },
    ],
  }

  // Filter courses based on active tab
  const filteredCourses =
    activeTab === "all"
      ? mockData.recommendedCourses
      : mockData.recommendedCourses.filter((course) => course.category === activeTab)

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <div className="dashboard-nav">
        <div className="nav-left">
          <div className="nav-logo">
            <span className="logo-icon">P</span>
            <span className="logo-text">Perceptify</span>
          </div>
          <nav className="nav-links">
            <a href="#" className="active">
              <span className="nav-icon">
                <FiBarChart2 />
              </span>{" "}
              Dashboard
            </a>
            <a href="#">
              <span className="nav-icon">
                <FiBook />
              </span>{" "}
              Courses
            </a>
            <a href="#">
              <span className="nav-icon">
                <FiCalendar />
              </span>{" "}
              Calendar
            </a>
            <a href="#">
              <span className="nav-icon">
                <FiSettings />
              </span>{" "}
              Settings
            </a>
          </nav>
        </div>
        <div className="nav-right">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-profile">
            <span className="user-greeting">Hello, {userData?.fullName?.split(" ")[0] || "User"}</span>
            <div className="user-avatar">{userData?.fullName?.charAt(0) || "U"}</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <motion.div className="dashboard-content" variants={containerVariants} initial="hidden" animate="visible">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="tab-filters">
            <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
              All
            </button>
            <button className={activeTab === "detection" ? "active" : ""} onClick={() => setActiveTab("detection")}>
              Detection
            </button>
            <button className={activeTab === "technology" ? "active" : ""} onClick={() => setActiveTab("technology")}>
              Technology
            </button>
            <button className={activeTab === "ethics" ? "active" : ""} onClick={() => setActiveTab("ethics")}>
              Ethics
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Stats Cards */}
          <motion.div className="stats-container" variants={itemVariants}>
            <div className="stat-card certificates">
              <div className="stat-icon">
                <FiAward />
              </div>
              <div className="stat-content">
                <h2>{mockData.certificates}</h2>
                <p>Certificates</p>
              </div>
            </div>
            <div className="stat-card courses">
              <div className="stat-icon">
                <FiBook />
              </div>
              <div className="stat-content">
                <h2>{mockData.courses}</h2>
                <p>Courses</p>
              </div>
            </div>
            <div className="stat-card hours">
              <div className="stat-icon">
                <FiClock />
              </div>
              <div className="stat-content">
                <h2>{mockData.hours}</h2>
                <p>Hours</p>
              </div>
            </div>
          </motion.div>

          {/* Progress Card */}
          <motion.div className="progress-card" variants={itemVariants}>
            <h3>Overall Progress</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${mockData.progress}%` }}></div>
              </div>
              <div className="progress-percentage">{mockData.progress}%</div>
            </div>
            <div className="progress-illustration">
              <div className="illustration-container">
                <img
                  src="/placeholder.svg?height=150&width=150"
                  alt="Progress illustration"
                  className="progress-image"
                />
              </div>
            </div>
            <div className="progress-categories">
              <div className="category-badge detection">Detection</div>
              <div className="category-badge technology">Technology</div>
              <div className="category-badge ethics">Ethics</div>
            </div>
          </motion.div>

          {/* Today's Learning */}
          <motion.div className="today-learning-card" variants={itemVariants}>
            <div className="card-header">
              <h3>Learning Today</h3>
              <button className="icon-button">
                <FiArrowRight />
              </button>
            </div>
            <div className="learning-stats">
              <div className="learning-percentage">{mockData.todayLearning.percentage}%</div>
              <div className="learning-time">{mockData.todayLearning.minutes} min</div>
            </div>
            <div className="learning-progress">
              <div className="learning-progress-fill" style={{ width: `${mockData.todayLearning.percentage}%` }}></div>
            </div>
          </motion.div>

          {/* Calendar & Schedule */}
          <motion.div className="schedule-card" variants={itemVariants}>
            <div className="card-header">
              <h3>My Schedule</h3>
              <button className="icon-button">
                <FiCalendar />
              </button>
            </div>
            <div className="weekday-selector">
              {mockData.weekdays.map((day, index) => (
                <div key={index} className={`day-item ${mockData.activeDay === index ? "active" : ""}`}>
                  <div className="weekday">{day}</div>
                  <div className="date">{mockData.dates[index]}</div>
                </div>
              ))}
            </div>
            <div className="schedule-list">
              {mockData.schedule.map((item) => (
                <div key={item.id} className={`schedule-item ${item.category}`}>
                  <div className="schedule-time">{item.time}</div>
                  <div className="schedule-title">{item.title}</div>
                  <div className="schedule-indicator"></div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quiz Question */}
          <motion.div className="quiz-card" variants={itemVariants}>
            <h3>Practice Question</h3>
            <div className="quiz-question">{mockData.quizQuestion}</div>
            <div className="quiz-input">
              <input type="text" placeholder="Type your answer..." />
              <button className="submit-button">
                <FiArrowRight />
              </button>
            </div>
          </motion.div>

          {/* Recommended Courses */}
          <motion.div className="recommended-card" variants={itemVariants}>
            <h3>Recommended Courses</h3>
            <div className="course-list">
              {filteredCourses.map((course) => (
                <div key={course.id} className={`course-item ${course.category}`}>
                  <div className="course-content">
                    <h4>{course.title}</h4>
                    <p>{course.description}</p>
                    <div className="course-progress">
                      <div className="course-progress-bar">
                        <div className="course-progress-fill" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <span className="course-progress-text">
                        {course.progress > 0 ? `${course.progress}% complete` : "Not started"}
                      </span>
                    </div>
                  </div>
                  <button className="course-button">{course.progress > 0 ? "Continue" : "Start"}</button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
