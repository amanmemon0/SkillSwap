import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import BulkUserImport from './pages/BulkUserImport';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import Exchanges from './pages/Exchanges';
import Messages from './pages/Messages';
import ExploreSkills from './pages/ExploreSkills';
import SkillMatch from './pages/SkillMatch';
import ExchangeRequest from './pages/ExchangeRequest';
import Community from './pages/Community';
import ProtectedRoute from './auth/ProtectedRoute';

// P2P Learning, Exams & Certificates
import MyLearning from './pages/MyLearning';
import LearningCourseDetail from './pages/LearningCourseDetail';
import LiveLecture from './pages/LiveLecture';
import MyTeaching from './pages/MyTeaching';
import TeachingCourseDetail from './pages/TeachingCourseDetail';
import ExamPage from './pages/ExamPage';
import CertificatePage from './pages/CertificatePage';
import CertificateView from './pages/CertificateView';
import CertificateVerify from './pages/CertificateVerify';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/explore" element={<ExploreSkills />} />
      <Route path="/match" element={<SkillMatch />} />
      <Route path="/exchange-request" element={<ExchangeRequest />} />
      <Route path="/community" element={<Community />} />
      <Route path="/certificates/verify" element={<CertificateVerify />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
      <Route path="/admin/import" element={<ProtectedRoute role="admin"><BulkUserImport /></ProtectedRoute>} />

      {/* Authenticated User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute role="user"><UserProfile /></ProtectedRoute>} />
      <Route path="/exchanges" element={<ProtectedRoute role="user"><Exchanges /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute role="user"><Messages /></ProtectedRoute>} />

      {/* Learning Routes */}
      <Route path="/learning" element={<ProtectedRoute role="user"><MyLearning /></ProtectedRoute>} />
      <Route path="/learning/:courseId" element={<ProtectedRoute role="user"><LearningCourseDetail /></ProtectedRoute>} />
      <Route path="/learning/:courseId/lecture/:lectureId" element={<ProtectedRoute role="user"><LiveLecture /></ProtectedRoute>} />
      <Route path="/learning/:courseId/exam" element={<ProtectedRoute role="user"><ExamPage /></ProtectedRoute>} />

      {/* Teaching Routes */}
      <Route path="/teaching" element={<ProtectedRoute role="user"><MyTeaching /></ProtectedRoute>} />
      <Route path="/teaching/:courseId" element={<ProtectedRoute role="user"><TeachingCourseDetail /></ProtectedRoute>} />

      {/* Certificate Routes */}
      <Route path="/certificates" element={<ProtectedRoute role="user"><CertificatePage /></ProtectedRoute>} />
      <Route path="/certificates/:certificateId" element={<ProtectedRoute role="user"><CertificateView /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
