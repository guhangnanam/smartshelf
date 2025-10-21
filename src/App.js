import React, { useEffect, useState } from "react"
import { supabase } from "./utils/supabaseClient"
import LoginPage from "./pages/Login"
import Dashboard from "./pages/Dashboard"

function App() {
    const [session, setSession] = useState(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
        return () => listener.subscription.unsubscribe()
    }, [])

    // Switch between pages based on auth state
    return session ? <Dashboard session={session} /> : <LoginPage />
}

export default App
