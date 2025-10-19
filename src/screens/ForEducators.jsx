"use client"
import { useEffect } from "react"
import educatorImg from '../assets/educator.jpg';
import {
  FiCheck,
  FiX,
  FiArrowRight,
  FiBookOpen,
  FiBarChart2,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiPhone,
  FiMail,
  FiFileText,
} from "react-icons/fi"
import AOS from "aos"
import "aos/dist/aos.css"

const ForEducators = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: false,
    })
  }, [])

  // Pricing table data
  const pricingData = {
    tiers: [
      {
        name: "Starter",
        subtitle: "Basic",
        price: "$11",
        period: "per month",
        features: [
          { name: "Access to Standard Modules", included: true },
          { name: "Quiz & Assessment Customization", included: false },
          { name: "Progress Analytics Dashboard", included: false },
          { name: "Admin/Instructor Controls", included: false },
          { name: "API/Integration Access", included: false },
          { name: "Priority Support", included: false },
        ],
        cta: "Get Started",
        popular: false,
      },
      {
        name: "Educator Plus",
        subtitle: "Most Popular",
        price: "$29",
        period: "per month",
        features: [
          { name: "Access to Standard Modules", included: true },
          { name: "Quiz & Assessment Customization", included: true },
          { name: "Progress Analytics Dashboard", included: true },
          { name: "Admin/Instructor Controls", included: false },
          { name: "API/Integration Access", included: false },
          { name: "Priority Support", included: true },
        ],
        cta: "Choose Plus",
        popular: true,
      },
      {
        name: "Institution Pro",
        subtitle: "Enterprise",
        price: "Custom",
        period: "pricing",
        features: [
          { name: "Access to Standard Modules", included: true },
          { name: "Quiz & Assessment Customization", included: true },
          { name: "Progress Analytics Dashboard", included: true },
          { name: "Admin/Instructor Controls", included: true },
          { name: "API/Integration Access", included: true },
          { name: "Priority Support", included: true },
        ],
        cta: "Contact Us",
        popular: false,
      },
    ],
  }

  // Timeline data
  const timelineSteps = [
    {
      icon: <FiFileText />,
      title: "Fill customization form",
      description: "Tell us about your institution's specific needs and requirements.",
    },
    {
      icon: <FiCalendar />,
      title: "Schedule onboarding call",
      description: "Meet with our team to discuss implementation details and timeline.",
    },
    {
      icon: <FiSettings />,
      title: "Access admin dashboard",
      description: "Get your personalized admin controls and start setting up your courses.",
    },
    {
      icon: <FiUsers />,
      title: "Launch your program",
      description: "Invite students and begin your customized deepfake awareness training.",
    },
  ]

  // Testimonials data
  const testimonials = [
    {
      quote:
        "Perceptify has transformed how we teach media literacy. Our students are now much more confident in identifying manipulated content.",
      author: "Dr. Sarah Johnson",
      position: "Media Studies Professor, Stanford University",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "The analytics dashboard gives us incredible insights into student progress. We can identify knowledge gaps and address them immediately.",
      author: "Michael Chen",
      position: "Digital Literacy Coordinator, Boston Public Schools",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      quote:
        "The customization options allowed us to create a program that perfectly aligns with our curriculum standards.",
      author: "Emma Rodriguez",
      position: "Education Technology Director, NYU",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  return (
    <div className="educators-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content" data-aos="fade-up">
            <h1>Empower Your Learners with Custom Deepfake Awareness Training</h1>
            <p className="hero-subtitle">Tailored learning packages for institutions, schools, and organizations.</p>
            <div className="hero-cta">
              <button className="btn btn-primary">Get in Touch</button>
              <button className="btn btn-outline">View Plans</button>
            </div>
          </div>
          <div className="hero-image" data-aos="fade-left" data-aos-delay="200">
            <img src={educatorImg} alt="Educators dashboard preview"
                  className="hero-img"
                  width={500}
                  height={400}/>
          </div>
        </div>
        <div className="hero-shape-1"></div>
        <div className="hero-shape-2"></div>
      </section>

      {/* Value Proposition Section */}
      <section className="value-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>Why Customize?</h2>
            <p>Tailored solutions designed for educational institutions</p>
          </div>
          <div className="value-grid">
            <div className="value-card" data-aos="fade-up" data-aos-delay="100">
              <div className="value-icon">
                <FiBookOpen />
              </div>
              <h3>Tailored Learning Paths</h3>
              <p>Fit the module to your curriculum with customizable content and assessments.</p>
              <ul className="value-checklist">
                <li>
                  <FiCheck /> Curriculum alignment
                </li>
                <li>
                  <FiCheck /> Age-appropriate content
                </li>
                <li>
                  <FiCheck /> Flexible module ordering
                </li>
              </ul>
            </div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="200">
              <div className="value-icon">
                <FiBarChart2 />
              </div>
              <h3>Progress Tracking & Reports</h3>
              <p>Real-time insights into learner performance with detailed analytics.</p>
              <ul className="value-checklist">
                <li>
                  <FiCheck /> Comprehensive dashboards
                </li>
                <li>
                  <FiCheck /> Individual student tracking
                </li>
                <li>
                  <FiCheck /> Exportable reports
                </li>
              </ul>
            </div>
            <div className="value-card" data-aos="fade-up" data-aos-delay="300">
              <div className="value-icon">
                <FiUsers />
              </div>
              <h3>Flexible Licensing</h3>
              <p>Scale as per class size and needs with our flexible licensing options.</p>
              <ul className="value-checklist">
                <li>
                  <FiCheck /> Volume discounts
                </li>
                <li>
                  <FiCheck /> Annual subscription options
                </li>
                <li>
                  <FiCheck /> Add users as needed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>Choose Your Plan</h2>
            <p>Flexible options for educators and institutions of all sizes</p>
          </div>
          <div className="pricing-grid">
            {pricingData.tiers.map((tier, index) => (
              <div
                key={index}
                className={`pricing-card ${tier.popular ? "popular" : ""}`}
                data-aos="fade-up"
                data-aos-delay={100 + index * 100}
              >
                {tier.popular && <div className="popular-badge">Most Popular</div>}
                <div className="pricing-header">
                  <h3>{tier.name}</h3>
                  <p className="pricing-subtitle">{tier.subtitle}</p>
                </div>
                <div className="pricing-price">
                  <span className="price">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
                <ul className="pricing-features">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={feature.included ? "included" : "excluded"}>
                      {feature.included ? <FiCheck /> : <FiX />}
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
                <button className={`btn ${tier.popular ? "btn-primary" : "btn-outline"}`}>{tier.cta}</button>
              </div>
            ))}
          </div>
          <div className="pricing-note" data-aos="fade-up">
            <p>
              Need a custom solution for your institution? <a href="#contact">Contact our team</a>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>How It Works</h2>
            <p>Simple steps to get started with your customized program</p>
          </div>
          <div className="timeline">
            {timelineSteps.map((step, index) => (
              <div key={index} className="timeline-item" data-aos="fade-up" data-aos-delay={100 + index * 100}>
                <div className="timeline-number">{index + 1}</div>
                <div className="timeline-content">
                  <div className="timeline-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header" data-aos="fade-up">
            <h2>What Educators Say</h2>
            <p>Hear from institutions already using Perceptify</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card" data-aos="fade-up" data-aos-delay={100 + index * 100}>
                <div className="quote-mark">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="author-image"
                  />
                  <div className="author-info">
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.position}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="partner-logos" data-aos="fade-up">
            <div className="logo-title">Trusted by leading institutions</div>
            <div className="logos-container">
              <img src="/placeholder.svg?height=50&width=120" alt="Partner logo" className="partner-logo" />
              <img src="/placeholder.svg?height=50&width=120" alt="Partner logo" className="partner-logo" />
              <img src="/placeholder.svg?height=50&width=120" alt="Partner logo" className="partner-logo" />
              <img src="/placeholder.svg?height=50&width=120" alt="Partner logo" className="partner-logo" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-content" data-aos="fade-right">
              <h2>Ready to transform your media literacy curriculum?</h2>
              <p>Our team is here to help you create the perfect deepfake awareness program for your institution.</p>
              <div className="contact-methods">
                <a href="tel:+1234567890" className="contact-method">
                  <div className="method-icon">
                    <FiPhone />
                  </div>
                  <div className="method-content">
                    <h4>Book a Consultation</h4>
                    <p>Schedule a call with our education team</p>
                  </div>
                  <FiArrowRight className="method-arrow" />
                </a>
                <a href="mailto:education@perceptify.com" className="contact-method">
                  <div className="method-icon">
                    <FiMail />
                  </div>
                  <div className="method-content">
                    <h4>Email Our Team</h4>
                    <p>education@perceptify.com</p>
                  </div>
                  <FiArrowRight className="method-arrow" />
                </a>
                <a href="#" className="contact-method">
                  <div className="method-icon">
                    <FiFileText />
                  </div>
                  <div className="method-content">
                    <h4>Request a Custom Plan</h4>
                    <p>Fill out our detailed requirements form</p>
                  </div>
                  <FiArrowRight className="method-arrow" />
                </a>
              </div>
            </div>
            <div className="contact-form-container" data-aos="fade-left">
              <form className="contact-form">
                <h3>Get in Touch</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" placeholder="Your email" />
                </div>
                <div className="form-group">
                  <label htmlFor="institution">Institution</label>
                  <input type="text" id="institution" placeholder="Your institution" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" rows="4" placeholder="Tell us about your needs"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="contact-shape-1"></div>
        <div className="contact-shape-2"></div>
      </section>
    </div>
  )
}

export default ForEducators
