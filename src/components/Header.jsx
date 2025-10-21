import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
        <div className="container">
          {/* Logo */}
          <Link className="navbar-brand" to={isAuthenticated ? "/learning-dashboard" : "/"}>
            <strong>Perceptify</strong>
          </Link>

          {/* Toggler for mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            {isAuthenticated ? (
              /* Authenticated User Navigation */
              <>
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link to="/learning-dashboard" className="nav-link">
                      My Learning
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/forum" className="nav-link">
                      Community Forum
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/demo" className="nav-link">
                      Demo
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/contact" className="nav-link">
                      Support
                    </Link>
                  </li>
                </ul>

                {/* User Menu */}
                <div className="d-flex ms-3 align-items-center">
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="link"
                      className="nav-link text-white text-decoration-none border-0 p-0"
                      id="userDropdown"
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      {user?.fullName || user?.email}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/learning-dashboard">
                        <i className="bi bi-speedometer2 me-2"></i>Dashboard
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/learning-dashboard">
                        <i className="bi bi-graph-up me-2"></i>My Progress
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </>
            ) : (
              /* Guest Navigation */
              <>
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link to="/" className="nav-link">Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/features" className="nav-link">Features</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/demo" className="nav-link">Demo</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/educators" className="nav-link">For Educators</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/contact" className="nav-link">Contact</Link>
                  </li>
                </ul>

                {/* Auth buttons */}
                <div className="d-flex ms-3">
                  <Link to="/login" className="btn me-2">Login</Link>
                  <Link to="/signup" className="btn btn-primary">SignUp</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;