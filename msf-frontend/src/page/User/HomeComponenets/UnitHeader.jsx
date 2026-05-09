import React from 'react';

// UnitHeader component to display the unit's main details
const UnitHeader = ({ unit }) => {
  const getRankIcon = (rank) => {
    const iconStyle = {
      width: "16px",
      height: "16px",
      display: "inline-block",
      marginRight: "4px",
    };

    // Ensure that rank is a string before calling toLowerCase
    const rankStr = typeof rank === "string" ? rank.toLowerCase() : ""; // If rank is not a string, use an empty string

    switch (rankStr) {
      case "colonel":
        return <span style={{ ...iconStyle, color: "#f59e0b" }}>🏆</span>;
      case "major":
        return <span style={{ ...iconStyle, color: "#f97316" }}>🥇</span>;
      case "captain":
        return <span style={{ ...iconStyle, color: "#3b82f6" }}>🏅</span>;
      case "lieutenant":
        return <span style={{ ...iconStyle, color: "#10b981" }}>⭐</span>;
      default:
        return <span style={{ ...iconStyle, color: "#6b7280" }}>⭐</span>;
    }
  };

  return (
    <div style={{ background: "linear-gradient(to right, #2563eb, #14b8a6, #06b6d4)", color: "white", padding: "32px", paddingBottom: "64px", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px", margin: 0 }}>{unit.name ?  unit.name :'Expected Unit Name'}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: "600" }}>
              {getRankIcon(unit.rank)} <span>{unit.rank || 'Expected Rank'}</span>
            </div>
            <div style={{ backgroundColor: "white", color: "#374151", fontSize: "18px", padding: "8px 16px", borderRadius: "6px", fontWeight: "600" }}>
              {unit.grade || 'Expected Grade'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "8px", margin: 0 }}>{unit.score || '0'}</div>
          <div style={{ fontSize: "18px", opacity: 0.9 }}>Performance Score</div>
        </div>
      </div>
    </div>
  );
};

export default UnitHeader;
