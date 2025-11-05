import React from 'react';

// ProgramCard component for displaying program details
const ProgramCard = ({ program }) => (
  <div style={{ display: "flex", gap: "24px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", transition: "background-color 0.2s", cursor: "pointer" }} 
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")} 
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}>
    <img src={program.image || "/placeholder.svg"} alt={program.name} style={{ flexShrink: 0, width: "128px", height: "96px", objectFit: "cover", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
    <div style={{ flex: 1 }}>
      <h4 style={{ fontWeight: "bold", fontSize: "20px", color: "#1f2937", marginBottom: "8px", margin: 0 }}>{program.name}</h4>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px", fontSize: "14px", color: "#6b7280" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📅</span>
          <span style={{ fontWeight: "500" }}>{program.date}</span>
        </div>
        {program.location && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📍</span>
            <span>{program.location}</span>
          </div>
        )}
      </div>
      <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>{program.description}</p>
    </div>
  </div>
);

export default ProgramCard;
