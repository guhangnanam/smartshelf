import React, { useEffect, useState } from "react"
import { supabase } from "./utils/supabaseClient"
import { ToastProvider } from "./context/ToastContext"
import LoginPage from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import "./styles/toast.css"

function App() {
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Get the initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setIsLoading(false)
        })

        // Listen for auth changes (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setIsLoading(false)
        })

        return () => subscription?.unsubscribe()
    }, [])

    // Show nothing while loading to prevent flickering
    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>Loading...</div>
    }

    // Switch between pages based on auth state
    return (
        <ToastProvider>
            {session ? <Dashboard session={session} /> : <LoginPage />}
        </ToastProvider>
    )
}

export default App