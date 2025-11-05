import React from "react";

// UnitHeader component to display the unit's main details
const UnitHeader = ({ unit }) => { 
  console.log("Rank number:", unit.rank);

  const getRankIcon = (rankNum) => {
    const baseClass = "w-5 h-5 inline-block mr-2";

    switch (rankNum) {
      case 1:
        return <span className={`${baseClass} text-yellow-500`}>🏆</span>; // Colonel
      case 2:
        return <span className={`${baseClass} text-orange-500`}>🥇</span>; // Major
      case 3:
        return <span className={`${baseClass} text-blue-500`}>🏅</span>; // Captain
      case 4:
        return <span className={`${baseClass} text-green-500`}>⭐</span>; // Lieutenant
      default:
        return <span className={`${baseClass} text-gray-500`}>⭐</span>; // Default / rank = 0
    }
  };

  const getRankName = (rankNum) => {
    switch (rankNum) {
      case 1: return "Colonel";
      case 2: return "Major";
      case 3: return "Captain";
      case 4: return "Lieutenant";
      default: return "Unranked";
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-500 text-white px-6 py-10 lg:rounded-t-xl">
      <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">{unit.name}</h1>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-600">
            <span>Grade: <strong className="text-green-600">{unit.grade || 'N/A'}</strong></span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>Rank: <strong className="text-green-600">{unit.rank || "N/A"}</strong></span>
             <span className="text-slate-300 hidden sm:inline">|</span>
            <span>Score: <strong className="text-green-600">{unit.totalScore || 0}</strong></span>
          </div>
        </header>
    </div>
  );
};

export default UnitHeader;

