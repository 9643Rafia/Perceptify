"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, Button, Form, Modal, Badge, InputGroup, Pagination, Row, Col, Card, Alert } from "react-bootstrap"
import { getAdminToken } from "../../services/admin.service"

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [actionUser, setActionUser] = useState(null)
  const [actionType, setActionType] = useState("")
  const [actionValue, setActionValue] = useState("")
  const [alert, setAlert] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    age: "",
    role: "",
    status: ""
  })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAdminToken()
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      })

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      showAlert("error", "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, roleFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = getAdminToken()
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(users.map(user =>
          user._id === userId ? { ...user, status: newStatus } : user
        ))
        showAlert("success", "User status updated successfully")
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      showAlert("error", "Failed to update user status")
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = getAdminToken()
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(users.map(user =>
          user._id === userId ? { ...user, role: newRole } : user
        ))
        showAlert("success", "User role updated successfully")
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      showAlert("error", "Failed to update user role")
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      const token = getAdminToken()
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId))
        showAlert("success", "User deleted successfully")
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      showAlert("error", "Failed to delete user")
    }
  }

  const handleEditUser = async () => {
    try {
      const token = getAdminToken()
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/users/${editingUser._id}/details`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers(users.map(user =>
          user._id === editingUser._id ? data.user : user
        ))
        setShowEditModal(false)
        setEditingUser(null)
        showAlert("success", "User details updated successfully")
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      showAlert("error", "Failed to update user details")
    }
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      age: user.age.toString(),
      role: user.role,
      status: user.status
    })
    setShowEditModal(true)
  }

  const confirmAction = (user, type, value = "") => {
    setActionUser(user)
    setActionType(type)
    setActionValue(value)
    setShowConfirmModal(true)
  }

  const executeAction = async () => {
    if (actionType === 'delete') {
      await handleDeleteUser(actionUser._id)
    } else if (actionType === 'status') {
      await handleStatusChange(actionUser._id, actionValue)
    } else if (actionType === 'role') {
      await handleRoleChange(actionUser._id, actionValue)
    }
    setShowConfirmModal(false)
    setActionUser(null)
    setActionType("")
    setActionValue("")
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      pending: 'warning',
      suspended: 'danger'
    }
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getRoleBadge = (role) => {
    const variants = {
      Learner: 'primary',
      Educator: 'info',
      Guardian: 'secondary',
      Admin: 'dark'
    }
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>
  }

  const getActionMessage = () => {
    if (actionType === 'delete') {
      return `Are you sure you want to delete user "${actionUser?.fullName}"? This action cannot be undone.`
    } else if (actionType === 'status') {
      return `Are you sure you want to change the status of "${actionUser?.fullName}" to "${actionValue}"?`
    } else if (actionType === 'role') {
      const isEducator = actionUser?.role === 'Educator'
      const warning = isEducator ? " Warning: This user is currently an Educator." : ""
      return `Are you sure you want to change the role of "${actionUser?.fullName}" to "${actionValue}"?${warning}`
    }
    return ""
  }

  return (
    <div className="user-management">
      {/* Header */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">User Management</h4>
              <p className="text-muted mb-0">Manage user accounts, roles, and permissions</p>
            </div>
            <Button variant="primary" onClick={loadUsers}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
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

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Label>Search Users</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label>Filter by Role</Form.Label>
              <Form.Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Learner">Learner</option>
                <option value="Educator">Educator</option>
                <option value="Guardian">Guardian</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Filter by Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Users ({pagination.total || 0})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people-fill text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2 text-muted">No users found</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th>Joined</th>
                  <th width="200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div>
                        <div className="fw-bold">{user.fullName}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>{user.age}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </Button>

                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline-warning"
                            onClick={() => confirmAction(user, 'status', 'suspended')}
                            title="Suspend User"
                          >
                            <i className="bi bi-pause-circle me-1"></i>
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => confirmAction(user, 'status', 'active')}
                            title="Activate User"
                          >
                            <i className="bi bi-play-circle me-1"></i>
                            Activate
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => confirmAction(user, 'delete')}
                          title="Delete User"
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {[...Array(pagination.pages)].map((_, index) => {
              const page = index + 1
              if (
                page === 1 ||
                page === pagination.pages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                )
              }
              return null
            })}

            <Pagination.Next
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(pagination.pages)}
              disabled={currentPage === pagination.pages}
            />
          </Pagination>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="120"
                    value={editForm.age}
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  >
                    <option value="Learner">Learner</option>
                    <option value="Educator">Educator</option>
                    <option value="Guardian">Guardian</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditUser}>
            <i className="bi bi-save me-2"></i>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className={`bi ${actionType === 'delete' ? 'bi-exclamation-triangle text-danger' : 'bi-question-circle text-warning'}`} style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">{getActionMessage()}</p>
            {actionType === 'delete' && (
              <Alert variant="danger" className="mt-3">
                <strong>Warning:</strong> This action cannot be undone.
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'delete' ? 'danger' : 'primary'}
            onClick={executeAction}
          >
            {actionType === 'delete' ? 'Delete' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default UserManagement