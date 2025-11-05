import React from "react";

// LeaderCard component for displaying individual members
const LeaderCard = ({ name, position, profileImage, rank }) => (
  <div className="flex flex-col items-center text-center w-full sm:w-40 md:w-48 lg:w-56">
    {/* Image */}
    <div className="w-30 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
      <img
        src={profileImage || "/placeholder.svg"}
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>

    {/* Name */}
    <h3 className="mt-3 font-bold text-lg text-gray-800">{name}</h3>

    {/* Position */}
    <p className="text-teal-500 font-semibold text-sm">{position}</p>

    {/* Rank (optional) */}
    {rank && (
      <div className="text-xs text-gray-500 mt-1">
        <span>{rank}</span>
      </div>
    )}
  </div>
);

export default LeaderCard;