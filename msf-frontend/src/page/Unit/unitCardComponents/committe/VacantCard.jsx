import React from 'react';

const VacantCard = ({ position }) => (
  <div className="flex flex-col items-center justify-center text-center p-4 h-full">
    <div className="w-24 h-24 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center mb-3">
      <span className="text-slate-500 text-sm font-semibold">Vacant</span>
    </div>
    <h3 className="font-bold text-slate-800">{position}</h3>
  </div>
);

export default VacantCard;