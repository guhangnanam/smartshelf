import React, {useEffect} from "react"
import { supabase } from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"
import AddContainerModal from "../components/AddContainerModal";
import AddFoodModal from "../components/AddFoodModal";
import EditFoodModal from "../components/EditFoodModal";
import FeedbackModal from "../components/FeedbackModal";
import "../styles/dashboard.css"
import "../styles/modal.css"
import "../styles/skeleton.css"

export default function Dashboard({ session }) {

    // Modal visibility states
    const [showContainerModal, setShowContainerModal] = React.useState(false);
    const [showFoodModal, setShowFoodModal] = React.useState(false);
    const [selectedContainerForAdding, setSelectedContainerForAdding] = React.useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    // Data state for containers and items
    const [shelfItems, setShelfItems] = React.useState([]);
    const [containers, setContainers] = React.useState([]);
    const { addToast } = useToast();

    // Load all shelf items from the database
    async function fetchShelfItems() {
        setIsLoading(true);
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
        
        setIsLoading(false);
    }

    // Load all containers from the database
    async function fetchContainers() {
        const userId = session.user.id;
        const { data, error } = await supabase
            .from("containers")
            .select("id, name")
            .eq("user_id", userId);

        if (error) console.error("Error fetching containers:", error);
        else setContainers(data);
    }

    // Initialize data on component mount
    useEffect(() => {
        fetchShelfItems();
        fetchContainers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Handle user sign out
    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            addToast("Signed out successfully", "success");
            // The auth state listener in App.js will handle the redirect
        } catch (error) {
            console.error("Error signing out:", error);
            addToast("Failed to sign out", "error");
        }
    }

    const handleDataUpdated = () => {
        fetchShelfItems();
    }

    const handleEditItem = (item) => {
        setEditingItem(item);
        setShowEditModal(true);
    }

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await supabase.from("shelf_items").delete().eq("id", itemId);
            addToast("Item deleted", "success");
            handleDataUpdated();
        }
    }

    const handleDeleteContainer = async (containerId) => {
        if (window.confirm("Are you sure you want to delete this container? All items in it will be removed.")) {
            await supabase.from("containers").delete().eq("id", containerId);
            addToast("Container deleted", "success");
            fetchContainers();
            fetchShelfItems();
        }
    }

    const handleAddItemToContainer = (containerId) => {
        setSelectedContainerForAdding(containerId);
        setShowFoodModal(true);
    }


    return (
        <div className="dashboard-container">
            {/* Animated background elements */}
            <div className="floating-blob blob-1"></div>
            <div className="floating-blob blob-2"></div>
            <div className="floating-blob blob-3"></div>

            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1 className="dashboard-title">Smart Shelf</h1>
                    <p className="user-info">Signed in as: <b>{session.user.email}</b></p>
                </div>
                <div className="header-buttons">
                    <button className="feedback-btn" onClick={() => setShowFeedbackModal(true)} title="Send feedback">
                        Feedback
                    </button>
                    <button className="sign-out-btn" onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowContainerModal(true)}
                        disabled={isLoading}
                    >
                        + Add Container
                    </button>
                </div>

                <AddContainerModal
                    isOpen={showContainerModal}
                    onClose={() => setShowContainerModal(false)}
                    userId={session.user.id}
                    onAdded={fetchContainers}
                />
                <AddFoodModal
                    isOpen={showFoodModal}
                    onClose={() => {
                        setShowFoodModal(false);
                        setSelectedContainerForAdding(null);
                    }}
                    userId={session.user.id}
                    onAdded={handleDataUpdated}
                    defaultContainerId={selectedContainerForAdding}
                />
                <EditFoodModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    item={editingItem}
                    userId={session.user.id}
                    onAdded={handleDataUpdated}
                />
                <FeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                    userId={session.user.id}
                />
                {/* Containers with nested items */}
                <div className="shelf-section">
                    <h2 className="section-title">Your Containers</h2>
                    
                    {containers.length > 0 ? (
                        <div className="containers-with-items">
                            {containers.map((container) => {
                                const containerItems = shelfItems.filter(item => item.container_id === container.id);
                                return (
                                    <div key={container.id} className="container-with-items">
                                        <div className="container-header-expanded">
                                            <div className="container-title-info">
                                                <h3>{container.name}</h3>
                                                <div className="container-meta">
                                                    <span className="meta-item">
                                                        {container.empty_weight 
                                                            ? `${container.empty_weight}g empty weight` 
                                                            : 'Using scale'}
                                                    </span>
                                                    <span className="meta-item">
                                                        {containerItems.length} item{containerItems.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteContainer(container.id)}
                                                title="Delete container"
                                            >
                                                ✕
                                            </button>
                                            <button 
                                                className="add-item-btn"
                                                onClick={() => handleAddItemToContainer(container.id)}
                                                title="Add item to this container"
                                            >
                                                + Add Item
                                            </button>
                                        </div>

                                        {/* Items in this container */}
                                        <div className="container-items-grid">
                                            {containerItems.length > 0 ? (
                                                containerItems.map((item) => (
                                                    <div key={item.id} className="shelf-card">
                                                        <div className="shelf-card-header">
                                                            <h3>{item.food_name || item.name}</h3>
                                                            <div className="shelf-card-actions">
                                                                <button 
                                                                    className="edit-btn"
                                                                    onClick={() => handleEditItem(item)}
                                                                    title="Edit item"
                                                                >
                                                                    ✎
                                                                </button>
                                                                <button 
                                                                    className="delete-btn"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    title="Delete item"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="shelf-card-body">
                                                            <p className="item-detail">
                                                                <span className="detail-label">Weight:</span> {item.current_weight} / {item.max_weight} g
                                                            </p>
                                                            <div className="weight-bar">
                                                                <div 
                                                                    className="weight-fill"
                                                                    style={{width: `${(item.current_weight / item.max_weight * 100) || 0}%`}}
                                                                ></div>
                                                            </div>
                                                            <p className="item-detail">
                                                                <span className="detail-label">Calories:</span> {(item.current_weight * item.calories_per_gram).toFixed(1)} kcal
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="container-empty-message">No items in this container yet</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">—</div>
                            <p className="empty-state-message">No containers yet</p>
                            <p className="empty-state-submessage">Click "Add Container" to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
