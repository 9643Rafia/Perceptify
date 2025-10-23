
// Admin login
export const adminLogin = async (email, password) => {
  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Admin login failed')
  }

  // Store admin token
  localStorage.setItem('adminToken', data.token)
  localStorage.setItem('adminData', JSON.stringify(data.admin))

  return data
}

// Get current admin
export const getCurrentAdmin = async () => {
  const token = localStorage.getItem('adminToken')

  if (!token) {
    throw new Error('No admin token found')
  }

  const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get admin data')
  }

  return data
}

// Admin logout
export const adminLogout = () => {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminData')
}

// Get admin token
export const getAdminToken = () => {
  return localStorage.getItem('adminToken')
}

// Check if user is admin
export const isAdmin = () => {
  const adminToken = getAdminToken()
  const adminData = localStorage.getItem('adminData')
  return !!(adminToken && adminData)
}