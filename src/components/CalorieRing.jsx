import React from "react";
import "../styles/caloriering.css";

export default function CalorieRing({ calories, goal = 2000 }) {
    const pct = Math.min((calories / goal) * 100, 100);

    return (
        <div className="ring-wrapper">
            <svg className="ring" width="160" height="160">
                <circle
                    className="ring-bg"
                    cx="80"
                    cy="80"
                    r="70"
                />
                <circle
                    className="ring-progress"
                    cx="80"
                    cy="80"
                    r="70"
                    style={{
                        strokeDashoffset: `calc(440 - (440 * ${pct}) / 100)`
                    }}
                />
            </svg>

            <div className="ring-center">
                <div className="ring-cal">{calories.toFixed(0)}</div>
                <div className="ring-label">kcal</div>
            </div>
        </div>
    );
}
