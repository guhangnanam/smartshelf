import React, {useEffect} from "react"
import { supabase } from "../utils/supabaseClient"
import AddContainerModal from "../components/AddContainerModal";
import AddFoodModal from "../components/AddFoodModal";

export default function Dashboard({ session }) {

    // State to hold containers
    const [showContainerModal, setShowContainerModal] = React.useState(false);
    const [showFoodModal, setShowFoodModal] = React.useState(false);

    // shelf data
    const [shelfItems, setShelfItems] = React.useState([]);

    // Fetch shelf
    async function fetchShelfItems() {
        const userId = session.user.id;

        const { data, error } = await supabase
            .from("shelf_items")
            .select(`
        id,
        food_name,
        calories_per_gram,
        current_weight,
        max_weight,
        container_id,
        containers(name)
      `)
            .eq("user_id", userId)
            .order("last_updated", { ascending: false });

        if (error) console.error("Error fetching shelf items:", error);
        else setShelfItems(data);
    }

    // ensure fetchContainers is run after component renders
    useEffect(() => {
        fetchShelfItems();
    }, [])


    // sign out handler
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    const handleDataUpdated = () => {
        fetchShelfItems();
    }


    // temp styles, probs tailwind later
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
            <p
            style={{
                position: "absolute",
                top: "5px",
                left: "10px",
                padding: "10px"

            }}>
                Signed in as: <b>{session.user.email}</b>
            </p>

            <button
                onClick={handleSignOut}
                style={{
                position: "absolute",
                top: "60px",
                left: "20px",
                padding: "10px",
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


            <button
                onClick={() => setShowContainerModal(true)}
                style={{
                    padding: "10px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#0077cc",
                    color: "white",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                }}
                >
                 + Add Container
            </button>
            <AddContainerModal
                isOpen={showContainerModal}
                onClose={() => setShowContainerModal(false)}
                userId = {session.user.id}
            />


            <button
                onClick={() => setShowFoodModal(true)}
                style={{
                    padding: "10px 15px",
                    borderRadius: "8px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                    position: "absolute",
                    top: "60px",
                    right: "20px",
                }}
            >
                + Add Shelf Item
            </button>
            <AddFoodModal
                isOpen={showFoodModal}
                onClose={() => setShowFoodModal(false)}
                userId = {session.user.id}
                onAdded = {handleDataUpdated}
            />

            <hr style={{ width: "80%", margin: "30px 0" }} />

            <h2>Your Shelf</h2>

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
                {shelfItems.length > 0 ? (
                    shelfItems.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "16px",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                        >
                            <h3>{item.name}</h3>
                            <p><b>Item:</b> {item.food_name}</p>
                            <p><b>Weight:</b> {item.current_weight} / {item.max_weight} g</p>
                            <p><b>Calories Remaining:</b> {(item.current_weight * item.calories_per_gram).toFixed(1)} kcal</p>
                        </div>
                    ))
                ) : (
                    <p>No containers yet. Add one to get started!</p>
                )}
            </div>




        </div>
    )
}
