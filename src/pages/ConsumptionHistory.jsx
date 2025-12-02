import React, {useEffect, useMemo, useState} from "react";
import {supabase} from "../utils/supabaseClient";
import CalorieRing from "../components/CalorieRing";
import "../styles/consumption.css"

export default function ConsumptionHistory({session, navigate}) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => new Date());

    const userId = session.user.id;

    useEffect(() => {
        if(!userId){
            return;
        }

        async function fetchEvents() {

            setLoading(true);

            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            const {data, error} = await supabase
                .from("consumption_events")
                .select(
                    `
                    id,
                    grams_consumed,
                    servings_consumed,
                    calories_total,
                    protein_total,
                    fat_total,
                    carbs_total,
                    eaten_at,
                    shelf_items ( food_name )
                    `
                ).eq("user_id", userId)
                .gte("eaten_at", start.toISOString())
                .lte("eaten_at", end.toISOString())
                .order("eaten_at", {ascending: false})

            if (error){
                console.error("Error fetching consumption history: ", error);
                setEvents([]);
            }
            else{
                setEvents(data);
            }

            setLoading(false);

        }

        fetchEvents();


    }, [userId, date]);

    // calculate macros for today
    const macroTotals = useMemo(() => {
        let cal = 0;
        let p = 0;
        let f = 0;
        let c = 0;
        events.forEach(e => {
            cal += e.calories_total || 0;
            p += e.protein_total || 0;
            f += e.fat_total || 0;
            c += e.carbs_total || 0;
        });

        return {cal, p, f, c};

    }, [events]);

    const formatTime = (isoString) => {
        const d = new Date(isoString); // Convert ISO to Date object

        // Return like "3:42 PM"
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    };


    // Change UI this is basic stuff
    return (

        <div className="dashboard-container">

            {/* HEADER BAR */}
            <div className="dashboard-header">
                <div className="header-content">
                    {/* Page title */}
                    <h1 className="dashboard-title">Consumption History</h1>

                    {/* Logged in user display */}
                    <p className="user-info">
                        Signed in as: <b>{session.user.email}</b>
                    </p>
                </div>

                <div className="header-buttons">
                    {/* Navigation button: back to Dashboard */}
                    <button
                        className="sign-out-btn"
                        onClick={() => navigate("dashboard")}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>


            {/* MAIN CONTENT AREA */}
            <div className="dashboard-content">
                <div className="date-picker-row">
                    <button className="date-btn" onClick={() => {
                        const d = new Date(date);
                        d.setDate(d.getDate() - 1);
                        setDate(d);
                    }}>
                        ←
                    </button>

                    <input
                        type="date"
                        className="date-input"
                        value={date.toISOString().split("T")[0]}
                        onChange={(e) => setDate(new Date(e.target.value))}
                    />

                    <button className="date-btn" onClick={() => {
                        const d = new Date(date);
                        d.setDate(d.getDate() + 1);
                        setDate(d);
                    }}>
                        →
                    </button>
                </div>

                <CalorieRing calories={macroTotals.cal} goal={2000} />


                {/* LOADING STATE */}
                {loading ? (
                    <p>Loading consumption data...</p>

                    /* EMPTY STATE */
                ) : events.length === 0 ? (
                    <p>No consumption logged today.</p>

                    /* FULL CONTENT */
                ) : (
                    <>
                        {/* ------------------------- */}
                        {/* MACRO SUMMARY CARD GRID   */}
                        {/* ------------------------- */}
                        <div className="macro-summary-grid">
                            <div className="macro-card">
                                Protein: {macroTotals.p.toFixed(1)} g
                            </div>
                            <div className="macro-card">
                                Carbs: {macroTotals.c.toFixed(1)} g
                            </div>
                            <div className="macro-card">
                                Fat: {macroTotals.f.toFixed(1)} g
                            </div>
                        </div>


                        {/* ------------------------- */}
                        {/* TIMELINE SECTION          */}
                        {/* ------------------------- */}
                        <div className="timeline-section">
                            <h2>Timeline</h2>

                            {/* Timeline list */}
                            <div className="timeline-list">
                                {events.map(evt => (
                                    <div key={evt.id} className="timeline-item">

                                        {/* Time stamp */}
                                        <div className="timeline-time">
                                            {formatTime(evt.eaten_at)}
                                        </div>

                                        {/* Food + macro info */}
                                        <div className="timeline-content">

                                            {/* Item name */}
                                            <div className="timeline-title">
                                                {evt.shelf_items?.food_name || "Unknown Item"}
                                            </div>

                                            {/* Expanded macro details */}
                                            <div className="timeline-meta">
                                                <span>{evt.grams_consumed} g</span>
                                                <span>{evt.calories_total.toFixed(1)} kcal</span>
                                                <span>• P {evt.protein_total ?? 0}</span>
                                                <span>• C {evt.carbs_total ?? 0}</span>
                                                <span>• F {evt.fat_total ?? 0}</span>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

}