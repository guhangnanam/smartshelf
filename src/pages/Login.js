import React, { useState, useEffect } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "../utils/supabaseClient"
import "../styles/login.css"

export default function LoginPage() {
    const [displayedText, setDisplayedText] = useState("")
    const fullText = "Smart Shelf"
    const typingSpeed = 100

    useEffect(() => {
        let currentIndex = 0
        const interval = setInterval(() => {
            if (currentIndex < fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex + 1))
                currentIndex++
            } else {
                clearInterval(interval)
            }
        }, typingSpeed)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="login-container">
            {/* Animated background elements */}
            <div className="floating-blob blob-1"></div>
            <div className="floating-blob blob-2"></div>
            <div className="floating-blob blob-3"></div>
            
            <div className="login-card">
                {/* Decorative circles */}
                <div className="accent-circle circle-1"></div>
                <div className="accent-circle circle-2"></div>
                
                <div className="login-content">
                    <h1 className="login-title">
                        {displayedText}
                        <span className="typing-cursor"></span>
                    </h1>

                    <div className="auth-wrapper">
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ theme: ThemeSupa }}
                            theme="default"
                            providers={[]} // email/password only
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
