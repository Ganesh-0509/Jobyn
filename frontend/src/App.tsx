import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ResumeProvider, useResume } from './context/ResumeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import React, { Suspense, lazy } from 'react'

// ── Lazy-loaded pages (each becomes its own chunk) ──────────────
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'))
const ReadinessScore = lazy(() => import('./pages/ReadinessScore'))
const SkillGap = lazy(() => import('./pages/SkillGap'))
const ImprovementPlan = lazy(() => import('./pages/ImprovementPlan'))
const InterviewReadiness = lazy(() => import('./pages/InterviewReadiness'))
const ProgressTracking = lazy(() => import('./pages/ProgressTracking'))
const ResumeComparison = lazy(() => import('./pages/ResumeComparison'))
const IndustryAlignment = lazy(() => import('./pages/IndustryAlignment'))
const MyProjects = lazy(() => import('./pages/MyProjects'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** Global page loading spinner for lazy chunks */
function PageLoader() {
    return (
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="spinner" />
        </div>
    )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /></div>
    return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <PageLoader />
    if (!user) return <Navigate to="/login" replace />
    if (!user.isAdmin) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}

function DashboardRedirect() {
    const { user } = useAuth()
    const { analysis, loading } = useResume()

    if (loading) return null

    if (user && !analysis) {
        return <Navigate to="/resume-analyzer" replace />
    }

    return <Dashboard />
}

/** Wrap a page component in its own error boundary so one page crash doesn't kill the app */
function Safe({ children }: { children: React.ReactNode }) {
    return <ErrorBoundary>{children}</ErrorBoundary>
}

function AppRoutes() {
    const { user } = useAuth()
    return (
        <Suspense fallback={<PageLoader />}>
        <Routes>
            {/* Landing — always accessible */}
            <Route path="/" element={<Landing />} />

            {/* Auth routes */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

            {/* Protected dashboard routes */}
            <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="dashboard" element={<Safe><DashboardRedirect /></Safe>} />
                <Route path="resume-analyzer" element={<Safe><ResumeAnalyzer /></Safe>} />
                <Route path="readiness-score" element={<Safe><ReadinessScore /></Safe>} />
                <Route path="skill-gap" element={<Safe><SkillGap /></Safe>} />
                <Route path="improvement-plan" element={<Safe><ImprovementPlan /></Safe>} />
                <Route path="interview-readiness" element={<Safe><InterviewReadiness /></Safe>} />
                <Route path="progress-tracking" element={<Safe><ProgressTracking /></Safe>} />
                <Route path="resume-comparison" element={<Safe><ResumeComparison /></Safe>} />
                <Route path="industry-alignment" element={<Safe><IndustryAlignment /></Safe>} />
                <Route path="my-projects" element={<Safe><MyProjects /></Safe>} />
                <Route path="admin" element={<Safe><AdminRoute><AdminDashboard /></AdminRoute></Safe>} />
                <Route path="settings" element={<Safe><Settings /></Safe>} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ResumeProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <AppRoutes />
                        </BrowserRouter>
                    </ToastProvider>
                </ResumeProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}
