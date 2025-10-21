"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Nav, Tab, Button, Badge } from "react-bootstrap"
import { adminLogout, isAdmin, getAdminToken } from "../services/admin.service"
import UserManagement from "../components/admin/UserManagement"
import ContentManagement from "../components/admin/ContentManagement"
import "../assets/styles/admin.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin()) {
      navigate("/login")
      return
    }

    // Load dashboard stats
    loadDashboardStats()
  }, [navigate])

  const loadDashboardStats = async () => {
    try {
      const token = getAdminToken()
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    adminLogout()
    navigate("/login")
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="admin-dashboard">
      <Row>
        {/* Sidebar */}
        <Col md={3} lg={2} className="admin-sidebar bg-dark text-white p-0">
          <div className="sidebar-header p-3 border-bottom border-secondary">
            <h5 className="mb-0">
              <i className="bi bi-shield-check me-2"></i>
              Admin Panel
            </h5>
          </div>

          <Nav variant="pills" className="flex-column p-3">
            <Nav.Item>
              <Nav.Link
                eventKey="overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                className="text-white mb-2"
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Overview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="users"
                active={activeTab === "users"}
                onClick={() => setActiveTab("users")}
                className="text-white mb-2"
              >
                <i className="bi bi-people me-2"></i>
                Manage Users
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="content"
                active={activeTab === "content"}
                onClick={() => setActiveTab("content")}
                className="text-white mb-2"
              >
                <i className="bi bi-file-text me-2"></i>
                Manage Content
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="sidebar-footer p-3 border-top border-secondary mt-auto">
            <Button variant="outline-light" size="sm" onClick={handleLogout} className="w-100">
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Button>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10} className="admin-content p-4">
          <Card className="admin-header-card mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="mb-1">
                    <i className="bi bi-speedometer2 me-2 text-primary"></i>
                    Admin Dashboard
                  </h2>
                  <p className="text-muted mb-0">Manage users, content, and monitor system activity</p>
                </div>
                <div className="text-end">
                  <Badge bg="success" className="px-3 py-2">
                    <i className="bi bi-shield-check me-1"></i>
                    Admin Access
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Tab.Content>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="overview-content">
                {/* Statistics Cards */}
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                      <Card.Body className="text-center p-4">
                        <div className="stat-icon-wrapper mb-3">
                          <div className="stat-icon bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                            <i className="bi bi-people text-primary" style={{ fontSize: "1.5rem" }}></i>
                          </div>
                        </div>
                        <h3 className="fw-bold mb-1 text-primary">{stats?.totalUsers || 0}</h3>
                        <p className="text-muted mb-0 small">Total Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                      <Card.Body className="text-center p-4">
                        <div className="stat-icon-wrapper mb-3">
                          <div className="stat-icon bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                            <i className="bi bi-check-circle text-success" style={{ fontSize: "1.5rem" }}></i>
                          </div>
                        </div>
                        <h3 className="fw-bold mb-1 text-success">{stats?.activeUsers || 0}</h3>
                        <p className="text-muted mb-0 small">Active Users</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                      <Card.Body className="text-center p-4">
                        <div className="stat-icon-wrapper mb-3">
                          <div className="stat-icon bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                            <i className="bi bi-clock text-warning" style={{ fontSize: "1.5rem" }}></i>
                          </div>
                        </div>
                        <h3 className="fw-bold mb-1 text-warning">{stats?.pendingUsers || 0}</h3>
                        <p className="text-muted mb-0 small">Pending Approval</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="stat-card border-0 shadow-sm h-100">
                      <Card.Body className="text-center p-4">
                        <div className="stat-icon-wrapper mb-3">
                          <div className="stat-icon bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px" }}>
                            <i className="bi bi-x-circle text-danger" style={{ fontSize: "1.5rem" }}></i>
                          </div>
                        </div>
                        <h3 className="fw-bold mb-1 text-danger">{stats?.suspendedUsers || 0}</h3>
                        <p className="text-muted mb-0 small">Suspended</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Detailed Information Cards */}
                <Row>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Header className="bg-white border-0 pb-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-pie-chart text-primary me-2"></i>
                          Users by Role
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        {stats?.usersByRole?.length > 0 ? stats.usersByRole.map((role) => (
                          <div key={role._id} className="d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-light">
                            <div className="d-flex align-items-center">
                              <div className="role-icon me-2">
                                <i className={`bi ${role._id === 'Learner' ? 'bi-person' : role._id === 'Educator' ? 'bi-mortarboard' : 'bi-shield'} text-primary`}></i>
                              </div>
                              <span className="fw-medium">{role._id}</span>
                            </div>
                            <Badge bg="primary" className="px-2 py-1">{role.count}</Badge>
                          </div>
                        )) : (
                          <div className="text-center text-muted py-3">
                            <i className="bi bi-info-circle"></i> No data available
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Header className="bg-white border-0 pb-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-clock-history text-success me-2"></i>
                          Recent Users
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        {stats?.recentUsers?.length > 0 ? stats.recentUsers.map((user) => (
                          <div key={user._id} className="d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-light">
                            <div>
                              <div className="fw-bold text-dark">{user.fullName}</div>
                              <small className="text-muted">{user.email}</small>
                            </div>
                            <div className="text-end">
                              <Badge bg={user.status === "active" ? "success" : user.status === "pending" ? "warning" : "danger"} className="mb-1">
                                {user.status}
                              </Badge>
                              <div>
                                <small className="text-muted">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </small>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-muted py-3">
                            <i className="bi bi-info-circle"></i> No recent users
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Quick Actions */}
                <Row className="mt-4">
                  <Col>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white border-0 pb-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-lightning text-warning me-2"></i>
                          Quick Actions
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={3}>
                            <Button
                              variant="outline-primary"
                              className="w-100 p-3 h-100 d-flex flex-column align-items-center"
                              onClick={() => setActiveTab("users")}
                            >
                              <i className="bi bi-people mb-2" style={{ fontSize: "1.5rem" }}></i>
                              <span>Manage Users</span>
                            </Button>
                          </Col>
                          <Col md={3}>
                            <Button
                              variant="outline-success"
                              className="w-100 p-3 h-100 d-flex flex-column align-items-center"
                              onClick={() => setActiveTab("content")}
                            >
                              <i className="bi bi-file-text mb-2" style={{ fontSize: "1.5rem" }}></i>
                              <span>Manage Content</span>
                            </Button>
                          </Col>
                          <Col md={3}>
                            <Button
                              variant="outline-info"
                              className="w-100 p-3 h-100 d-flex flex-column align-items-center"
                              onClick={loadDashboardStats}
                            >
                              <i className="bi bi-arrow-clockwise mb-2" style={{ fontSize: "1.5rem" }}></i>
                              <span>Refresh Data</span>
                            </Button>
                          </Col>
                          <Col md={3}>
                            <Button
                              variant="outline-warning"
                              className="w-100 p-3 h-100 d-flex flex-column align-items-center"
                              onClick={() => window.location.reload()}
                            >
                              <i className="bi bi-gear mb-2" style={{ fontSize: "1.5rem" }}></i>
                              <span>System Settings</span>
                            </Button>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* Users Management Tab */}
            {activeTab === "users" && (
              <div className="users-content">
                <UserManagement />
              </div>
            )}

            {/* Content Management Tab */}
            {activeTab === "content" && (
              <div className="content-content">
                <ContentManagement />
              </div>
            )}
          </Tab.Content>
        </Col>
      </Row>

    </Container>
  )
}

export default AdminDashboard