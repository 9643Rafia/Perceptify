"use client"

import { useState, useEffect } from "react"
import { Card, Button, Form, Modal, Alert, Table, Badge, Row, Col, Tabs, Tab, InputGroup } from "react-bootstrap"

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState("modules")
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [alert, setAlert] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [formData, setFormData] = useState({
    title: "",
    type: "module",
    description: "",
    content: "",
    difficulty: "beginner",
    isPublished: true,
    category: "",
    duration: "",
    prerequisites: "",
    learningObjectives: []
  })

  // Mock content data - in real app this would come from API
  useEffect(() => {
    let mounted = true
    setLoading(true)
    // Simulate API call
    const t = setTimeout(() => {
      if (!mounted) return
      const mockData = {
        modules: [
          {
            _id: "1",
            title: "Introduction to Deepfakes",
            type: "module",
            description: "Learn the fundamentals of deepfake technology and detection",
            difficulty: "beginner",
            category: "Fundamentals",
            duration: "45 minutes",
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: "2",
            title: "Advanced Detection Techniques",
            type: "module",
            description: "Deep dive into sophisticated deepfake detection methods",
            difficulty: "advanced",
            category: "Detection",
            duration: "90 minutes",
            isPublished: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        quizzes: [
          {
            _id: "3",
            title: "Deepfake Basics Quiz",
            type: "quiz",
            description: "Test your understanding of deepfake fundamentals",
            difficulty: "beginner",
            category: "Assessment",
            duration: "15 minutes",
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        forums: [
          {
            _id: "4",
            title: "General Discussion",
            type: "forum",
            description: "General discussion about deepfake technology",
            category: "Community",
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
      setContent(mockData[activeTab] || [])
      setLoading(false)
    }, 500)

    return () => { mounted = false; clearTimeout(t); }
  }, [activeTab])

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleEdit = (item) => {
    setEditingContent(item)
    setFormData({
      title: item.title,
      type: item.type,
      description: item.description,
      content: item.content || "",
      difficulty: item.difficulty || "beginner",
      isPublished: item.isPublished,
      category: item.category || "",
      duration: item.duration || "",
      prerequisites: item.prerequisites || "",
      learningObjectives: item.learningObjectives || []
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingContent(null)
    setFormData({
      title: "",
      type: activeTab.slice(0, -1), // Remove 's' from activeTab (modules -> module)
      description: "",
      content: "",
      difficulty: "beginner",
      isPublished: true,
      category: "",
      duration: "",
      prerequisites: "",
      learningObjectives: []
    })
    setShowModal(true)
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      showAlert("danger", "Title is required")
      return false
    }
    if (!formData.description.trim()) {
      showAlert("danger", "Description is required")
      return false
    }
    if (formData.type === "module" && !formData.content.trim()) {
      showAlert("danger", "Content is required for modules")
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (editingContent) {
      // Update existing content
      setContent(content.map(item =>
        item._id === editingContent._id
          ? { ...item, ...formData, updatedAt: new Date().toISOString() }
          : item
      ))
      showAlert("success", "Content updated successfully")
    } else {
      // Add new content
      const newContent = {
        _id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setContent([newContent, ...content])
      showAlert("success", "Content created successfully")
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      setContent(content.filter(item => item._id !== id))
      showAlert("success", "Content deleted successfully")
    }
  }

  const togglePublished = (id) => {
    const item = content.find(c => c._id === id)
    const action = item.isPublished ? "unpublish" : "publish"

    if (window.confirm(`Are you sure you want to ${action} this content?`)) {
      setContent(content.map(item =>
        item._id === id
          ? { ...item, isPublished: !item.isPublished, updatedAt: new Date().toISOString() }
          : item
      ))
      showAlert("success", `Content ${action}ed successfully`)
    }
  }

  const getTypeBadge = (type) => {
    const variants = {
      module: 'primary',
      quiz: 'success',
      forum: 'info',
      assessment: 'warning'
    }
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>
  }

  const getDifficultyBadge = (difficulty) => {
    const variants = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    }
    return <Badge bg={variants[difficulty] || 'secondary'}>{difficulty}</Badge>
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" ||
                         (statusFilter === "Published" && item.isPublished) ||
                         (statusFilter === "Draft" && !item.isPublished)
    return matchesSearch && matchesStatus
  })

  const getStats = () => {
    return {
      total: content.length,
      published: content.filter(item => item.isPublished).length,
      draft: content.filter(item => !item.isPublished).length,
      beginner: content.filter(item => item.difficulty === 'beginner').length
    }
  }

  const stats = getStats()

  return (
    <div className="content-management">
      {/* Header */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Content Management</h4>
              <p className="text-muted mb-0">Add, edit, or remove learning modules, quizzes, and forum content</p>
            </div>
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Content
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Alert */}
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Content Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <i className="bi bi-files text-primary" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">{stats.total}</h5>
              <p className="text-muted mb-0">Total Content</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">{stats.published}</h5>
              <p className="text-muted mb-0">Published</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <i className="bi bi-file-earmark text-warning" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">{stats.draft}</h5>
              <p className="text-muted mb-0">Drafts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <i className="bi bi-star text-info" style={{ fontSize: '2rem' }}></i>
              <h5 className="mt-2">{stats.beginner}</h5>
              <p className="text-muted mb-0">Beginner Level</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Content Tabs */}
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            <Tab eventKey="modules" title={<><i className="bi bi-book me-2"></i>Modules</>}>
            </Tab>
            <Tab eventKey="quizzes" title={<><i className="bi bi-question-circle me-2"></i>Quizzes</>}>
            </Tab>
            <Tab eventKey="forums" title={<><i className="bi bi-chat-dots me-2"></i>Forums</>}>
            </Tab>
          </Tabs>

          {/* Search and Filter */}
          <Row className="mb-4">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Content Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading content...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2 text-muted">No content found</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Content Details</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th width="180">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div>
                        <div className="fw-bold">{item.title}</div>
                        <small className="text-muted">{item.description}</small>
                        {item.duration && (
                          <div>
                            <Badge bg="light" text="dark" className="mt-1">
                              <i className="bi bi-clock me-1"></i>{item.duration}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getTypeBadge(item.type)}</td>
                    <td>{item.difficulty ? getDifficultyBadge(item.difficulty) : '-'}</td>
                    <td>
                      <Badge bg={item.isPublished ? 'success' : 'secondary'}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={item.isPublished ? "outline-warning" : "outline-success"}
                          onClick={() => togglePublished(item._id)}
                          title={item.isPublished ? "Unpublish" : "Publish"}
                        >
                          <i className={`bi bi-${item.isPublished ? 'eye-slash' : 'eye'} me-1`}></i>
                          {item.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(item._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash me-1"></i>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContent ? 'Edit Content' : `Add New ${formData.type}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter content title"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="module">Module</option>
                    <option value="quiz">Quiz</option>
                    <option value="forum">Forum</option>
                    <option value="assessment">Assessment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the content"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Fundamentals, Detection"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="e.g., 45 minutes"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
                  <Form.Select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.type === 'module' && (
              <Form.Group className="mb-3">
                <Form.Label>Content *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter the main content (markdown supported)"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Prerequisites</Form.Label>
              <Form.Control
                type="text"
                value={formData.prerequisites}
                onChange={(e) => setFormData({...formData, prerequisites: e.target.value})}
                placeholder="Any prerequisites for this content"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="published-switch"
                label="Publish immediately"
                checked={formData.isPublished}
                onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
              />
              <Form.Text className="text-muted">
                Unpublished content will be saved as draft and won't be visible to users
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <i className="bi bi-save me-2"></i>
            {editingContent ? 'Update Content' : 'Create Content'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ContentManagement