// src/index.js
import HomeScreen from './screens/HomeScreen';
import SignupForm from './screens/SignupForm';
import LoginForm from './screens/LoginForm';
import Features from './screens/Features';
import Dashboard from './screens/Dashboard';
import GuardianApproval from './screens/GuardianApproval';
import ForEducators from './screens/ForEducators';
import DeepfakeDetectionDemo from './screens/DeepfakeDemo';
import Contact from './screens/Contact';
import InitialAssessmentQuiz from './screens/InitialAssessmentQuiz';
import LearningDashboard from './screens/LearningDashboard';
import CourseView from './screens/CourseView';
import ModuleView from './screens/ModuleView';
import LessonPlayer from './screens/LessonPlayer';
import QuizInterface from './screens/QuizInterface';
import LabInterface from './screens/LabInterface';
import CertificateView from './screens/CertificateView';
import AdminDashboard from './screens/AdminDashboard';
import ForumPage from './screens/ForumPage';
import './assets/styles/bootstrap.custom.css';
import './assets/styles/index.css';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute'; 
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute'; 

// Define your routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />}>
      <Route index={true} element={<HomeScreen />} />
      <Route path='signup' element={<SignupForm />} />
      <Route path='login' element={<LoginForm />} />
      <Route path='features' element={<Features />} />
      <Route path='dashboard' element={<Dashboard />} />
      <Route path='guardian' element={<GuardianApproval />} />
      <Route path='educators' element={<ForEducators />} />
      <Route path='demo' element={<DeepfakeDetectionDemo />} />
      <Route path='contact' element={<Contact />} />
      <Route path='initialassessment-quiz' element={<InitialAssessmentQuiz />} />

      {/* Learning Management System Routes */}
      <Route path='learning-dashboard' element={<ProtectedRoute><LearningDashboard /></ProtectedRoute>} />
      <Route path='course/:trackId' element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
      <Route path='module/:moduleId' element={<ProtectedRoute><ModuleView /></ProtectedRoute>} />
      <Route path='lesson/:lessonId' element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
      <Route path='quiz/:quizId' element={<ProtectedRoute><QuizInterface /></ProtectedRoute>} />
      <Route path='lab/:labId' element={<ProtectedRoute><LabInterface /></ProtectedRoute>} />
      <Route path='certificate/:certId' element={<ProtectedRoute><CertificateView /></ProtectedRoute>} />

      {/* Community Forum Route */}
      <Route path='forum' element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path='admin/dashboard' element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
    </Route>
  )

);

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);


reportWebVitals();