import React from 'react';

const LeaderCard = ({ name, position, profileImage }) => (
  <div className="flex flex-col items-center justify-center text-center p-4 h-full">
    <img
      src={profileImage || `https://api.dicebear.com/8.x/avatar/svg?seed=${name}`}
      alt={name}
      className="w-24 h-24 rounded-full object-cover mb-3 shadow-md border-2 border-white"
    />
    <h3 className="font-bold text-slate-800">{name || "N/A"}</h3>
    <p className="text-sm text-green-600 font-medium">{position}</p>
  </div>
);

export default LeaderCard;