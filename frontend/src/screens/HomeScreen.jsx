import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import main from '../assets/main.jpg';

const HomeScreen = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to learning dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/learning-dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Add animation classes to elements as they scroll into view
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="home-screen">
      {/* Background Elements */}
      <div className="home-bg-elements">
        <div className="home-bg-circle circle-1"></div>
        <div className="home-bg-circle circle-2"></div>
        <div className="home-bg-circle circle-3"></div>
        <div className="home-bg-grid"></div>
      </div>

      {/* Hero Section */}
      <section id="home" className="home-hero-section">
        <div className="container">
          <div className="home-hero-content animate fade-in">
            <h1>Perceptify: Empowering You to Detect and Understand Deepfakes</h1>
            <p className="home-hero-subtitle">
              Learn how to identify deepfakes, understand their ethical implications, and become media literate in the digital age.
            </p>
            <div className="home-hero-buttons">
              <Link
                to="/initialassessment-quiz"
                className="home-btn home-btn-primary"
              >
                Get Started
              </Link>
              <Link to="/features" className="home-btn home-btn-secondary">
                Explore Features
              </Link>
            </div>
          </div>
          <div className="home-hero-image animate slide-up">
            <div className="home-hero-image-container">
               <img src={main} width="20" height="20" alt="Main icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-features-section">
        <div className="container">
          <div className="home-section-header animate fade-in">
            <h2>What You'll Learn</h2>
            <p>Comprehensive education on deepfake technology and detection</p>
          </div>
          <div className="home-features-grid">
            <div className="home-feature-card animate slide-up">
              <div className="home-feature-icon awareness-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <h3>Deepfake Awareness</h3>
              <p>Understand how deepfakes are created and the risks they pose to individuals and society.</p>
            </div>
            <div className="home-feature-card animate slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="home-feature-icon interactive-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <h3>Interactive Learning</h3>
              <p>Engage with rich content, take part in quizzes, and test your ability to identify manipulated media.</p>
            </div>
            <div className="home-feature-card animate slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="home-feature-icon detection-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <h3>Detection Tools</h3>
              <p>Use our AI-powered demo to detect deepfakes and compare your analysis with automated results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="home-demo-section">
        <div className="container">
          <div className="home-demo-content animate fade-in">
            <h2>Try Our Deepfake Detection Demo</h2>
            <p>
              Upload a video or image and let our system help you identify whether it's authentic or manipulated.
            </p>
            <Link to="/demo" className="home-btn home-btn-glow">
              Launch Demo
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 3 14 9-14 9V3z"></path>
              </svg>
            </Link>
          </div>
          <div className="home-demo-image animate slide-up">
            <div className="home-demo-image-container">
              <img src="/placeholder.svg?height=300&width=500" alt="Deepfake detection demo" />
              <div className="home-demo-badge">AI-Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="home-faq-section">
        <div className="container">
          <div className="home-section-header animate fade-in">
            <h2>Frequently Asked Questions</h2>
            <p>Get answers to common questions about Perceptify</p>
          </div>
          <div className="home-faq-container animate fade-in">
            <div className="home-faq-item">
              <div className="home-faq-question">
                <h3>What is Perceptify?</h3>
                <span className="home-faq-icon">+</span>
              </div>
              <div className="home-faq-answer">
                <p>Perceptify is a learning platform that educates users about deepfakes and equips them with tools to detect them.</p>
              </div>
            </div>
            <div className="home-faq-item">
              <div className="home-faq-question">
                <h3>Do I need to sign up to use the detection tool?</h3>
                <span className="home-faq-icon">+</span>
              </div>
              <div className="home-faq-answer">
                <p>You can try a demo without signing up, but full features and tracking your learning progress require an account.</p>
              </div>
            </div>
            <div className="home-faq-item">
              <div className="home-faq-question">
                <h3>Is the platform free?</h3>
                <span className="home-faq-icon">+</span>
              </div>
              <div className="home-faq-answer">
                <p>Yes, Perceptify is free to use for students, educators, and the public.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="home-contact-section">
        <div className="container">
          <div className="home-contact-content animate fade-in">
            <h2>Get in Touch</h2>
            <p>Have questions, feedback, or suggestions? Reach out to us!</p>
            <a href="mailto:support@perceptify.com" className="home-btn home-btn-outline">
              Contact Us
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="newsletter" className="home-newsletter-section">
        <div className="container">
          <div className="home-newsletter-content animate fade-in">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter to get the latest updates on deepfake awareness and platform features.</p>
            <form className="home-newsletter-form">
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" className="home-btn home-btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

// Add event listeners for FAQ accordion functionality
document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.home-faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.home-faq-question');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all FAQ items
      faqItems.forEach(faqItem => {
        faqItem.classList.remove('active');
      });
      
      // If the clicked item wasn't active, make it active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
});

export default HomeScreen;
