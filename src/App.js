import React, { useEffect, useState } from "react"
import { supabase } from "./utils/supabaseClient"
import { ToastProvider } from "./context/ToastContext"
import LoginPage from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ConsumptionHistory from "./pages/ConsumptionHistory"
import "./styles/toast.css"

function App() {
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState("dashboard");

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

    // switch page depending on state
    const renderPage = () => {
        // return login if session is not auth
        if (!session) return <LoginPage />;

        if (page === "dashboard")
            return <Dashboard session={session} navigate={setPage} />;

        if (page === "consumption")
            return <ConsumptionHistory session={session} navigate={setPage} />;

        return null;
    };

    return <ToastProvider>{renderPage()}</ToastProvider>;
}

export default App