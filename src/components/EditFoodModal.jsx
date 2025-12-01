import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"

export default function EditFoodModal({ isOpen, onClose, item, userId, onAdded }) {
    const [name, setName] = useState("");
    const [caloriesPerServing, setCaloriesPerServing] = useState("");
    const [proteinPerServing, setProteinPerServing] = useState("");
    const [fatsPerServing, setFatsPerServing] = useState("");
    const [carbsPerServing, setCarbsPerServing] = useState("");
    const [servingSize, setServingSize] = useState("")
    const [currentWeight, setCurrentWeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen && item) {
            document.body.style.overflow = "hidden";
            setName(item.food_name || "");
            setCurrentWeight(item.current_weight || "");
            setMaxWeight(item.max_weight || "");
            setServingSize(item.serving_size_grams || "");
            setCaloriesPerServing(item.calories_per_serving || "");
            setProteinPerServing(item.protein_per_serving || "");
            setFatsPerServing(item.fat_per_serving || "");
            setCarbsPerServing(item.carbs_per_serving || "");
            setErrors({});
        }
        else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        }
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    const handleClose = () => {
        setName("");
        setServingSize("");
        setCaloriesPerServing("");
        setProteinPerServing("");
        setFatsPerServing("");
        setCarbsPerServing("");
        setCurrentWeight("");
        setMaxWeight("");
        setErrors({});
        document.body.style.overflow = "auto";
        onClose();
    }

    const handleSubmit = async e => {
        e.preventDefault();
        const newErrors = {};

        // Validation
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
        const caloriesPerGram = calsServNum / servingSizeNum;
        const proteinPerGram  = protServNum / servingSizeNum;
        const fatsPerGram     = fatsServNum / servingSizeNum;
        const carbsPerGram    = carbsServNum / servingSizeNum;


        try {
            await supabase.from("shelf_items").update({
                food_name: name.trim(),
                serving_size_grams: servingSizeNum,

                calories_per_serving: calsServNum,
                protein_per_serving: protServNum,
                fat_per_serving: fatsServNum,
                carbs_per_serving: carbsServNum,

                calories_per_gram: caloriesPerGram,
                protein_per_gram: proteinPerGram,
                fat_per_gram: fatsPerGram,
                carbs_per_gram: carbsPerGram,

                current_weight: currentWeightNum,
                max_weight: maxWeightNum,
            }).eq("id", item.id).eq("user_id", userId);

            addToast(`"${name}" updated successfully!`, "success");
        }
        catch (err) {
            console.error("Error updating shelf item", err);
            addToast("Failed to update shelf item", "error");
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
                    <h3>Edit Shelf Item</h3>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
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
                            placeholder="Serving size (g)"
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
                            placeholder="Calories per serving"
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
                            placeholder="Protein per serving"
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
                            placeholder="Fats per serving"
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
                            placeholder="Carbohydrates per serving"
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

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Save Changes
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
