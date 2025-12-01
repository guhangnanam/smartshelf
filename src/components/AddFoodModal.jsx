import React, {useEffect, useState} from "react";
import {supabase} from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"

export default function AddFoodModal({isOpen, onClose, onAdded, userId, defaultContainerId}) {

    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(defaultContainerId || null);
    const [name, setName] = React.useState("");
    const [caloriesPerServing, setCaloriesPerServing] = useState("");
    const [proteinPerServing, setProteinPerServing] = useState("");
    const [fatsPerServing, setFatsPerServing] = useState("");
    const [carbsPerServing, setCarbsPerServing] = useState("");
    const [servingSize, setServingSize] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [useApi, setUseApi] = useState(false);
    const [errors, setErrors] = useState({});
    // Default device ID - will be configurable later
    const [deviceId, setDeviceId] = useState("ShelfESP32_1");
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
        setSelectedContainer("");
        setCaloriesPerServing("");
        setProteinPerServing("");
        setFatsPerServing("");
        setCarbsPerServing("");
        setServingSize("");
        setErrors({});
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

        const servingSizeNum = parseFloat(servingSize);
        const calsServNum = parseFloat(caloriesPerServing);
        const protServNum = parseFloat(proteinPerServing || "0");
        const fatsServNum = parseFloat(fatsPerServing || "0");
        const carbsServNum = parseFloat(carbsPerServing || "0");
        const currentWeightNum = parseFloat(currentWeight);
        const maxWeightNum = parseFloat(maxWeight);

        if (!servingSize || isNaN(servingSizeNum) || servingSizeNum <= 0) {
            newErrors.servingSize = "Serving size (g) is required and must be > 0";
        }
        if (!caloriesPerServing || isNaN(calsServNum) || calsServNum <= 0) {
            newErrors.caloriesPerServing =
                "Calories per serving is required and must be > 0";
        }

        if (!currentWeight || isNaN(currentWeightNum) || currentWeightNum < 0) {
            newErrors.currentWeight = "Please enter valid current weight";
        }
        if (!maxWeight || isNaN(maxWeightNum) || maxWeightNum <= 0) {
            newErrors.maxWeight =
                "Please enter valid max weight (must be greater than 0)";
        }
        if (!isNaN(currentWeightNum) && !isNaN(maxWeightNum) && currentWeightNum > maxWeightNum) {
            newErrors.weight = "Current weight cannot exceed max weight";
        }

        if (!isNaN(protServNum) && protServNum < 0) {
            newErrors.proteinPerServing = "Protein cannot be negative";
        }
        if (!isNaN(fatsServNum) && fatsServNum < 0) {
            newErrors.fatsPerServing = "Fat cannot be negative";
        }
        if (!isNaN(carbsServNum) && carbsServNum < 0) {
            newErrors.carbsPerServing = "Carbs cannot be negative";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        // calculate per gram values
        const caloriesPerGram = calsServNum / servingSizeNum;
        const proteinPerGram = protServNum / servingSizeNum;
        const fatsPerGram = fatsServNum / servingSizeNum;
        const carbsPerGram = carbsServNum / servingSizeNum;

        try{
            await supabase.from("shelf_items").insert([
                {
                    user_id: userId,
                    container_id: selectedContainer,
                    food_name: name.trim(),

                    calories_per_gram: caloriesPerGram,
                    protein_per_gram: proteinPerGram,
                    fat_per_gram: fatsPerGram,
                    carbs_per_gram: carbsPerGram,
                    serving_size_grams: servingSizeNum,

                    calories_per_serving: parseFloat(caloriesPerServing),
                    protein_per_serving: parseFloat(proteinPerServing),
                    fat_per_serving: parseFloat(fatsPerServing),
                    carbs_per_serving: parseFloat(carbsPerServing),

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
            <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                <div className="modal-header">
                    <h3>Add Shelf Item</h3>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Container Selection Dropdown */}
                    <div className="form-group">
                        <select
                            value={selectedContainer || ""}
                            onChange={(e) => setSelectedContainer(e.target.value)}
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
                                <label className="form-label">Serving Size (g)</label>
                                <input
                                    type="number"
                                    placeholder="Serving Size (g)"
                                    value={servingSize}
                                    onChange={(e) => setServingSize(e.target.value)}
                                    className={`form-input ${errors.servingSize ? 'error' : ''}`}
                                    required
                                />
                                {errors.servingSize && <p className="error-message">{errors.servingSize}</p>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Calories per Serving</label>
                                <input
                                    type="number"
                                    placeholder="Calories per Serving"
                                    value={caloriesPerServing}
                                    onChange={(e) => setCaloriesPerServing(e.target.value)}
                                    className={`form-input ${errors.caloriesPerServing ? 'error' : ''}`}
                                    required
                                />
                                {errors.caloriesPerServing && <p className="error-message">{errors.caloriesPerServing}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Protein per Serving</label>
                                <input
                                    type="number"
                                    placeholder="Protein per Serving"
                                    value={proteinPerServing}
                                    onChange={(e) => setProteinPerServing(e.target.value)}
                                    className={`form-input ${errors.proteinPerServing ? 'error' : ''}`}
                                    required
                                />
                                {errors.proteinPerServing && <p className="error-message">{errors.proteinPerServing}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fats per Serving</label>
                                <input
                                    type="number"
                                    placeholder="Fats per Serving"
                                    value={fatsPerServing}
                                    onChange={(e) => setFatsPerServing(e.target.value)}
                                    className={`form-input ${errors.fatsPerServing ? 'error' : ''}`}
                                    required
                                />
                                {errors.fatsPerServing && <p className="error-message">{errors.fatsPerServing}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Carbohydrates per Serving</label>
                                <input
                                    type="number"
                                    placeholder="Carbohydrates per Serving"
                                    value={carbsPerServing}
                                    onChange={(e) => setCarbsPerServing(e.target.value)}
                                    className={`form-input ${errors.carbsPerServing ? 'error' : ''}`}
                                    required
                                />
                                {errors.carbsPerServing && <p className="error-message">{errors.carbsPerServing}</p>}
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