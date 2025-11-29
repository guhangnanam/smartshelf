import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"

export default function EditFoodModal({ isOpen, onClose, item, userId, onAdded }) {
    const [name, setName] = useState("");
    const [caloriesPerGram, setCaloriesPerGram] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [maxWeight, setMaxWeight] = useState("");
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen && item) {
            document.body.style.overflow = "hidden";
            setName(item.food_name || "");
            setCaloriesPerGram(item.calories_per_gram || "");
            setCurrentWeight(item.current_weight || "");
            setMaxWeight(item.max_weight || "");
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
        setCaloriesPerGram("");
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

        try {
            await supabase.from("shelf_items").update({
                food_name: name.trim(),
                calories_per_gram: parseFloat(caloriesPerGram),
                current_weight: parseFloat(currentWeight),
                max_weight: parseFloat(maxWeight),
            }).eq("id", item.id);

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
            <div className="modal-content">
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
