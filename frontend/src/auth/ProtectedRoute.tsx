import { Navigate } from 'react-router-dom'
import { session, type Role } from './demoAuth'
import type { ReactNode } from 'react'
export default function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) { const current = session(); if (!current) return <Navigate to="/login" replace/>; return current.role === role ? <>{children}</> : <Navigate to={current.role === 'admin' ? '/admin' : '/dashboard'} replace/> }
