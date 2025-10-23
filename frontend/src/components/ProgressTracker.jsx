import React from 'react';
import { Card, ProgressBar, Badge } from 'react-bootstrap';
import { FaStar, FaFire, FaTrophy } from 'react-icons/fa';

const ProgressTracker = ({ progress, stats }) => {
  const calculateXPProgress = () => {
    if (!stats || !stats.totalXP) return 0;
    const currentLevelXP = stats.totalXP % 1000;
    return (currentLevelXP / 1000) * 100;
  };

  const getXPToNextLevel = () => {
    if (!stats || !stats.totalXP) return 1000;
    const currentLevelXP = stats.totalXP % 1000;
    return 1000 - currentLevelXP;
  };

  return (
    <div className="lms-progress-tracker">
      {/* XP and Level Display */}
      <div className="lms-xp-box mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h4 className="mb-0">Level {stats?.level || 1}</h4>
            <small className="opacity-75">{getXPToNextLevel()} XP to next level</small>
          </div>
          <FaStar size={32} />
        </div>
        <div className="lms-xp-bar-container">
          <div
            className="lms-xp-bar-fill"
            style={{ width: `${calculateXPProgress()}%` }}
          >
            {Math.round(calculateXPProgress())}%
          </div>
        </div>
        <div className="text-center mt-2">
          <strong>{stats?.totalXP || 0}</strong> Total XP
        </div>
      </div>

      {/* Stats Grid */}
      <Card className="mb-3">
        <Card.Body>
          <h6 className="mb-3">Learning Statistics</h6>

          <div className="lms-progress-item">
            <div className="lms-progress-label">
              <span>Tracks Completed</span>
              <strong>{stats?.tracksCompleted || 0}</strong>
            </div>
            <ProgressBar
              now={(stats?.tracksCompleted || 0) * 33.33}
              variant="success"
            />
          </div>

          <div className="lms-progress-item">
            <div className="lms-progress-label">
              <span>Modules Completed</span>
              <strong>{stats?.modulesCompleted || 0}</strong>
            </div>
            <ProgressBar
              now={Math.min((stats?.modulesCompleted || 0) * 10, 100)}
              variant="primary"
            />
          </div>

          <div className="lms-progress-item">
            <div className="lms-progress-label">
              <span>Lessons Completed</span>
              <strong>{stats?.lessonsCompleted || 0}</strong>
            </div>
            <ProgressBar
              now={Math.min((stats?.lessonsCompleted || 0) * 3.33, 100)}
              variant="info"
            />
          </div>

          <div className="lms-progress-item">
            <div className="lms-progress-label">
              <span>Time Spent</span>
              <strong>{formatTime(stats?.totalTimeSpent || 0)}</strong>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Streak and Badges */}
      <Card>
        <Card.Body>
          <h6 className="mb-3">Achievements</h6>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <FaFire className="text-danger me-2" size={24} />
              <div>
                <strong className="d-block">Current Streak</strong>
                <small className="text-muted">{stats?.currentStreak || 0} days</small>
              </div>
            </div>
            <Badge bg="danger" className="fs-6">
              {stats?.currentStreak || 0}
            </Badge>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <FaTrophy className="text-warning me-2" size={24} />
              <div>
                <strong className="d-block">Longest Streak</strong>
                <small className="text-muted">Best performance</small>
              </div>
            </div>
            <Badge bg="warning" className="fs-6">
              {stats?.longestStreak || 0}
            </Badge>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaStar className="text-primary me-2" size={24} />
              <div>
                <strong className="d-block">Badges Earned</strong>
                <small className="text-muted">Achievements unlocked</small>
              </div>
            </div>
            <Badge bg="primary" className="fs-6">
              {stats?.badgesEarned || 0}
            </Badge>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default ProgressTracker;
