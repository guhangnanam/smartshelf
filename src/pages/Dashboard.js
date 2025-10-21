import React from "react"
import { supabase } from "../utils/supabaseClient"

export default function Dashboard({ session }) {
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                color: "#000000",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "sans-serif",
            }}
        >
            <h1 style={{ marginBottom: "10px" }}>Welcome to Smart Shelf</h1>
            <p>
                Signed in as: <b>{session.user.email}</b>
            </p>

            <button
                onClick={handleSignOut}
                style={{
                    marginTop: "25px",
                    padding: "10px 25px",
                    borderRadius: "8px",
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                }}
            >
                Sign Out
            </button>
        </div>
    )
}
