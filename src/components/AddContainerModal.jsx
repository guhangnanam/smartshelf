import React, {useState} from "react";
import {supabase} from "../utils/supabaseClient"

export default function AddContainerModal({ isOpen, onClose, userId }) {
    const [name, setName] = useState("");
    const [emptyWeight, setEmptyWeight] = useState("");
    const [useScale, setUseScale] = useState(false);

    if (!isOpen) return null;

    // disable scrolling on dashboard
    document.body.style.overflow = 'hidden';
    console.log("Session userId:", userId);

    // restore on handle close
    const handleClose = () => {
        document.body.style.overflow = 'auto';
        // reset states
        setName("");
        setEmptyWeight("");
        setUseScale(false);

        onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name) {
            alert("Name is required");
            return;
        }

        // add container to database
        try {
            const { data, error } = await supabase.from("containers").insert([
                {
                    user_id: userId,
                    name: name,
                    empty_weight: useScale ? null : parseFloat(emptyWeight),
                },
            ]);

        }
        catch (err) {
            console.error("Unexpected error:", err);
            alert("Failed to add container");
        }

        handleClose();
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >
            {/* Modal content box */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    width: "350px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <h3 style={{ marginBottom: "12px" }}>Add New Container</h3>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        gap: "12px",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Container name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                        }}
                        required
                    />

                    {!useScale && (
                        <input
                            type="number"
                            placeholder="Empty weight (grams)"
                            value={emptyWeight}
                            onChange={(e) => setEmptyWeight(e.target.value)}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                            }}
                            required
                        />
                    )}

                    <button
                        type="button"
                        onClick={() => setUseScale(!useScale)}
                        style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#f0f0f0",
                            cursor: "pointer",
                        }}
                    >
                        {useScale ? "Enter weight manually" : "Calibrate with scale"}
                    </button>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "10px",
                        }}
                    >
                        <button
                            type="submit"
                            style={{
                                backgroundColor: "#0077cc",
                                color: "white",
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            Add Container
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                backgroundColor: "#ccc",
                                color: "black",
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}