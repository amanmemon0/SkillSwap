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
import ProtectedRoute from './auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><Admin /></ProtectedRoute>} />
      <Route path="/admin/import" element={<ProtectedRoute role="admin"><BulkUserImport /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute role="user"><UserProfile /></ProtectedRoute>} />
      <Route path="/exchanges" element={<ProtectedRoute role="user"><Exchanges /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute role="user"><Messages /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

