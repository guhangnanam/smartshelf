import React, {useState, useEffect} from "react";
import {supabase} from "../utils/supabaseClient"

export default function AddFoodModal({isOpen, onClose, onAdded, userId}) {

    const [containers, setContainers] = React.useState([]);
    const [selectedContainer, setSelectedContainer] = React.useState(null);
    const [name, setName] = React.useState("");
    const [caloriesPerGram, setCaloriesPerGram] = React.useState("");
    const [currentWeight, setCurrentWeight] = React.useState("");
    const [maxWeight, setMaxWeight] = React.useState("");
    const [useApi, setUseApi] = React.useState(false);
    // set to default for now remember to change later
    const [deviceId, setDeviceId] = React.useState("ShelfESP32_1");


    useEffect(() => {
        if (isOpen){
            document.body.style.overflow = "hidden";
            fetchContainers();
        }
        else{
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        }
    }, [isOpen]);

    async function fetchContainers(){
        // pull the users saved containers
        const {data, error} = await supabase.from("containers").select("id, name").eq("user_id", userId)

        if (error){
            console.error("Error fetching containers", error);
            alert("Failed to fetch containers")
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

        if (!selectedContainer || !name) {
            alert("Please select a container and enter a food name");
            return;
        }

        try{
            const {error} = await supabase.from("shelf_items").insert([
                {
                    user_id: userId,
                    container_id: selectedContainer,
                    food_name: name,
                    calories_per_gram: parseFloat(caloriesPerGram),
                    current_weight: parseFloat(currentWeight),
                    max_weight: parseFloat(maxWeight),
                    device_id: deviceId,
                },
            ]);

            if (error) {
                alert("Insert failed: " + error.message);
                console.error("Supabase insert error:", error);
                return;
            }
        }
        catch (err) {
            console.error("Error fetching containers", err);
            alert("Failed to add shelf item")
        }

        if (typeof onAdded === "function") {
            onAdded();
        }

        handleClose();
    }


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
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    width: "400px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <h3 style={{ marginBottom: "12px" }}>Add Shelf Item</h3>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        gap: "12px",
                    }}
                >
                    {/* Container Dropdown */}
                    <select
                        value={selectedContainer}
                        onChange={(e) => setSelectedContainer(e.target.value)}
                        style={{
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                        }}
                        required
                    >
                        <option value="">Select container...</option>
                        {containers.map((container) => (
                            <option key={container.id} value={container.id}>
                                {container.name}
                            </option>
                        ))}
                    </select>

                    {/* Device ID Dropdown */}
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        style={{
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                        }}
                    >
                        <option value="ShelfESP32_1">ShelfESP32_1</option>
                        {/* add more ESP32s here later */}
                    </select>

                    {/* Toggle: API Search vs Manual */}
                    <button
                        type="button"
                        onClick={() => setUseApi(!useApi)}
                        style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#f0f0f0",
                            cursor: "pointer",
                        }}
                    >
                        {useApi ? "Enter info manually" : "Search food using API"}
                    </button>

                    {/* Manual entry fields */}
                    {!useApi && (
                        <>
                            <input
                                type="text"
                                placeholder="Food name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                }}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Calories per gram"
                                value={caloriesPerGram}
                                onChange={(e) => setCaloriesPerGram(e.target.value)}
                                style={{
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                }}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Current weight (g)"
                                value={currentWeight}
                                onChange={(e) => setCurrentWeight(e.target.value)}
                                style={{
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                }}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Max weight (g)"
                                value={maxWeight}
                                onChange={(e) => setMaxWeight(e.target.value)}
                                style={{
                                    padding: "10px",
                                    borderRadius: "6px",
                                    border: "1px solid #ccc",
                                }}
                                required
                            />
                        </>
                    )}

                    {/* Submit & Cancel */}
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
                                backgroundColor: "#28a745",
                                color: "white",
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            Add Food
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