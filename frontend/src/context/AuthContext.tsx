import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User as SupaUser } from '@supabase/supabase-js'

export interface User { name: string; email: string; isAdmin: boolean }
interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (name: string, email: string, password: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@campussync.ai,demo@campussync.ai')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)

function toAppUser(su: SupaUser | null | undefined): User | null {
    if (!su || !su.email) return null
    return {
        name: su.user_metadata?.name || su.email.split('@')[0],
        email: su.email,
        isAdmin: ADMIN_EMAILS.includes(su.email.toLowerCase()),
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    /* ── Bootstrap: get existing session + subscribe to changes ── */
    useEffect(() => {
        // 1. Get the current session on mount (with 5s timeout fallback)
        const timeout = setTimeout(() => {
            setLoading(false) // unstick even if Supabase is unreachable
        }, 5000)

        supabase.auth.getSession().then(({ data: { session: s } }) => {
            clearTimeout(timeout)
            setSession(s)
            setUser(toAppUser(s?.user))
            setLoading(false)
        }).catch(() => {
            clearTimeout(timeout)
            setLoading(false)
        })

        // 2. Listen for future auth events (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s)
                setUser(toAppUser(s?.user))
            },
        )

        return () => subscription.unsubscribe()
    }, [])

    /* ── Actions ────────────────────────────────────────────────── */
    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
    }, [])

    const signup = useCallback(async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        })
        if (error) throw new Error(error.message)

        // If email confirmation is enabled in Supabase, data.session is null and data.user is created.
        if (data.user && !data.session) {
            throw new Error("VerificationEmailSent")
        }

        // If email confirmation is disabled, auto-login using the credentials.
        if (!data.session) {
            const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
            if (loginErr) throw new Error(loginErr.message)
        }
    }, [])

    const loginWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        })
        if (error) throw new Error(error.message)
    }, [])

    const logout = useCallback(() => {
        supabase.auth.signOut()
    }, [])

    const value = useMemo(() => ({
        user,
        session,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout
    }), [user, session, loading, login, signup, loginWithGoogle, logout])

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be inside AuthProvider')
    return ctx
}
