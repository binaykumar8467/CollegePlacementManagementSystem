// Renders a reusable back button for returning to the previous page or fallback route.
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Render a reusable back button with a fallback route.
export default function BackButton({ fallback = "/", label = "Back", className = "btn secondary" }) {
  const navigate = useNavigate();
  const location = useLocation();

// Handle the go back logic used in this file.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    const from = location.state?.from;
    const target = typeof from === "string" ? from : from?.pathname;
    if (target && target !== location.pathname) {
      navigate(target);
      return;
    }

    navigate(fallback);
  };

  return (
    <button type="button" className={className} onClick={goBack}>
      {label}
    </button>
  );
}
