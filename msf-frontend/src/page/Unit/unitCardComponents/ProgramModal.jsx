import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";

const ProgramModal = ({ program, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = program.image || [];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl max-w-3xl w-full relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-red-500 z-10"><X size={24} /></button>
        <div className="aspect-video bg-slate-100 relative">
          {images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex} src={images[currentImageIndex]} alt={program.name}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"><ChevronsLeft /></button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"><ChevronsRight /></button>
                </>
              )}
            </>
          ) : <div className="flex items-center justify-center h-full text-slate-400">No Image Available</div>}
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm text-blue-600 font-semibold mb-2">{new Date(program.date).toLocaleDateString()}</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{program.name}</h2>
          <p className="text-slate-600 leading-relaxed max-h-40 overflow-y-auto">{program.description}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgramModal;