import React, { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ProgramModal = ({ selectedProgram, setIsModalOpen }) => {
  if (!selectedProgram) return null;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const images = selectedProgram.image || [];

  const next = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const closeModal = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsModalOpen(false);
    }, 300);
  }, [setIsModalOpen]);

  const openViewer = () => {
    if (images.length > 0) {
      setIsImageViewerOpen(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isImageViewerOpen) setIsImageViewerOpen(false);
        else closeModal();
      }
      if (images.length > 1) {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);

  }, [isImageViewerOpen, images.length, closeModal, next, prev]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isAnimatingOut ? "opacity-0" : "opacity-100"
          }`}
        onClick={closeModal}
      ></div>

      {/* Vertical Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-all duration-300 ${isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 z-10 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>

          <div className="relative w-full bg-gray-100 h-70 sm:h-80 md:h-110 flex-shrink-0">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]}
                  alt={selectedProgram.name}
                  className="w-full h-full object-cover rounded-t-3xl cursor-pointer transition-transform duration-300 hover:scale-105"
                  onClick={openViewer}
                />
                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prev();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        next();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                    >
                      <FaChevronRight />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 italic">
                No Image
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {selectedProgram.name}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(selectedProgram.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {selectedProgram.description}
            </p>
          </div>
        </div>
      </div>

      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
          <img
            src={images[currentImageIndex]}
            alt="Full View"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
          />
          <button
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute top-6 right-8 text-white text-3xl hover:text-gray-300"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={next}
                className="absolute right-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ProgramModal;