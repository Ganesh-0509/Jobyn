import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ResumeProvider } from './context/ResumeContext'
import { ToastProvider } from './context/ToastContext'
import { PrivacyProvider } from './context/PrivacyContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from './components/ui/sonner'
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
const Privacy = lazy(() => import('./pages/Privacy'))
const Docs = lazy(() => import('./pages/Docs'))
const Terms = lazy(() => import('./pages/Terms'))

/** Global page loading spinner for lazy chunks */
function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
    )
}

/** Guard: redirect unauthenticated users to login */
function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <PageLoader />
    if (!user) return <Navigate to="/login" replace />
    return <>{children}</>
}

/** Guard: redirect authenticated users to dashboard */
function GuestOnly({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    if (loading) return <PageLoader />
    if (user) return <Navigate to="/dashboard" replace />
    return <>{children}</>
}

function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/docs" element={<Docs />} />

                {/* Authenticated — wrapped in Layout */}
                <Route element={<RequireAuth><Layout /></RequireAuth>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
                    <Route path="/readiness-score" element={<ReadinessScore />} />
                    <Route path="/skill-gap" element={<SkillGap />} />
                    <Route path="/improvement-plan" element={<ImprovementPlan />} />
                    <Route path="/interview-readiness" element={<InterviewReadiness />} />
                    <Route path="/progress-tracking" element={<ProgressTracking />} />
                    <Route path="/resume-comparison" element={<ResumeComparison />} />
                    <Route path="/industry-alignment" element={<IndustryAlignment />} />
                    <Route path="/my-projects" element={<MyProjects />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <PrivacyProvider>
                        <ResumeProvider>
                            <ToastProvider>
                                <AppRoutes />
                                <Toaster />
                            </ToastProvider>
                        </ResumeProvider>
                    </PrivacyProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}
