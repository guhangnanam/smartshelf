import React, {useEffect} from "react"
import { supabase } from "../utils/supabaseClient"

export default function Dashboard({ session }) {

    const [containers, setContainers] = React.useState([])

    // Fetch containers
    async function fetchContainers() {
        const userId = session.user.id

        // query database for containers belonging to this user
        const {data, error} = await supabase
            .from('containers')
            .select('*')
            .eq('user_id', userId)
            .order('last_updated', {ascending: false})

        if (error) {
            console.error('Error fetching containers:', error)
        }
        else{
            setContainers(data)
        }
    }

    // ensure fetchContainers is run after component renders
    useEffect(() => {
        fetchContainers()
    }, [])


    // Sign out handler
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                color: "black",
                minHeight: "10vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                justifyContent: "flex-start",
                fontFamily: "sans-serif",
            }}

            >
            <h1>Smart Shelf Dashboard</h1>
            <p>
                Signed in as: <b>{session.user.id}</b>
            </p>

            <button
                onClick={handleSignOut}
                style={{
                marginTop: "20px",
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

            <hr style={{ width: "80%", margin: "30px 0" }} />

            <h2>Your Containers</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    width: "100%",
                    maxWidth: "900px",
                    marginTop: "20px",
                }}
            >
                {containers.length > 0 ? (
                    containers.map((c) => (
                        <div
                            key={c.id}
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "16px",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                        >
                            <h3>{c.name}</h3>
                            <p><b>Item:</b> {c.food_item}</p>
                            <p><b>Weight:</b> {c.current_weight} / {c.max_weight} g</p>
                            <p><b>Calories Remaining:</b> {(c.current_weight * c.calories_per_gram).toFixed(1)} kcal</p>
                        </div>
                    ))
                ) : (
                    <p>No containers yet. Add one to get started!</p>
                )}
            </div>
        </div>
    )
}
