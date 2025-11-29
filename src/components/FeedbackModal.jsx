import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useToast } from "../context/ToastContext";

export default function FeedbackModal({ isOpen, onClose, userId }) {
  const [feedbackType, setFeedbackType] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleClose = () => {
    setTitle("");
    setMessage("");
    setEmail("");
    setFeedbackType("general");
    setErrors({});
    document.body.style.overflow = "auto";
    onClose();
  };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Validate user input
        if (!title || title.trim().length === 0) {
            newErrors.title = "Title is required";
        }
        if (!message || message.trim().length === 0) {
            newErrors.message = "Message is required";
        }
        if (message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
        }
        if (!email || !email.includes("@")) {
            newErrors.email = "Valid email is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            // Save feedback to database
            const { error } = await supabase.from("feedback_comments").insert([
                {
                    user_id: userId,
                    feedback_type: feedbackType,
                    title: title.trim(),
                    message: message.trim(),
                    email: email.trim(),
                    created_at: new Date().toISOString(),
                },
            ]);

            if (error) {
                throw error;
            }

            addToast("Thank you for your feedback! We appreciate your input.", "success");
            handleClose();
        } catch (err) {
            console.error("Error submitting feedback", err);
            addToast("Failed to submit feedback. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Send us your feedback</h3>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Feedback Category Selection */}
          <div className="form-group">
            <label className="form-label">Feedback Type</label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="form-input"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
            </select>
          </div>

          {/* Feedback Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              placeholder="Brief title or subject"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`form-input ${errors.title ? "error" : ""}`}
              required
            />
            {errors.title && <p className="error-message">{errors.title}</p>}
          </div>

          {/* User Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${errors.email ? "error" : ""}`}
              required
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          {/* Feedback Message */}
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              placeholder="Tell us your thoughts, suggestions, or describe the issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`form-input feedback-textarea ${errors.message ? "error" : ""}`}
              rows="5"
              required
            />
            {errors.message && <p className="error-message">{errors.message}</p>}
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>

            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
