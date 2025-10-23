import React from 'react';

const Footer = () => {
  return (
    <footer className="text-light py-4 mt-auto">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        {/* Left Side: Copyright */}
        <p className="mb-2 mb-md-0">&copy; {new Date().getFullYear()} Perceptify. All rights reserved.</p>

        {/* Right Side: Footer Links */}
        <div>
          <a href="#privacy" className="text-light me-3 text-decoration-none">Privacy</a>
          <a href="#terms" className="text-light me-3 text-decoration-none">Terms</a>
          <a href="#contact" className="text-light text-decoration-none">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
