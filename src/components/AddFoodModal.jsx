import React, {useEffect} from "react";
import {supabase} from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"

export default function AddFoodModal({isOpen, onClose, onAdded, userId, defaultContainerId}) {

    const [containers, setContainers] = React.useState([]);
    const [selectedContainer, setSelectedContainer] = React.useState(defaultContainerId || null);
    const [name, setName] = React.useState("");
    const [caloriesPerGram, setCaloriesPerGram] = React.useState("");
    const [currentWeight, setCurrentWeight] = React.useState("");
    const [maxWeight, setMaxWeight] = React.useState("");
    const [useApi, setUseApi] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    // Default device ID - will be configurable later
    const [deviceId, setDeviceId] = React.useState("ShelfESP32_1");
    const { addToast } = useToast();


    useEffect(() => {
        if (isOpen){
            document.body.style.overflow = "hidden";
            fetchContainers();
            // Pre-select the container if provided
            if (defaultContainerId) {
                setSelectedContainer(defaultContainerId);
            }
        }
        else{
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, defaultContainerId]);

    // Fetch available containers for the user
    async function fetchContainers(){
        // Pull the user's saved containers
        const {data, error} = await supabase.from("containers").select("id, name").eq("user_id", userId)

        if (error){
            console.error("Error fetching containers", error);
            addToast("Failed to fetch containers", "error");
        }
        else{
            setContainers(data);
        }
    }

    if(!isOpen) return null;

    const handleClose = () => {
        setName("");
        setMaxWeight("");
        setCurrentWeight("");
        setUseApi(false);
        setSelectedContainer(null);
        document.body.style.overflow = "auto";
        onClose();
    }

    const handleSubmit = async e => {
        e.preventDefault();
        const newErrors = {};

        // Validate all form fields
        if (!selectedContainer) {
            newErrors.container = "Please select a container";
        }
        if (!name || name.trim().length === 0) {
            newErrors.name = "Food name is required";
        }
        if (!caloriesPerGram || parseFloat(caloriesPerGram) < 0) {
            newErrors.calories = "Please enter valid calories per gram";
        }
        if (!currentWeight || parseFloat(currentWeight) < 0) {
            newErrors.currentWeight = "Please enter valid current weight";
        }
        if (!maxWeight || parseFloat(maxWeight) <= 0) {
            newErrors.maxWeight = "Please enter valid max weight (must be greater than 0)";
        }
        if (parseFloat(currentWeight) > parseFloat(maxWeight)) {
            newErrors.weight = "Current weight cannot exceed max weight";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try{
            await supabase.from("shelf_items").insert([
                {
                    user_id: userId,
                    container_id: selectedContainer,
                    food_name: name.trim(),
                    calories_per_gram: parseFloat(caloriesPerGram),
                    current_weight: parseFloat(currentWeight),
                    max_weight: parseFloat(maxWeight),
                    device_id: deviceId,
                },
            ]);

            addToast(`"${name}" added to shelf!`, "success");
        }
        catch (err) {
            console.error("Error adding shelf item", err);
            addToast("Failed to add shelf item", "error");
        }
        finally {
            if (typeof onAdded === "function") {
                onAdded();
            }
            handleClose();
        }
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add Shelf Item</h3>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Container Selection Dropdown */}
                    <div className="form-group">
                        <select
                            value={selectedContainer || ""}
                            onChange={(e) => setSelectedContainer(parseInt(e.target.value))}
                            className={`form-input ${errors.container ? 'error' : ''}`}
                            required
                        >
                            <option value="">Select container...</option>
                            {containers.map((container) => (
                                <option key={container.id} value={container.id}>
                                    {container.name}
                                </option>
                            ))}
                        </select>
                        {errors.container && <p className="error-message">{errors.container}</p>}
                    </div>

                    {/* Device Selection Dropdown */}
                    <div className="form-group">
                        <select
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            className="form-input"
                        >
                            <option value="ShelfESP32_1">ShelfESP32_1</option>
                        </select>
                    </div>

                    {/* Toggle between API search and manual entry */}
                    <button
                        type="button"
                        onClick={() => setUseApi(!useApi)}
                        className="scale-toggle-btn"
                    >
                        {useApi ? "Enter info manually" : "Search food using API"}
                    </button>

                    {/* Manual entry form fields */}
                    {!useApi && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Food Name</label>
                                <input
                                    type="text"
                                    placeholder="Food name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                    required
                                />
                                {errors.name && <p className="error-message">{errors.name}</p>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Calories per Gram</label>
                                <input
                                    type="number"
                                    placeholder="Calories per gram"
                                    value={caloriesPerGram}
                                    onChange={(e) => setCaloriesPerGram(e.target.value)}
                                    className={`form-input ${errors.calories ? 'error' : ''}`}
                                    required
                                />
                                {errors.calories && <p className="error-message">{errors.calories}</p>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Current Weight (g)</label>
                                <input
                                    type="number"
                                    placeholder="Current weight (g)"
                                    value={currentWeight}
                                    onChange={(e) => setCurrentWeight(e.target.value)}
                                    className={`form-input ${errors.currentWeight ? 'error' : ''}`}
                                    required
                                />
                                {errors.currentWeight && <p className="error-message">{errors.currentWeight}</p>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Max Weight (g)</label>
                                <input
                                    type="number"
                                    placeholder="Max weight (g)"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                    className={`form-input ${errors.maxWeight || errors.weight ? 'error' : ''}`}
                                    required
                                />
                                {errors.maxWeight && <p className="error-message">{errors.maxWeight}</p>}
                                {errors.weight && <p className="error-message">{errors.weight}</p>}
                            </div>
                        </>
                    )}

                    {/* Submit and Cancel Buttons */}
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Add Food
                        </button>

                        <button type="button" onClick={handleClose} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}