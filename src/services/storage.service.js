// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token")
}

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token)
}

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem("token")
}
