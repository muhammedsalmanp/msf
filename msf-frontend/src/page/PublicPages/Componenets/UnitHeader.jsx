import React from "react";

// UnitHeader component to display the unit's main details
const UnitHeader = ({ unit }) => {
  // Helper function to get the rank name
  const getRankName = (rankNum) => {
    switch (rankNum) {
      case 1:
        return "Colonel";
      case 2:
        return "Major";
      case 3:
        return "Captain";
      case 4:
        return "Lieutenant";
      default:
        return "Unranked";
    }
  };

  return (
    <header className="text-center mb-8 pt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
        {unit.name || "Unit Name"}
      </h1>
      <div className="mt-4 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-600">
        <span>
          Grade:{" "}
          <strong className="text-green-600">{unit.grade || "N/A"}</strong>
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span>
          Rank:{" "}
          <strong className="text-green-600">
            {getRankName(unit.rank) || "N/A"}
          </strong>
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span>
          Score:{" "}
          <strong className="text-green-600">{unit.totalScore || 0}</strong>  
        </span>
      </div>
    </header>
  );
};

export default UnitHeader;