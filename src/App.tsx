import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import RegisterPage from './pages/Register/RegisterPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
export default function App(){return <Routes><Route path="/" element={<Navigate to="/login" replace/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/admin" element={<AdminDashboard/>}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>}
