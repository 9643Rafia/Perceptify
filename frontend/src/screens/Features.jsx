
import { useEffect } from "react"
import { Link } from 'react-router-dom';
import AOS from "aos"
import "aos/dist/aos.css"

// Import images (you'll need to add these to your project)
import detectionMockup from "../assets/detection.jpg"
import learningModuleImg from "../assets/e-learning.jpg"
import quizImg from "../assets/quiz.jpg"
import progressImg from "../assets/track.jpg"

const Features = () => {
  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
    })
  }, [])

  return (
    <div className="features-page">
      {/* Hero Section */}
      <section className="hero-features">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center" data-aos="fade-up">
              <h1 className="display-4 fw-bold text-white mb-4">What Makes Perceptify Powerful?</h1>
              <p className="lead text-white-50 mb-5">
                Explore our smart tools designed to educate, protect, and empower digital citizens.
              </p>
              <div className="hero-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="core-features py-5">
        <div className="container">
          <div className="section-title text-center mb-5" data-aos="fade-up">
            <h2>Core Features</h2>
            <p className="text-muted">Discover the tools that make Perceptify unique</p>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="feature-card">
                <div className="icon-wrapper brain">
                  <i className="feature-icon">🧠</i>
                </div>
                <h3>Deepfake Detection Demo</h3>
                <p>Interactively test your ability to spot deepfakes using real vs. fake media.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="feature-card">
                <div className="icon-wrapper book">
                  <i className="feature-icon">📚</i>
                </div>
                <h3>Learning Modules</h3>
                <p>Bite-sized, engaging lessons on deepfakes, ethics, and media literacy.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="feature-card">
                <div className="icon-wrapper test">
                  <i className="feature-icon">🧪</i>
                </div>
                <h3>Quizzes & Challenges</h3>
                <p>Test your skills with adaptive quizzes and receive instant feedback.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="feature-card">
                <div className="icon-wrapper chart">
                  <i className="feature-icon">📈</i>
                </div>
                <h3>Progress Tracking</h3>
                <p>See how far you've come in understanding digital media manipulation.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="feature-card">
                <div className="icon-wrapper lock">
                  <i className="feature-icon">🔒</i>
                </div>
                <h3>Guardian Mode</h3>
                <p>Parental controls and oversight for minors to ensure safe learning.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="feature-card">
                <div className="icon-wrapper community">
                  <i className="feature-icon">🧑‍🤝‍🧑</i>
                </div>
                <h3>Community Forum</h3>
                <p>Connect with others to discuss trends, share insights, and ask questions.</p>
                <div className="card-hover-effect"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="feature-highlight py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0" data-aos="fade-right">
              <div className="mockup-container">
                <img
                  src={detectionMockup || "/placeholder.svg"}
                  alt="Deepfake Detection Tool"
                  className="img-fluid mockup-image"
                />
                <div className="mockup-overlay">
                  <div className="pulse-effect"></div>
                </div>
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <div className="highlight-content">
                <h2>Deepfake Detection Tool</h2>
                <p className="lead">
                  Our state-of-the-art detection tool helps you identify manipulated media with confidence.
                </p>
                <ul className="feature-list">
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Compare real and synthetic media side by side</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Learn key indicators of manipulated content</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Test your detection skills with our challenge mode</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    <span>Get detailed explanations for each example</span>
                  </li>
                </ul>
                <button className="btn primary mt-4">Try Demo</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works py-5">
        <div className="container">
          <div className="section-title text-center mb-5" data-aos="fade-up">
            <h2>How It Works</h2>
            <p className="text-muted">Three simple steps to become media-literate</p>
          </div>

          <div className="row">
            <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Enroll & Explore</h3>
                <p>Start learning with interactive content designed to build your knowledge from the ground up.</p>
                <div className="step-icon">
                  <img src={learningModuleImg || "/placeholder.svg"} alt="Enroll & Explore" className="img-fluid" />
                </div>
              </div>
            </div>

            <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Engage & Detect</h3>
                <p>Practice with real and synthetic media to sharpen your detection skills.</p>
                <div className="step-icon">
                  <img src={quizImg || "/placeholder.svg"} alt="Engage & Detect" className="img-fluid" />
                </div>
              </div>
            </div>

            <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Track & Improve</h3>
                <p>Monitor your progress, earn badges, and become an expert in media literacy.</p>
                <div className="step-icon">
                  <img src={progressImg || "/placeholder.svg"} alt="Track & Improve" className="img-fluid" />
                </div>
              </div>
            </div>
          </div>

          <div className="progress-line">
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section py-5">
        <div className="container">
          <div className="cta-content text-center" data-aos="zoom-in">
            <h2>Ready to become a media-smart citizen?</h2>
            <p className="lead mb-4">
              Join thousands of users who are already building their deepfake detection skills.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">Start Learning</Link>
            <div className="floating-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
              <div className="particle particle-5"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Features
