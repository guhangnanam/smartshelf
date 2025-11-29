import React, {useState} from "react";
import {supabase} from "../utils/supabaseClient"
import { useToast } from "../context/ToastContext"

export default function AddContainerModal({ isOpen, onClose, userId, onAdded }) {
    const [name, setName] = useState("");
    const [emptyWeight, setEmptyWeight] = useState("");
    const [useScale, setUseScale] = useState(false);
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();

    if (!isOpen) return null;

    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';

    // Restore scrolling and reset state when closing
    const handleClose = () => {
        document.body.style.overflow = 'auto';
        // Clear all form state
        setName("");
        setEmptyWeight("");
        setUseScale(false);
        setErrors({});

        onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Validate form inputs
        if (!name || name.trim().length === 0) {
            newErrors.name = "Container name is required";
        }
        if (name && name.length > 50) {
            newErrors.name = "Container name must be less than 50 characters";
        }
        if (!useScale && (!emptyWeight || parseFloat(emptyWeight) < 0)) {
            newErrors.emptyWeight = "Please enter a valid weight or use scale";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        // Add the new container to the database
        try {
            await supabase.from("containers").insert([
                {
                    user_id: userId,
                    name: name.trim(),
                    empty_weight: useScale ? null : parseFloat(emptyWeight),
                },
            ]);

            addToast(`"${name}" added successfully!`, 'success');
            if (onAdded) {
                onAdded();
            }
        }
        catch (err) {
            console.error("Unexpected error:", err);
            addToast("Failed to add container", 'error');
        }
        finally {
            handleClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add New Container</h3>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Container Name</label>
                        <input
                            type="text"
                            placeholder="Container name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            required
                        />
                        {errors.name && <p className="error-message">{errors.name}</p>}
                    </div>

                    {!useScale && (
                        <div className="form-group">
                            <label className="form-label">Empty Weight (grams)</label>
                            <input
                                type="number"
                                placeholder="Empty weight (grams)"
                                value={emptyWeight}
                                onChange={(e) => setEmptyWeight(e.target.value)}
                                className="form-input"
                                required
                            />
                            {errors.emptyWeight && <p className="error-message">{errors.emptyWeight}</p>}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setUseScale(!useScale)}
                        className="scale-toggle-btn"
                    >
                        {useScale ? "Enter weight manually" : "Calibrate with scale"}
                    </button>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Add Container
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}