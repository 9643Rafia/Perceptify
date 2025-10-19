import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
        <div className="container">
          {/* Logo */}
          <a className="navbar-brand" href="#home">
            <strong>Perceptify</strong>
          </a>

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
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
