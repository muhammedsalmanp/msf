import React from "react";

const ProgramCard = ({ program, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
  >
    <div className="aspect-video bg-gray-100 flex items-center justify-center">
      {program.image && program.image.length > 0 ? (
        <img
          src={program.image[0]}
          alt={program.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-400 text-sm">No Image</span>
      )}
    </div>
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {new Date(program.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-3">{program.name}</h3>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
        {program.description}
      </p>
    </div>
  </div>
);

export default ProgramCard;