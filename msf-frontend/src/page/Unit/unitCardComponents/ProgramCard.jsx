import React from 'react';
import { motion } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";

const ProgramCard = ({ program, onSelect, onEdit, onDelete }) => {
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(program._id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(program._id);
  };

  return (
    <motion.div
      onClick={() => onSelect(program)}
      className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden group"
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="aspect-video bg-slate-200 overflow-hidden relative">
        <img
          src={program.image?.[0] || 'https://via.placeholder.com/400x225.png?text=No+Image'}
          alt={program.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={handleEditClick} className="p-2 bg-white/80 hover:bg-white text-blue-600 rounded-full shadow-md" title="Edit Program">
            <Edit size={16} />
          </button>
          <button onClick={handleDeleteClick} className="p-2 bg-white/80 hover:bg-white text-red-500 rounded-full shadow-md" title="Delete Program">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs text-blue-600 font-semibold mb-1">
          {new Date(program.date).toLocaleDateString()}
        </p>
        <h3 className="text-lg font-bold text-slate-800 truncate">{program.name}</h3>
      </div>
    </motion.div>
  );
};

export default ProgramCard;