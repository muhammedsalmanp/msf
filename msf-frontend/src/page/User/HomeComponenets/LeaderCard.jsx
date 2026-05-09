import React from "react";

// LeaderCard component for displaying individual members
const LeaderCard = ({ name, position, image, rank }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "15%" }}>
    <div style={{ width: "100%", height: "70%", borderRadius: "50%", overflow: "hidden", border: "4px solid white", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", backgroundColor: "white" }}>
      <img src={image || "/placeholder.svg"} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <h3 style={{ fontWeight: "bold", fontSize: "18px", color: "#1f2937", marginBottom: "4px", margin: 0 }}>{name}</h3>
    <p style={{ color: "#14b8a6", fontWeight: "600", fontSize: "14px", marginBottom: "8px", margin: 0 }}>{position}</p>
    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#6b7280" }}>
      {rank && <span>{rank}</span>}
    </div>
  </div>
);

export default LeaderCard;
